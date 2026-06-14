const service = require('./payment.service');
const ApiResponse = require('../../utils/ApiResponse');

const getWallet       = async (req, res) => { const w = await service.getWallet(req.user._id); ApiResponse.success(res, w); };
const getTransactions = async (req, res) => { const { data, total, page, limit } = await service.getTransactions(req.user._id, req.query); ApiResponse.paginated(res, data, total, page, limit); };
const deposit         = async (req, res) => { const t = await service.deposit(req.user._id, req.body); ApiResponse.created(res, t, 'Funds added successfully'); };
const withdraw        = async (req, res) => { const t = await service.withdraw(req.user._id, req.body); ApiResponse.created(res, t, 'Withdrawal request submitted'); };
const payForOrder     = async (req, res) => { const t = await service.payForOrder(req.user._id, req.params.orderId); ApiResponse.success(res, t, 'Payment held successfully'); };
const getStats        = async (req, res) => { const s = await service.getStats(req.user._id, req.query); ApiResponse.success(res, s); };

module.exports = { getWallet, getTransactions, deposit, withdraw, payForOrder, getStats };
