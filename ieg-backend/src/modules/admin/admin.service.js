const User = require('../users/user.model');
const Order = require('../orders/order.model');
const Product = require('../products/product.model');
const Document = require('../documents/document.model');
const paymentService = require('../payments/payment.service');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');

const getDashboard = async () => {
  await paymentService.processAutoConfirmations();
  const financial = await paymentService.getAdminFinancialStats();

  const [totalUsers, activeExporters, pendingVerifications, totalOrders, pendingDocuments, recentUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'exporter', isActive: true }),
    User.countDocuments({ role: { $in: ['exporter', 'shipper'] }, isVerified: false }),
    Order.countDocuments(),
    Document.countDocuments({ status: { $in: ['pending_review', 'pending'] } }),
    User.find().sort({ createdAt: -1 }).limit(5).select('fullName role country createdAt isVerified').lean(),
  ]);
  const userGrowth = await User.aggregate([
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);
  return {
    stats: {
      totalUsers,
      activeExporters,
      pendingVerifications,
      totalOrders,
      pendingDocuments,
      platformRevenue: financial.totalPlatformRevenue,
      totalEscrowBalance: financial.totalEscrowBalance,
      totalReleasedPayments: financial.totalReleasedPayments,
      totalTransactionVolume: financial.totalTransactionVolume,
      escrowOrderCount: financial.escrowOrderCount,
    },
    financial,
    recentUsers,
    userGrowth: userGrowth.reverse(),
    productCategories: await Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    systemHealth: { dbStatus: 'online', apiUptime: process.uptime ? `${Math.floor(process.uptime() / 3600)}h` : 'N/A' },
  };
};

const getUsers = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.role) filter.role = query.role;
  if (query.status) filter.isActive = query.status === 'active';
  if (query.q) filter.$or = [{ fullName: { $regex: query.q, $options: 'i' } }, { email: { $regex: query.q, $options: 'i' } }];
  const [data, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(filter)]);
  return { data, total, page, limit };
};

const getUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const updateUserStatus = async (userId, body) => {
  const update = {};
  if (body.isActive !== undefined) update.isActive = body.isActive;
  if (body.isVerified !== undefined) update.isVerified = body.isVerified;
  if (body.subscription) update.subscription = body.subscription;
  const user = await User.findByIdAndUpdate(userId, update, { new: true });
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw ApiError.notFound('User not found');
};

const getReports = async (query) => {
  const year = parseInt(query.year, 10) || new Date().getFullYear();
  const productCategories = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const [revenueByRegion, monthlyRevenue, platformFees] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $lookup: { from: 'users', localField: 'buyerId', foreignField: '_id', as: 'buyer' } },
      { $unwind: '$buyer' },
      { $group: { _id: '$buyer.country', revenue: { $sum: '$totalValueUsd' }, count: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'released', createdAt: { $gte: new Date(`${year}-01-01`) } } },
      { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$exporterPayoutUsd' } } },
      { $sort: { _id: 1 } },
    ]),
    paymentService.getAdminFinancialStats(),
  ]);
  return { year, revenueByRegion, productCategories, monthlyRevenue, platformFees };
};

const getSettings = async () => ({
  platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5'),
  escrowGracePeriodDays: parseInt(process.env.ESCROW_GRACE_PERIOD_DAYS || '7', 10),
  smtpConfigured: !!process.env.SMTP_USER,
  twoFactorEnabled: false,
  maintenanceMode: false,
});

module.exports = { getDashboard, getUsers, getUser, updateUserStatus, deleteUser, getReports, getSettings };
