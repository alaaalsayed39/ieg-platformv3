const SupportTicket = require('./support.model');
const ApiError = require('../../utils/ApiError');

// User: create a new ticket
exports.createTicket = async (userId, { subject, message }) => {
  const ticket = await SupportTicket.create({ user: userId, subject, message });
  return ticket;
};

// User: get their own tickets
exports.getMyTickets = async (userId) => {
  const tickets = await SupportTicket.find({ user: userId })
    .sort({ createdAt: -1 });
  return tickets;
};

// Admin: get all tickets
exports.getAllTickets = async ({ status } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  const tickets = await SupportTicket.find(filter)
    .populate('user', 'fullName email role')
    .populate('repliedBy', 'fullName')
    .sort({ createdAt: -1 });
  return tickets;
};

// Admin: reply to a ticket
exports.replyToTicket = async (ticketId, adminId, { reply, status }) => {
  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  ticket.adminReply = reply;
  ticket.repliedAt  = new Date();
  ticket.repliedBy  = adminId;
  if (status) ticket.status = status;
  else ticket.status = 'resolved';

  await ticket.save();
  return ticket;
};

// Admin: get single ticket
exports.getTicketById = async (ticketId) => {
  const ticket = await SupportTicket.findById(ticketId)
    .populate('user', 'fullName email role')
    .populate('repliedBy', 'fullName');
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  return ticket;
};