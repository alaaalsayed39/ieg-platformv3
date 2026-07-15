const supportService = require('./support.service');
const ApiResponse    = require('../../utils/ApiResponse');
const asyncHandler   = require('../../utils/asyncHandler');

// POST /api/v1/support/tickets
exports.createTicket = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;
  const ticket = await supportService.createTicket(req.user._id, { subject, message });
  res.status(201).json(new ApiResponse(201, ticket, 'Ticket submitted successfully'));
});

// GET /api/v1/support/tickets/my
exports.getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await supportService.getMyTickets(req.user._id);
  res.json(new ApiResponse(200, tickets, 'Tickets fetched'));
});

// GET /api/v1/support/tickets  (admin)
exports.getAllTickets = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const tickets = await supportService.getAllTickets({ status });
  res.json(new ApiResponse(200, tickets, 'All tickets fetched'));
});

// GET /api/v1/support/tickets/:id  (admin)
exports.getTicketById = asyncHandler(async (req, res) => {
  const ticket = await supportService.getTicketById(req.params.id);
  res.json(new ApiResponse(200, ticket, 'Ticket fetched'));
});

// PATCH /api/v1/support/tickets/:id/reply  (admin)
exports.replyToTicket = asyncHandler(async (req, res) => {
  const { reply, status } = req.body;
  const ticket = await supportService.replyToTicket(req.params.id, req.user._id, { reply, status });
  res.json(new ApiResponse(200, ticket, 'Reply sent successfully'));
});