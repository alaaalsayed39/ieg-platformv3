const router = require('express').Router();
const User = require('./user.model');
const ApiResponse = require('../../utils/ApiResponse');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError     = require('../../utils/ApiError');

router.use(authenticate);

// Update own profile
router.put('/profile', asyncHandler(async (req, res) => {
  const allowed = ['fullName','phone','companyName','country','avatarUrl','bankName','bankAccount'];
  const update  = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
  ApiResponse.success(res, user, 'Profile updated');
}));

// Admin: get user stats
router.get('/stats', authorize('admin'), asyncHandler(async (req, res) => {
  const [total, exporters, buyers, shippers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'exporter' }),
    User.countDocuments({ role: 'buyer' }),
    User.countDocuments({ role: 'shipper' }),
  ]);
  ApiResponse.success(res, { total, exporters, buyers, shippers });
}));

module.exports = router;
