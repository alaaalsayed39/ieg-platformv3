const mongoose = require('mongoose');

// ─── Timeline Entry Sub-Schema ────────────────────────────────────────────────
// Used for a full audit trail of every status change on an order.
const timelineEntrySchema = new mongoose.Schema(
  {
    status:    { type: String },
    note:      { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // `changedAt` is the canonical timestamp for this entry.
    // `timestamp` is kept as an alias written by utils/seed.js — both are stored.
    changedAt:  { type: Date, default: Date.now },
    timestamp:  { type: Date },                   // alias used by seed / legacy code
  },
  { _id: false },
);

// ─── Order Schema ─────────────────────────────────────────────────────────────
const orderSchema = new mongoose.Schema(
  {
    orderNumber:  { type: String, unique: true, required: true },
    exporterId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    shipperId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    productId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName:  { type: String, required: true },
    quantity:     { type: Number, required: true, min: 0 },
    unit:         { type: String, required: true },
    totalValueUsd:{ type: Number, required: true, min: 0 },
    currency:     { type: String, default: 'USD' },

    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'held', 'refunded', 'released'],
      default: 'unpaid',
    },

    // ── Escrow / Delivery lifecycle ───────────────────────────────────────────
    escrowHeldAt:                { type: Date },
    awaitingDeliveryConfirmation: { type: Boolean, default: false },
    deliveredAt:                 { type: Date },
    deliveryConfirmedAt:         { type: Date },
    deliveryConfirmedBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    deliveryConfirmedBySystem:   { type: Boolean, default: false },

    // ── Financials ────────────────────────────────────────────────────────────
    platformFeeUsd:    { type: Number, min: 0 },
    exporterPayoutUsd: { type: Number, min: 0 },

    // ── Shipping details ──────────────────────────────────────────────────────
    deliveryMethod: {
      type: String,
      // Allow free-text in addition to the strict enum so that seed data
      // ('Sea Freight', 'Air Freight') and service code ('Sea','Air') both persist.
      default: 'Sea',
    },
    shipmentMode: { type: String, default: 'Standard' },
    insurance:    { type: Boolean, default: false },
    eta:          { type: Date },
    comments:     { type: String, maxlength: 2000 },

    // ── Cancellation audit ────────────────────────────────────────────────────
    // Written by order.service.js → updateStatus when status === 'cancelled'.
    // Previously these fields were written but not declared in the schema,
    // causing them to be silently dropped by Mongoose strict mode.
    cancelledAt: {
      type: Date,
      default: null,
      // Automatically set the timestamp when the order transitions to cancelled.
      // The service layer sets this explicitly; the default keeps the field
      // present even on pre-existing documents that lack it.
    },
    cancelReason: {
      type: String,
      maxlength: 1000,
      default: null,
      // Human-readable cancellation reason supplied by the actor (buyer / admin).
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      // Optional — set when the cancelling user's id is known.
    },

    // ── Full audit timeline ───────────────────────────────────────────────────
    timeline: [timelineEntrySchema],
  },
  {
    timestamps: true,
    // Allow paths not in the schema to pass through for legacy seed documents.
    // We keep strict: true but add the missing fields above instead of relaxing it.
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
orderSchema.index({ exporterId: 1, status: 1 });
orderSchema.index({ buyerId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });           // for escrow auto-confirmation queries
orderSchema.index({ status: 1, deliveredAt: 1 });  // for auto-confirm grace-period queries

module.exports = mongoose.model('Order', orderSchema);
