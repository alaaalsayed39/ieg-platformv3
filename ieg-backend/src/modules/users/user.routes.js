const router = require('express').Router();
const User = require('./user.model');
const ApiResponse = require('../../utils/ApiResponse');
const authenticate = require('../../middleware/authenticate');
const authorize    = require('../../middleware/authorize');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError     = require('../../utils/ApiError');

router.use(authenticate);

// Update own profile
/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               companyName:
 *                 type: string
 *               country:
 *                 type: string
 *               avatarUrl:
 *                 type: string
 *               bankName:
 *                 type: string
 *               bankAccount:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', asyncHandler(async (req, res) => {
  const allowed = ['fullName','phone','companyName','country','avatarUrl','bankName','bankAccount'];
  const update  = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) update[k] = req.body[k]; });
  const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
  ApiResponse.success(res, user, 'Profile updated');
}));

// Admin: get user stats
/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Returns statistics about all users grouped by role.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *       403:
 *         description: Admin access only
 */
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
