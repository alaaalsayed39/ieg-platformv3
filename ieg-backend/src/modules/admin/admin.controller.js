const service = require('./admin.service');
const ApiResponse = require('../../utils/ApiResponse');

const getDashboard     = async (req, res) => { ApiResponse.success(res, await service.getDashboard()); };
const getUsers         = async (req, res) => { const r = await service.getUsers(req.query); ApiResponse.paginated(res, r.data, r.total, r.page, r.limit); };
const getUser          = async (req, res) => { ApiResponse.success(res, await service.getUser(req.params.id)); };
const updateUserStatus = async (req, res) => { ApiResponse.success(res, await service.updateUserStatus(req.params.id, req.body), 'User updated'); };
const deleteUser       = async (req, res) => { await service.deleteUser(req.params.id); ApiResponse.noContent(res); };
const getReports       = async (req, res) => { ApiResponse.success(res, await service.getReports(req.query)); };
const getSettings      = async (req, res) => { ApiResponse.success(res, await service.getSettings()); };

module.exports = { getDashboard, getUsers, getUser, updateUserStatus, deleteUser, getReports, getSettings };
