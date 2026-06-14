const service = require('./notification.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll      = async (req, res) => { const r = await service.getMyNotifications(req.user._id, req.query); ApiResponse.paginated(res, r.data, r.total, r.page, r.limit, 'Notifications fetched'); };
const markRead    = async (req, res) => { const n = await service.markRead(req.user._id, req.params.id); ApiResponse.success(res, n, 'Marked as read'); };
const markAllRead = async (req, res) => { await service.markAllRead(req.user._id); ApiResponse.success(res, null, 'All marked as read'); };

module.exports = { getAll, markRead, markAllRead };
