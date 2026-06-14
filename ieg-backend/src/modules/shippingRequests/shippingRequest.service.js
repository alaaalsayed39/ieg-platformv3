const ShippingRequest = require('./shippingRequest.model');
const Order = require('../orders/order.model');
const Shipment = require('../shipments/shipment.model');
const ApiError = require('../../utils/ApiError');
const { generateContainerNumber } = require('../../utils/generateOrderNumber');

const createRequest = async (exporterId, data) => {
  const order = await Order.findById(data.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (!order.exporterId.equals(exporterId)) throw ApiError.forbidden('Not your order');
  if (order.status !== 'processing') throw ApiError.badRequest('Order must be in processing status');
  if (!['held', 'paid'].includes(order.paymentStatus)) {
    throw ApiError.badRequest('Order payment must be held in escrow before requesting shipping');
  }

  const existingShipment = await Shipment.findOne({ orderId: order._id });
  if (existingShipment) throw ApiError.badRequest('Shipment already exists for this order');

  const pending = await ShippingRequest.findOne({ orderId: order._id, status: 'pending' });
  if (pending) throw ApiError.badRequest('A pending shipping request already exists for this order');

  const approved = await ShippingRequest.findOne({ orderId: order._id, status: 'approved' });
  if (approved) throw ApiError.badRequest('Shipping already approved for this order');

  return ShippingRequest.create({
    orderId: order._id,
    exporterId,
    buyerId: order.buyerId,
    originPort: data.originPort,
    destinationPort: data.destinationPort,
    carrier: data.carrier,
    departureDate: data.departureDate,
    eta: data.eta,
    status: 'pending',
  });
};

const getRequests = async (user, query = {}) => {
  const filter = {};
  if (user.role === 'exporter') filter.exporterId = user._id;
  if (user.role === 'shipper') filter.status = query.status || undefined;
  if (user.role === 'buyer') filter.buyerId = user._id;
  if (user.role === 'admin') { /* all */ }
  if (query.status && user.role !== 'shipper') filter.status = query.status;

  return ShippingRequest.find(filter)
    .populate('orderId', 'orderNumber productName totalValueUsd quantity unit')
    .populate('exporterId', 'fullName companyName')
    .populate('buyerId', 'fullName companyName country')
    .populate('shipperId', 'fullName companyName')
    .sort({ createdAt: -1 })
    .lean();
};

const getEligibleOrdersForExporter = async (exporterId) => {
  const orderIdsWithShipment = await Shipment.distinct('orderId');
  const orderIdsWithPending = await ShippingRequest.distinct('orderId', { status: { $in: ['pending', 'approved'] } });

  return Order.find({
    exporterId,
    status: 'processing',
    paymentStatus: { $in: ['held', 'paid'] },
    _id: { $nin: [...orderIdsWithShipment, ...orderIdsWithPending] },
  })
    .sort({ createdAt: -1 })
    .lean();
};

const reviewRequest = async (shipperId, requestId, { status, reviewerNote }) => {
  if (!['approved', 'rejected'].includes(status)) {
    throw ApiError.badRequest('Status must be approved or rejected');
  }

  const request = await ShippingRequest.findById(requestId);
  if (!request) throw ApiError.notFound('Shipping request not found');
  if (request.status !== 'pending') throw ApiError.badRequest('Request already reviewed');

  if (status === 'rejected') {
    request.status = 'rejected';
    request.reviewerNote = reviewerNote;
    request.shipperId = shipperId;
    await request.save();
    return request;
  }

  const order = await Order.findById(request.orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const containerNumber = generateContainerNumber();
  const shipment = await Shipment.create({
    containerNumber,
    orderId: request.orderId,
    shipperId,
    exporterId: request.exporterId,
    buyerId: request.buyerId,
    originPort: request.originPort,
    destinationPort: request.destinationPort,
    carrier: request.carrier,
    departureDate: request.departureDate,
    eta: request.eta,
    stages: [{ stage: 'pickup', location: request.originPort, note: 'Shipment created after shipping request approval' }],
  });

  await Order.findByIdAndUpdate(request.orderId, {
    shipperId,
    status: 'shipped',
    $push: { timeline: { status: 'shipped', note: `Shipment ${containerNumber} approved and created` } },
  });

  request.status = 'approved';
  request.shipperId = shipperId;
  request.reviewerNote = reviewerNote;
  request.shipmentId = shipment._id;
  await request.save();

  const Notification = require('../notifications/notification.model');
  await Notification.insertMany([
    {
      userId: request.exporterId,
      type: 'shipment',
      title: 'Shipping request approved',
      body: `Container ${containerNumber} is now active.`,
      link: '/exporter/shipments',
    },
    {
      userId: request.buyerId,
      type: 'shipment',
      title: 'Your order is shipping',
      body: `Container ${containerNumber} has been assigned.`,
      link: `/buyer/orders/${request.orderId}/shipment`,
    },
  ]);

  return { request, shipment };
};

module.exports = { createRequest, getRequests, getEligibleOrdersForExporter, reviewRequest };
