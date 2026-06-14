/**
 * wallet.model.js is the canonical source for the Mongoose "Transaction" model.
 * It was originally named wallet.model.js for historical reasons but it actually
 * defines transaction records (escrow holds, releases, payments, refunds).
 * We import it as WalletTransaction here to make the intent explicit, and keep
 * a `Transaction` alias for all internal usages below.
 */
const WalletTransaction = require('./wallet.model'); // Mongoose model name: "Transaction"
const Transaction = WalletTransaction;               // internal alias for readability
const Order = require('../orders/order.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');

const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5') / 100;
const GRACE_PERIOD_DAYS = parseInt(process.env.ESCROW_GRACE_PERIOD_DAYS || '7', 10);

const round2 = (n) => Math.round(n * 100) / 100;

const readBalances = (user) => {
  const available = user.availableBalance ?? user.walletBalance ?? 0;
  const held = user.heldBalance ?? 0;
  return { available, held };
};

const writeBalances = async (userId, { availableDelta = 0, heldDelta = 0 }) => {
  const user = await User.findById(userId);
  if (!user) throw ApiError.notFound('User not found');
  const { available, held } = readBalances(user);
  const nextAvailable = round2(available + availableDelta);
  const nextHeld = round2(held + heldDelta);
  if (nextAvailable < -0.001) throw ApiError.badRequest('Insufficient available balance');
  if (nextHeld < -0.001) throw ApiError.badRequest('Insufficient held balance');

  const updated = await User.findByIdAndUpdate(
    userId,
    {
      availableBalance: nextAvailable,
      heldBalance: nextHeld,
      walletBalance: nextAvailable,
    },
    { new: true },
  );
  return { available: nextAvailable, held: nextHeld, user: updated };
};

const recordTxn = async ({
  userId,
  buyerId,
  exporterId,
  orderId,
  transactionType,
  amountUsd,
  description,
  status = 'completed',
  reference,
  availableBalanceAfter,
  heldBalanceAfter,
}) => {
  return Transaction.create({
    userId,
    buyerId: buyerId || null,
    exporterId: exporterId || null,
    orderId: orderId || null,
    transactionType,
    type: transactionType,
    amountUsd: round2(amountUsd),
    description,
    status,
    reference,
    availableBalanceAfter,
    heldBalanceAfter,
    balanceAfter: availableBalanceAfter,
  });
};

const getWallet = async (userId) => {
  const user = await User.findById(userId).select(
    'availableBalance heldBalance walletBalance pendingBalance bankName bankAccount role',
  );
  if (!user) throw ApiError.notFound('User not found');
  const { available, held } = readBalances(user);
  return {
    availableBalance: available,
    heldBalance: held,
    balance: available,
    pending: held,
    bankName: user.bankName,
    bankAccount: user.bankAccount,
  };
};

