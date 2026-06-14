const mongoose = require('mongoose');

const TX_TYPES = [
  'payment',
  'escrow_hold',
  'escrow_release',
  'platform_fee',
  'refund',
  'deposit',
  'withdrawal',
  // legacy
  'income',
];

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    exporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', index: true },
    transactionType: {
      type: String,
      enum: TX_TYPES,
      required: true,
    },
    /** @deprecated use transactionType — kept for backward compatibility */
    type: { type: String, enum: TX_TYPES },
    amountUsd: { type: Number, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    reference: { type: String },
    availableBalanceAfter: { type: Number },
    heldBalanceAfter: { type: Number },
    /** @deprecated */
    balanceAfter: { type: Number },
  },
  { timestamps: true },
);

transactionSchema.pre('validate', function syncType(next) {
  if (!this.type) this.type = this.transactionType;
  if (!this.transactionType) this.transactionType = this.type;
  next();
});

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ transactionType: 1, status: 1 });
transactionSchema.index({ orderId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
