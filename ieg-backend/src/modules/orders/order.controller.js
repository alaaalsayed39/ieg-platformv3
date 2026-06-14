const service = require('./order.service');
const ApiResponse = require('../../utils/ApiResponse');

const createOrder      = async (req, res) => { const o = await service.createOrder(req.user._id, req.body); ApiResponse.created(res, o, 'Order placed successfully'); };
const getOrders        = async (req, res) => { const { data, total, page, limit } = await service.getOrders(req.user, req.query); ApiResponse.paginated(res, data, total, page, limit); };
const getOrder         = async (req, res) => { const o = await service.getOrder(req.user, req.params.id); ApiResponse.success(res, o); };
const updateStatus     = async (req, res) => { const o = await service.updateStatus(req.user, req.params.id, req.body.status, req.body.note); ApiResponse.success(res, o, 'Order status updated'); };
const getStats         = async (req, res) => { const s = await service.getStats(req.user); ApiResponse.success(res, s); };
const createQuote      = async (req, res) => { const q = await service.createQuote(req.user._id, req.body); ApiResponse.created(res, q, 'Quote request sent'); };
const getQuotes        = async (req, res) => { const { data, total, page, limit } = await service.getQuotes(req.user, req.query); ApiResponse.paginated(res, data, total, page, limit); };
const respondToQuote   = async (req, res) => { const q = await service.respondToQuote(req.user._id, req.params.id, req.body); ApiResponse.success(res, q, 'Response sent'); };

const confirmDelivery = async (req, res) => { const o = await service.confirmDelivery(req.user._id, req.params.id); ApiResponse.success(res, o, 'Delivery confirmed — escrow released'); };

module.exports = { createOrder, getOrders, getOrder, updateStatus, getStats, createQuote, getQuotes, respondToQuote, confirmDelivery };