const getTransactions = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { userId };
  if (query.type) filter.transactionType = query.type;
  if (query.transactionType) filter.transactionType = query.transactionType;

  const [data, total] = await Promise.all([
    Transaction.find(filter)
      .populate('orderId', 'orderNumber productName')
      .populate('buyerId', 'fullName companyName')
      .populate('exporterId', 'fullName companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

const deposit = async (userId, { amount, description }) => {
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
  const balances = await writeBalances(userId, { availableDelta: amount });
  return recordTxn({
    userId,
    transactionType: 'deposit',
    amountUsd: amount,
    description: description || 'Funds added to wallet',
    availableBalanceAfter: balances.available,
    heldBalanceAfter: balances.held,
  });
};

const withdraw = async (userId, { amount, description }) => {
  if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
  const user = await User.findById(userId);
  const { available } = readBalances(user);
  if (available < amount) throw ApiError.badRequest('Insufficient available balance — held escrow cannot be withdrawn');

  const balances = await writeBalances(userId, { availableDelta: -amount });
  return recordTxn({
    userId,
    transactionType: 'withdrawal',
    amountUsd: -amount,
    description: description || 'Withdrawal to bank account',
    status: 'pending',
    availableBalanceAfter: balances.available,
    heldBalanceAfter: balances.held,
  });
};

const payForOrder = async (buyerId, orderId) => {
  const order = await Order.findOne({ _id: orderId, buyerId });
  if (!order) throw ApiError.notFound('Order not found');
  if (order.paymentStatus !== 'unpaid') throw ApiError.badRequest('Order already paid');

  const buyer = await User.findById(buyerId);
  const { available } = readBalances(buyer);
  if (available < order.totalValueUsd) {
    throw ApiError.badRequest('Insufficient wallet balance. Please add funds.');
  }

  const buyerBalances = await writeBalances(buyerId, { availableDelta: -order.totalValueUsd });
  const exporterBalances = await writeBalances(order.exporterId, { heldDelta: order.totalValueUsd });

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'held',
    status: 'processing',
    escrowHeldAt: new Date(),
    awaitingDeliveryConfirmation: false,
    $push: { timeline: { status: 'processing', note: 'Payment held in platform escrow — awaiting shipment & delivery confirmation' } },
  });

  await recordTxn({
    userId: buyerId,
    buyerId,
    exporterId: order.exporterId,
    orderId,
    transactionType: 'payment',
    amountUsd: -order.totalValueUsd,
    description: `Payment for Order ${order.orderNumber}`,
    reference: order.orderNumber,
    availableBalanceAfter: buyerBalances.available,
    heldBalanceAfter: buyerBalances.held,
  });

  await recordTxn({
    userId: buyerId,
    buyerId,
    exporterId: order.exporterId,
    orderId,
    transactionType: 'escrow_hold',
    amountUsd: order.totalValueUsd,
    description: `Escrow hold for Order ${order.orderNumber}`,
    reference: order.orderNumber,
    availableBalanceAfter: buyerBalances.available,
    heldBalanceAfter: exporterBalances.held,
  });

  await recordTxn({
    userId: order.exporterId,
    buyerId,
    exporterId: order.exporterId,
    orderId,
    transactionType: 'escrow_hold',
    amountUsd: order.totalValueUsd,
    description: `Funds held in escrow (not withdrawable) — Order ${order.orderNumber}`,
    reference: order.orderNumber,
    availableBalanceAfter: exporterBalances.available,
    heldBalanceAfter: exporterBalances.held,
  });

  const Notification = require('../notifications/notification.model');
  await Notification.create({
    userId: order.exporterId,
    type: 'payment',
    title: 'Payment secured in escrow',
    body: `$${order.totalValueUsd.toFixed(2)} held for Order ${order.orderNumber}. Funds release after delivery confirmation.`,
    link: '/exporter/wallet',
  }).catch(() => {});

  return { orderId, amountHeld: order.totalValueUsd };
};

const markAwaitingDeliveryConfirmation = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order || order.paymentStatus !== 'held') return order;

  const wasAwaiting = order.awaitingDeliveryConfirmation;
  await Order.findByIdAndUpdate(orderId, {
    status: 'delivered',
    deliveredAt: order.deliveredAt || new Date(),
    awaitingDeliveryConfirmation: true,
    $push: {
      timeline: {
        status: 'delivered',
        note: 'Shipment delivered — awaiting buyer confirmation to release escrow',
      },
    },
  });

  if (!wasAwaiting) {
    const Notification = require('../notifications/notification.model');
    await Notification.create({
      userId: order.buyerId,
      type: 'order',
      title: 'Confirm delivery to release payment',
      body: `Order ${order.orderNumber} was delivered. Confirm receipt or escrow auto-releases in ${GRACE_PERIOD_DAYS} days.`,
      link: '/buyer/orders',
    }).catch(() => {});
  }

  return order;
};

