const service    = require('./government.service');
const ApiResponse = require('../../utils/ApiResponse');
const asyncHandler = require('../../utils/asyncHandler');

// POST /api/v1/government/apply
exports.apply = asyncHandler(async (req, res) => {
  const request = await service.apply(req.user._id, req.body, req.files || []);
  res.status(201).json(new ApiResponse(201, request, 'Application submitted successfully'));
});

// GET /api/v1/government/my
exports.getMyRequests = asyncHandler(async (req, res) => {
  const { data, total, page, limit } = await service.getMyRequests(req.user._id, req.query);
  res.json(new ApiResponse(200, { data, total, page, limit }, 'Requests fetched'));
});

// GET /api/v1/government/all  (admin)
exports.getAllRequests = asyncHandler(async (req, res) => {
  const { data, total, page, limit } = await service.getAllRequests(req.query);
  res.json(new ApiResponse(200, { data, total, page, limit }, 'All requests fetched'));
});

// GET /api/v1/government/:id
exports.getById = asyncHandler(async (req, res) => {
  const request = await service.getById(req.params.id);
  res.json(new ApiResponse(200, request, 'Request fetched'));
});

// PATCH /api/v1/government/:id/status  (admin)
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;
  const request = await service.updateStatus(req.params.id, req.user._id, { status, adminNotes });
  res.json(new ApiResponse(200, request, 'Status updated'));
});