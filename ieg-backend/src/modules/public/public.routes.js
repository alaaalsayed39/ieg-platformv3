const router = require('express').Router();
const Product = require('../products/product.model');
const User = require('../users/user.model');
const Order = require('../orders/order.model');

/**
 * @swagger
 * /public/stats:
 *   get:
 *     summary: Get public platform statistics
 *     description: Returns public statistics about the IEG platform including users, products, orders, revenue, and supported countries.
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Platform statistics retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 totalUsers: 125
 *                 totalProducts: 560
 *                 totalOrders: 342
 *                 platformRevenue: 125000
 *                 countries: 18
 *       500:
 *         description: Internal server error
 */
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueAgg] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Product.countDocuments({ status: 'published' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalValueUsd' } } },
      ]),
    ]);
    const countries = await User.distinct('country');
    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        platformRevenue: revenueAgg[0]?.total || 0,
        countries: countries.filter(Boolean).length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
