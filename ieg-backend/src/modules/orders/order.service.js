const Order = require('./order.model');
const QuoteRequest = require('./quoteRequest.model');
const Product = require('../products/product.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');
const { generateOrderNumber } = require('../../utils/generateOrderNumber');
const { sendEmail, emailTemplates } = require('../../utils/email');

// ─── Build role-based filter ───────────────────────────────────────────────────
const _roleFilter = (user) => {
  if (user.role === 'admin')    return {};
  if (user.role === 'exporter') return { exporterId: user._id };
  if (user.role === 'buyer')    return { buyerId: user._id };
  if (user.role === 'shipper')  return { shipperId: user._id };
  return {};
};

// ─── Create Order (Buyer) ──────────────────────────────────────────────────────
const createOrder = async (buyerId, { productId, quantity, deliveryMethod, shipmentMode, insurance, comments }) => {
  // Validate product exists and is published before attempting atomic deduction
  const product = await Product.findById(productId).populate('exporterId', 'fullName email');
  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== 'published') throw ApiError.badRequest('Product is not available');

  // ── Atomic inventory deduction ─────────────────────────────────────────────
  // The filter `inventory.quantity: { $gte: quantity }` ensures we only decrement
  // when sufficient stock exists — this prevents overselling under concurrent load.
  const updatedProduct = await Product.findOneAndUpdate(
    {
      _id: productId,
      status: 'published',
      'inventory.quantity': { $gte: quantity },
    },
    { $inc: { 'inventory.quantity': -quantity } },
    { new: true },
  );

  if (!updatedProduct) {
    // Re-fetch to give a precise error message
    const current = await Product.findById(productId).select('inventory.quantity status');
    if (!current || current.status !== 'published') {
      throw ApiError.badRequest('Product is no longer available');
    }
    throw ApiError.badRequest(
      `Insufficient inventory. Only ${current.inventory.quantity} unit(s) available.`,
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  const totalValueUsd = product.pricing.pricePerUnit * quantity;
  const orderNumber   = generateOrderNumber();

  const order = await Order.create({
    orderNumber,
    exporterId:   product.exporterId._id,
    buyerId,
    productId,
    productName:  product.nameEn,
    quantity,
    unit:         product.pricing.unit,
    totalValueUsd,
    deliveryMethod,
    shipmentMode,
    insurance:    !!insurance,
    comments,
    timeline: [{ status: 'pending', note: 'Order placed by buyer' }],
  });

  // Inventory was already atomically decremented above — no second write needed.

  // Notify exporter
  const { subject, html } = emailTemplates.newOrder(product.exporterId.fullName, orderNumber);
  sendEmail({ to: product.exporterId.email, subject, html });

  return order;
};

// ─── Get Orders (role-filtered) ────────────────────────────────────────────────
const getOrders = async (user, query) => {
  const paymentService = require('../payments/payment.service');
  await paymentService.processAutoConfirmations();

  const { page, limit, skip } = getPagination(query);
  const filter = _roleFilter(user);
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    Order.find(filter)
      .populate('exporterId', 'fullName companyName country')
      .populate('buyerId',    'fullName companyName country')
      .populate('productId',  'nameEn category images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

// ─── Get Single Order ──────────────────────────────────────────────────────────
const getOrder = async (user, orderId) => {
  const filter = { _id: orderId, ..._roleFilter(user) };
  const order = await Order.findOne(filter)
    .populate('exporterId', 'fullName companyName country email phone')
    .populate('buyerId',    'fullName companyName country email phone')
    .populate('shipperId',  'fullName companyName')
    .populate('productId',  'nameEn category images pricing');
  if (!order) throw ApiError.notFound('Order not found');
  return order;
};

// ─── Update Order Status ───────────────────────────────────────────────────────
const updateStatus = async (user, orderId, status, note) => {
  const validTransitions = {
    admin:    ['pending','processing','shipped','in_transit','delivered','cancelled'],
    exporter: ['processing', 'shipped', 'cancelled'],
    shipper:  ['shipped', 'in_transit', 'delivered'],
    buyer:    ['cancelled'],
  };

  const allowed = validTransitions[user.role] || [];
  if (!allowed.includes(status)) {
    throw ApiError.forbidden(`Your role cannot set status to "${status}"`);
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId, ..._roleFilter(user) },
    {
      status,
      $push: { timeline: { status, note: note || `Status updated to ${status}`, changedBy: user._id } },
      ...(status === 'delivered'
        ? { deliveredAt: new Date(), awaitingDeliveryConfirmation: true }
        : {}),
      ...(status === 'cancelled'
        ? { cancelledAt: new Date(), cancelReason: note || 'Cancelled' }
        : {}),
    },
    { new: true }
  ).populate('buyerId', 'fullName email').populate('exporterId', 'fullName email');

  if (!order) throw ApiError.notFound('Order not found');

  if (status === 'delivered' && order.paymentStatus === 'held') {
    const Notification = require('../notifications/notification.model');
    const grace = parseInt(process.env.ESCROW_GRACE_PERIOD_DAYS || '7', 10);
    await Notification.create({
      userId: order.buyerId,
      type: 'order',
      title: 'Confirm delivery to release payment',
      body: `Order ${order.orderNumber} was delivered. Confirm receipt or escrow auto-releases in ${grace} days.`,
      link: '/buyer/orders',
    }).catch(() => {});
  }

  if (status === 'cancelled') {
    const paymentService = require('../payments/payment.service');

    // ── Restore inventory atomically ──────────────────────────────────────────
    if (order.productId && order.quantity) {
      await Product.findByIdAndUpdate(
        order.productId,
        { $inc: { 'inventory.quantity': order.quantity } },
      ).catch(() => {}); // non-fatal; log only
    }

    // ── Refund escrow if funds were held ─────────────────────────────────────
    if (order.paymentStatus === 'held') {
      await paymentService.refundEscrow(orderId, note || 'Order cancelled');
    }

    // ── Notify exporter that an order was cancelled ───────────────────────────
    const Notification = require('../notifications/notification.model');
    await Notification.create({
      userId: order.exporterId,
      type: 'order',
      title: `Order ${order.orderNumber} cancelled`,
      body: `Order ${order.orderNumber} has been cancelled${order.paymentStatus === 'held' ? ' and the escrow has been refunded to the buyer' : ''}.`,
      link: '/exporter/orders',
    }).catch(() => {});
  }

  try {
    const { emitOrderUpdate } = require('../../sockets/socket');
    emitOrderUpdate(order);
  } catch (_) { /* socket optional */ }

  // Notify relevant parties
  const emailUser = user.role === 'exporter' ? order.buyerId : order.exporterId;
  const { subject, html } = emailTemplates.orderStatusUpdate(emailUser.fullName, order.orderNumber, status);
  sendEmail({ to: emailUser.email, subject, html });

  return order;
};

// ─── Dashboard Stats ───────────────────────────────────────────────────────────
const getStats = async (user) => {
  const filter = _roleFilter(user);
  const [total, processing, shipped, delivered, cancelled] = await Promise.all([
    Order.countDocuments(filter),
    Order.countDocuments({ ...filter, status: 'processing' }),
    Order.countDocuments({ ...filter, status: 'shipped' }),
    Order.countDocuments({ ...filter, status: 'delivered' }),
    Order.countDocuments({ ...filter, status: 'cancelled' }),
  ]);
  const revenueAgg = await Order.aggregate([
    { $match: { ...filter, status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalValueUsd' } } },
  ]);
  const totalRevenue = revenueAgg[0]?.total || 0;
  let uniqueBuyers = 0;
  if (user.role === 'exporter') {
    const buyers = await Order.distinct('buyerId', filter);
    uniqueBuyers = buyers.length;
  }
  return { total, processing, shipped, delivered, cancelled, totalRevenue, uniqueBuyers };
};

// ─── Quote Requests ────────────────────────────────────────────────────────────
const createQuote = async (buyerId, data) => {
  let exporterId = data.exporterId;
  if (data.productId) {
    const product = await Product.findById(data.productId).select('exporterId nameEn');
    if (!product) throw ApiError.notFound('Product not found');
    exporterId = product.exporterId;
    if (!data.productType) data.productType = product.nameEn;
  }
  if (!exporterId) throw ApiError.badRequest('Exporter is required');

  const quote = await QuoteRequest.create({
    buyerId,
    exporterId,
    productId: data.productId,
    productType: data.productType,
    quantity: data.quantity,
    budgetMin: data.budgetMin,
    budgetMax: data.budgetMax,
    deliveryTimeline: data.deliveryTimeline,
    specialRequirements: data.specialRequirements,
    status: 'new',
  });

  const Notification = require('../notifications/notification.model');
  await Notification.create({
    userId: exporterId,
    type: 'order',
    title: 'New quote request',
    body: `A buyer requested a quote for ${data.productType || 'your product'}`,
    link: '/exporter/purchase-requests',
  });

  return quote;
};

const getQuotes = async (user, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = user.role === 'buyer' ? { buyerId: user._id } : { exporterId: user._id };
  if (query.status && query.status !== 'all') filter.status = query.status;

  const [data, total] = await Promise.all([
    QuoteRequest.find(filter)
      .populate('buyerId',    'fullName companyName country')
      .populate('exporterId', 'fullName companyName')
      .populate('productId',  'nameEn images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    QuoteRequest.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

const respondToQuote = async (exporterId, quoteId, { status, responderNote }) => {
  const quote = await QuoteRequest.findOne({ _id: quoteId, exporterId });
  if (!quote) throw ApiError.notFound('Quote request not found');
  if (quote.orderId && status === 'accepted') {
    throw ApiError.badRequest('An order already exists for this quote');
  }

  quote.status = status;
  quote.responderNote = responderNote;
  await quote.save();

  let order = null;
  if (status === 'accepted') {
    order = await _createOrderFromQuote(quote);
    quote.orderId = order._id;
    await quote.save();
  }

  const Notification = require('../notifications/notification.model');
  await Notification.create({
    userId: quote.buyerId,
    type: 'order',
    title: status === 'accepted' ? 'Quote accepted' : 'Quote updated',
    body: status === 'accepted'
      ? `Your quote was accepted. Order ${order.orderNumber} is ready for payment.`
      : `The exporter responded to your quote (${status}).`,
    link: '/buyer/orders',
  });

  return QuoteRequest.findById(quote._id)
    .populate('buyerId', 'fullName email companyName')
    .populate('productId', 'nameEn')
    .populate('orderId', 'orderNumber status paymentStatus');
};

const _createOrderFromQuote = async (quote) => {
  if (!quote.productId) throw ApiError.badRequest('Quote must reference a product to create an order');
  if (!quote.quantity || quote.quantity <= 0) throw ApiError.badRequest('Quote quantity is required');

  const product = await Product.findById(quote.productId);
  if (!product) throw ApiError.notFound('Product not found');
  if (product.status !== 'published') throw ApiError.badRequest('Product is not available for ordering');

  // ── Atomic inventory deduction (prevents overselling from concurrent quotes) ──
  const updatedProduct = await Product.findOneAndUpdate(
    {
      _id: quote.productId,
      status: 'published',
      'inventory.quantity': { $gte: quote.quantity },
    },
    { $inc: { 'inventory.quantity': -quote.quantity } },
    { new: true },
  );

  if (!updatedProduct) {
    const current = await Product.findById(quote.productId).select('inventory.quantity');
    throw ApiError.badRequest(
      `Insufficient inventory. Only ${current?.inventory?.quantity ?? 0} unit(s) available.`,
    );
  }
  // ──────────────────────────────────────────────────────────────────────────

  const orderNumber = generateOrderNumber();
  const order = await Order.create({
    orderNumber,
    exporterId: quote.exporterId,
    buyerId: quote.buyerId,
    productId: quote.productId,
    productName: product.nameEn,
    quantity: quote.quantity,
    unit: product.pricing.unit,
    totalValueUsd: product.pricing.pricePerUnit * quote.quantity,
    deliveryMethod: 'Sea',
    shipmentMode: 'Standard',
    insurance: false,
    comments: quote.specialRequirements,
    timeline: [{ status: 'pending', note: 'Order created from accepted quote' }],
  });

  // Inventory already decremented atomically above.
  return order;
};

const confirmDelivery = async (buyerId, orderId) => {
  const order = await Order.findOne({ _id: orderId, buyerId });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.status !== 'delivered') throw ApiError.badRequest('Order must be delivered before confirmation');
  if (order.paymentStatus !== 'held') throw ApiError.badRequest('No escrow held for this order');
  if (order.deliveryConfirmedAt) throw ApiError.badRequest('Delivery already confirmed');

  const paymentService = require('../payments/payment.service');
  await paymentService.confirmDelivery(orderId, { confirmedByUserId: buyerId });
  return Order.findById(orderId)
    .populate('exporterId', 'fullName companyName')
    .populate('buyerId', 'fullName companyName');
};

module.exports = { createOrder, getOrders, getOrder, updateStatus, getStats, createQuote, getQuotes, respondToQuote, _createOrderFromQuote, confirmDelivery };
