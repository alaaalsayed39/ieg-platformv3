const service = require('./shippingRequest.service');
const ApiResponse = require('../../utils/ApiResponse');

const create = async (req, res) => {
  const r = await service.createRequest(req.user._id, req.body);
  ApiResponse.created(res, r, 'Shipping request submitted');
};

const list = async (req, res) => {
  const data = await service.getRequests(req.user, req.query);
  ApiResponse.success(res, data);
};

const eligibleOrders = async (req, res) => {
  const data = await service.getEligibleOrdersForExporter(req.user._id);
  ApiResponse.success(res, data);
};

const review = async (req, res) => {
  const result = await service.reviewRequest(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, result, `Shipping request ${req.body.status}`);
};

module.exports = { create, list, eligibleOrders, review };
