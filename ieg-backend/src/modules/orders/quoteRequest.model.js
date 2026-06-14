const mongoose = require('mongoose');

const quoteRequestSchema = new mongoose.Schema(
  {
    buyerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productType:{ type: String },
    quantity:   { type: Number },
    budgetMin:  { type: Number },
    budgetMax:  { type: Number },
    deliveryTimeline: { type: String },
    specialRequirements: { type: String },
    status: {
      type: String,
      enum: ['new', 'pending', 'accepted', 'declined', 'negotiating'],
      default: 'new',
      index: true,
    },
    responderNote: { type: String },
    orderId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuoteRequest', quoteRequestSchema);