const confirmDelivery = async (orderId, { confirmedByUserId, bySystem = false }) => {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.paymentStatus !== 'held') {
    throw ApiError.badRequest('Order escrow is not held');
  }
  if (order.status !== 'delivered' && !order.awaitingDeliveryConfirmation) {
    throw ApiError.badRequest('Order must be delivered before confirming');
  }
  if (order.deliveryConfirmedAt) {
    return releaseEscrow(orderId);
  }

  await Order.findByIdAndUpdate(orderId, {
    deliveryConfirmedAt: new Date(),
    deliveryConfirmedBy: bySystem ? null : confirmedByUserId,
    deliveryConfirmedBySystem: bySystem,
    awaitingDeliveryConfirmation: false,
    $push: {
      timeline: {
        status: 'delivered',
        note: bySystem
          ? `Delivery auto-confirmed after ${GRACE_PERIOD_DAYS}-day grace period — releasing escrow`
          : 'Buyer confirmed delivery — releasing escrow',
        changedBy: bySystem ? null : confirmedByUserId,
      },
    },
  });

  return releaseEscrow(orderId);
};

const releaseEscrow = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order || order.paymentStatus !== 'held') return null;

  const platformFee = round2(order.totalValueUsd * PLATFORM_FEE_RATE);
  const exporterPayout = round2(order.totalValueUsd - platformFee);

  const exporterBalances = await writeBalances(order.exporterId, {
    heldDelta: -order.totalValueUsd,
    availableDelta: exporterPayout,
  });

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'released',
    platformFeeUsd: platformFee,
    exporterPayoutUsd: exporterPayout,
    awaitingDeliveryConfirmation: false,
    $push: { timeline: { status: 'released', note: `Escrow released — exporter payout $${exporterPayout} (platform fee $${platformFee})` } },
  });

  await recordTxn({
    userId: order.exporterId,
    buyerId: order.buyerId,
    exporterId: order.exporterId,
    orderId,
    transactionType: 'escrow_release',
    amountUsd: exporterPayout,
    description: `Escrow released for Order ${order.orderNumber}`,
    reference: order.orderNumber,
    availableBalanceAfter: exporterBalances.available,
    heldBalanceAfter: exporterBalances.held,
  });

  await recordTxn({
    userId: order.exporterId,
    buyerId: order.buyerId,
    exporterId: order.exporterId,
    orderId,
    transactionType: 'platform_fee',
    amountUsd: platformFee,
    description: `Platform fee (2.5%) for Order ${order.orderNumber}`,
    reference: order.orderNumber,
    availableBalanceAfter: exporterBalances.available,
    heldBalanceAfter: exporterBalances.held,
  });

  const Notification = require('../notifications/notification.model');
  await Promise.all([
    Notification.create({
      userId: order.exporterId,
      type: 'payment',
      title: 'Escrow payment released',
      body: `$${exporterPayout.toFixed(2)} is now available in your wallet (Order ${order.orderNumber}).`,
      link: '/exporter/wallet',
    }),
    Notification.create({
      userId: order.buyerId,
      type: 'payment',
      title: 'Payment released to exporter',
      body: `Order ${order.orderNumber} completed. Escrow funds transferred to the exporter.`,
      link: '/buyer/orders',
    }),
  ]).catch(() => {});

  return { platformFee, exporterPayout };
};

/** @deprecated — use confirmDelivery flow; kept for internal callers after confirmation */
const releasePayment = async (orderId) => releaseEscrow(orderId);

const refundEscrow = async (orderId, reason = 'Order cancelled') => {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.paymentStatus !== 'held') return null;

  const buyerBalances = await writeBalances(order.buyerId, { availableDelta: order.totalValueUsd });
  const exporterBalances = await writeBalances(order.exporterId, { heldDelta: -order.totalValueUsd });

  await Order.findByIdAndUpdate(orderId, {
    paymentStatus: 'refunded',
    awaitingDeliveryConfirmation: false,
    $push: { timeline: { status: 'cancelled', note: `Escrow refunded to buyer — ${reason}` } },
  });

  await recordTxn({
    userId: order.buyerId,
    buyerId: order.buyerId,
    exporterId: order.exporterId,
    orderId,
    transactionType: 'refund',
    amountUsd: order.totalValueUsd,
    description: `Refund for Order ${order.orderNumber}: ${reason}`,
    reference: order.orderNumber,
    availableBalanceAfter: buyerBalances.available,
    heldBalanceAfter: buyerBalances.held,
  });

  const Notification = require('../notifications/notification.model');
  await Notification.create({
    userId: order.buyerId,
    type: 'payment',
    title: 'Escrow refund processed',
    body: `$${order.totalValueUsd.toFixed(2)} returned to your wallet for Order ${order.orderNumber}.`,
    link: '/buyer/orders',
  }).catch(() => {});

  return { refunded: order.totalValueUsd };
};

