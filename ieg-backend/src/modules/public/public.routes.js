const router = require('express').Router();
const Product = require('../products/product.model');
const User = require('../users/user.model');
const Order = require('../orders/order.model');

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
