const Shipment = require('./shipment.model');
const Order    = require('../orders/order.model');
const QuoteRequest = require('../orders/quoteRequest.model');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');
const { generateContainerNumber } = require('../../utils/generateOrderNumber');
const { buildPdf } = require('../../utils/simplePdf');

const _roleFilter = (user) => {
  if (user.role === 'admin')    return {};
  if (user.role === 'shipper')  return { shipperId: user._id };
  if (user.role === 'exporter') return { exporterId: user._id };
  if (user.role === 'buyer')    return { buyerId: user._id };
  return {};
};

const _fetchShipmentsForReport = async (user) => {
  const filter = _roleFilter(user);
  return Shipment.find(filter)
    .populate('orderId', 'orderNumber productName totalValueUsd')
    .populate('buyerId', 'fullName companyName country')
    .populate('exporterId', 'fullName companyName')
    .sort({ createdAt: -1 })
    .lean();
};

const createShipment = async (shipperId, { orderId, originPort, destinationPort, carrier, departureDate, eta }) => {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (!['processing'].includes(order.status)) {
    throw ApiError.badRequest('Order must be in processing status before creating a shipment');
  }
  if (order.shipperId && !order.shipperId.equals(shipperId)) {
    throw ApiError.forbidden('This order is assigned to another shipper');
  }

  const existing = await Shipment.findOne({ orderId });
  if (existing) throw ApiError.badRequest('A shipment already exists for this order');

  const containerNumber = generateContainerNumber();
  const shipment = await Shipment.create({
    containerNumber,
    orderId,
    shipperId,
    exporterId: order.exporterId,
    buyerId:    order.buyerId,
    originPort,
    destinationPort,
    carrier,
    departureDate,
    eta,
    stages: [{ stage: 'pickup', location: originPort, note: 'Shipment created and awaiting pickup' }],
  });

  await Order.findByIdAndUpdate(orderId, {
    shipperId,
    status: 'shipped',
    $push: { timeline: { status: 'shipped', note: `Shipment ${containerNumber} created` } },
  });

  return shipment.populate([
    { path: 'orderId', select: 'orderNumber productName totalValueUsd' },
    { path: 'buyerId', select: 'fullName companyName' },
  ]);
};

