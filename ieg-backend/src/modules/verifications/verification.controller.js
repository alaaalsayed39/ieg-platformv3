const service = require('./verification.service');
const ApiResponse = require('../../utils/ApiResponse');

const submit      = async (req, res) => { ApiResponse.created(res, await service.submit(req.user._id, req.body), 'Verification submitted'); };
const getMyStatus = async (req, res) => { ApiResponse.success(res, await service.getMyStatus(req.user._id)); };
const getAll      = async (req, res) => { const r = await service.getAll(req.query); ApiResponse.paginated(res, r.data, r.total, r.page, r.limit); };
const review      = async (req, res) => { ApiResponse.success(res, await service.review(req.user._id, req.params.id, req.body), 'Reviewed'); };

module.exports = { submit, getMyStatus, getAll, review };