const processAutoConfirmations = async () => {
  const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const pending = await Order.find({
    paymentStatus: 'held',
    status: 'delivered',
    awaitingDeliveryConfirmation: true,
    deliveryConfirmedAt: null,
    deliveredAt: { $lte: cutoff },
  }).select('_id');

  for (const o of pending) {
    await confirmDelivery(o._id, { bySystem: true });
  }
  return pending.length;
};

const getStats = async (userId, query) => {
  await processAutoConfirmations();
  const user = await User.findById(userId).select('role');
  const year = parseInt(query.year, 10) || new Date().getFullYear();

  if (user?.role === 'buyer') {
    const [payments, refunds] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: user._id, transactionType: 'payment', status: 'completed' } },
        { $group: { _id: null, total: { $sum: { $abs: '$amountUsd' } } } },
      ]),
      Transaction.aggregate([
        { $match: { userId: user._id, transactionType: 'refund', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amountUsd' } } },
      ]),
    ]);
    const wallet = await getWallet(userId);
    return {
      walletBalance: wallet.availableBalance,
      totalPayments: payments[0]?.total || 0,
      totalRefunds: refunds[0]?.total || 0,
    };
  }

  const monthly = await Transaction.aggregate([
    {
      $match: {
        userId: user._id,
        transactionType: 'escrow_release',
        status: 'completed',
        createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31T23:59:59`) },
      },
    },
    { $group: { _id: { $month: '$createdAt' }, total: { $sum: '$amountUsd' } } },
    { $sort: { _id: 1 } },
  ]);

  const [totalEarnings] = await Transaction.aggregate([
    { $match: { userId: user._id, transactionType: 'escrow_release', status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amountUsd' } } },
  ]);

  const wallet = await getWallet(userId);
  return {
    year,
    monthly,
    totalEarnings: totalEarnings?.total || 0,
    availableBalance: wallet.availableBalance,
    heldBalance: wallet.heldBalance,
  };
};

const getAdminFinancialStats = async () => {
  await processAutoConfirmations();

  const [
    platformRevenueAgg,
    escrowAgg,
    releasedAgg,
    volumeAgg,
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: { transactionType: 'platform_fee', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amountUsd' } } },
    ]),
    Order.aggregate([
      { $match: { paymentStatus: 'held' } },
      { $group: { _id: null, total: { $sum: '$totalValueUsd' }, count: { $sum: 1 } } },
    ]),
    Transaction.aggregate([
      { $match: { transactionType: 'escrow_release', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amountUsd' } } },
    ]),
    Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $abs: '$amountUsd' } } } },
    ]),
  ]);

  return {
    totalPlatformRevenue: platformRevenueAgg[0]?.total || 0,
    totalEscrowBalance: escrowAgg[0]?.total || 0,
    escrowOrderCount: escrowAgg[0]?.count || 0,
    totalReleasedPayments: releasedAgg[0]?.total || 0,
    totalTransactionVolume: volumeAgg[0]?.total || 0,
    platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5'),
    escrowGracePeriodDays: GRACE_PERIOD_DAYS,
  };
};

module.exports = {
  getWallet,
  getTransactions,
  deposit,
  withdraw,
  payForOrder,
  markAwaitingDeliveryConfirmation,
  confirmDelivery,
  releaseEscrow,
  releasePayment,
  refundEscrow,
  processAutoConfirmations,
  getStats,
  getAdminFinancialStats,
  PLATFORM_FEE_RATE,
  GRACE_PERIOD_DAYS,
};