const getAvailableOrders = async () => {
  const orderIdsWithShipment = await Shipment.distinct('orderId');
  const shippedSet = new Set(orderIdsWithShipment.map((id) => id.toString()));

  const eligible = await Order.find({
    status: 'processing',
    _id: { $nin: orderIdsWithShipment },
    paymentStatus: { $in: ['held', 'paid'] },
  })
    .populate('exporterId', 'fullName companyName country')
    .populate('buyerId', 'fullName companyName country')
    .sort({ createdAt: -1 })
    .lean();

  const [recentOrders, openQuotes] = await Promise.all([
    Order.find({ status: { $nin: ['cancelled', 'delivered'] } })
      .populate('exporterId', 'fullName companyName')
      .populate('buyerId', 'fullName companyName')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
    QuoteRequest.find({ status: { $in: ['new', 'pending', 'negotiating', 'accepted'] } })
      .populate('buyerId', 'fullName companyName')
      .populate('exporterId', 'fullName companyName')
      .populate('productId', 'nameEn')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  const blocked = [];
  const eligibleIds = new Set(eligible.map((o) => o._id.toString()));

  for (const q of openQuotes) {
    if (['new', 'pending', 'negotiating'].includes(q.status)) {
      blocked.push({
        kind: 'quote',
        id: q._id,
        reference: q.productType || q.productId?.nameEn || 'Quote request',
        buyer: q.buyerId?.companyName || q.buyerId?.fullName,
        exporter: q.exporterId?.companyName || q.exporterId?.fullName,
        ineligibilityReason: 'awaiting_exporter_response',
        createdAt: q.createdAt,
      });
    } else if (q.status === 'accepted' && !q.orderId) {
      blocked.push({
        kind: 'quote',
        id: q._id,
        reference: q.productType || q.productId?.nameEn || 'Accepted quote',
        ineligibilityReason: 'awaiting_order_creation',
        createdAt: q.createdAt,
      });
    }
  }

  for (const o of recentOrders) {
    const oid = o._id.toString();
    if (eligibleIds.has(oid)) continue;

    let ineligibilityReason = null;
    if (shippedSet.has(oid) || ['shipped', 'in_transit', 'delivered'].includes(o.status)) {
      ineligibilityReason = 'already_shipped';
    } else if (o.status === 'pending' && o.paymentStatus === 'unpaid') {
      ineligibilityReason = 'awaiting_payment';
    } else if (o.paymentStatus === 'held' && o.status !== 'processing') {
      ineligibilityReason = 'awaiting_processing';
    } else if (o.status === 'processing' && !['held', 'paid'].includes(o.paymentStatus)) {
      ineligibilityReason = 'awaiting_payment';
    }

    if (ineligibilityReason) {
      blocked.push({
        kind: 'order',
        id: o._id,
        reference: o.orderNumber,
        productName: o.productName,
        buyer: o.buyerId?.companyName || o.buyerId?.fullName,
        exporter: o.exporterId?.companyName || o.exporterId?.fullName,
        status: o.status,
        paymentStatus: o.paymentStatus,
        ineligibilityReason,
        createdAt: o.createdAt,
      });
    }
  }

  return { eligible, blocked };
};

const getShipments = async (user, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = _roleFilter(user);
  if (query.status) filter.status = query.status;
  if (query.search?.trim()) {
    filter.containerNumber = { $regex: query.search.trim(), $options: 'i' };
  }

  const [data, total] = await Promise.all([
    Shipment.find(filter)
      .populate('orderId',   'orderNumber totalValueUsd productName')
      .populate('shipperId', 'fullName companyName')
      .populate('buyerId',   'fullName companyName country')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Shipment.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

const getShipment = async (user, shipmentId) => {
  const filter = { _id: shipmentId, ..._roleFilter(user) };
  const shipment = await Shipment.findOne(filter)
    .populate('orderId',   'orderNumber totalValueUsd productName quantity unit')
    .populate('shipperId', 'fullName companyName phone email')
    .populate('buyerId',   'fullName companyName country')
    .populate('exporterId','fullName companyName');
  if (!shipment) throw ApiError.notFound('Shipment not found');
  return shipment;
};

const getShipmentByOrder = async (user, orderId) => {
  const orderFilter = { _id: orderId, ..._roleFilter(user) };
  const order = await Order.findOne(orderFilter).select('_id');
  if (!order) throw ApiError.notFound('Order not found');

  const shipment = await Shipment.findOne({ orderId })
    .populate('orderId',   'orderNumber totalValueUsd productName quantity unit')
    .populate('shipperId', 'fullName companyName phone email')
    .populate('buyerId',   'fullName companyName country')
    .populate('exporterId','fullName companyName');
  if (!shipment) throw ApiError.notFound('No shipment found for this order');
  return shipment;
};

const getStats = async (user) => {
  const filter = _roleFilter(user);
  const [total, pickup, customs_cleared, in_transit, arrived, delivered, delayed] = await Promise.all([
    Shipment.countDocuments(filter),
    Shipment.countDocuments({ ...filter, status: 'pickup' }),
    Shipment.countDocuments({ ...filter, status: 'customs_cleared' }),
    Shipment.countDocuments({ ...filter, status: 'in_transit' }),
    Shipment.countDocuments({ ...filter, status: 'arrived' }),
    Shipment.countDocuments({ ...filter, status: 'delivered' }),
    Shipment.countDocuments({ ...filter, status: 'delayed' }),
  ]);

  const active = pickup + customs_cleared + in_transit + arrived;

  return { total, active, pickup, customs_cleared, in_transit, arrived, delivered, delayed };
};

const updateStatus = async (shipperId, shipmentId, { status, location, note, lat, lng }) => {
  const shipment = await Shipment.findOne({ _id: shipmentId, shipperId });
  if (!shipment) throw ApiError.notFound('Shipment not found');

  shipment.status = status;
  if (lat != null) shipment.currentLat = lat;
  if (lng != null) shipment.currentLng = lng;
  if (location) {
    shipment.currentLocation = location;
  }

  if (status === 'in_transit') {
    await Order.findByIdAndUpdate(shipment.orderId, {
      status: 'in_transit',
      $push: { timeline: { status: 'in_transit', note: note || 'Shipment in transit' } },
    });
  } else if (status === 'delivered') {
    const paymentService = require('../payments/payment.service');
    await paymentService.markAwaitingDeliveryConfirmation(shipment.orderId);
  }

  shipment.stages.push({ stage: status, location, note, lat, lng });
  await shipment.save();
  return shipment;
};

const exportReport = async (user) => {
  const shipments = await _fetchShipmentsForReport(user);

  const headers = ['Container', 'Order', 'Product', 'Origin', 'Destination', 'Carrier', 'Status', 'ETA', 'Value USD'];
  const rows = shipments.map((s) => [
    s.containerNumber,
    s.orderId?.orderNumber || '',
    s.orderId?.productName || '',
    s.originPort,
    s.destinationPort,
    s.carrier || '',
    s.status,
    s.eta ? new Date(s.eta).toISOString().slice(0, 10) : '',
    s.orderId?.totalValueUsd || '',
  ]);

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  return { csv, filename: `shipments-report-${Date.now()}.csv`, count: shipments.length };
};

const exportReportPdf = async (user) => {
  const shipments = await _fetchShipmentsForReport(user);
  const lines = [
    'IEG Platform — Shipment Report',
    `Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`,
    `Total shipments: ${shipments.length}`,
    '',
  ];

  shipments.forEach((s, idx) => {
    lines.push(
      `${idx + 1}. ${s.containerNumber} | ${s.orderId?.orderNumber || 'N/A'}`,
      `   Product: ${s.orderId?.productName || 'N/A'} | Status: ${s.status}`,
      `   Route: ${s.originPort} -> ${s.destinationPort}`,
      `   Carrier: ${s.carrier || 'N/A'} | ETA: ${s.eta ? new Date(s.eta).toISOString().slice(0, 10) : 'N/A'}`,
      `   Value USD: ${s.orderId?.totalValueUsd ?? 'N/A'}`,
      ''
    );
  });

  const pdf = buildPdf(lines.slice(0, 52));
  return { pdf, filename: `shipments-report-${Date.now()}.pdf`, count: shipments.length };
};

const updateLocation = async (shipperId, shipmentId, { lat, lng, location }) => {
  const shipment = await Shipment.findOneAndUpdate(
    { _id: shipmentId, shipperId },
    { currentLat: lat, currentLng: lng, currentLocation: location },
    { new: true }
  );
  if (!shipment) throw ApiError.notFound('Shipment not found');
  return shipment;
};

module.exports = {
  createShipment,
  getAvailableOrders,
  getShipments,
  getShipment,
  getShipmentByOrder,
  getStats,
  updateStatus,
  updateLocation,
  exportReport,
  exportReportPdf,
};
