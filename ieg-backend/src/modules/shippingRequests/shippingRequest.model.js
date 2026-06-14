const mongoose = require('mongoose');

const shippingRequestSchema = new mongoose.Schema(
  {
    orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    exporterId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shipperId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    originPort:     { type: String, required: true },
    destinationPort:{ type: String, required: true },
    carrier:        { type: String, required: true },
    departureDate:  { type: Date },
    eta:            { type: Date },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewerNote: { type: String },
    shipmentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Shipment', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShippingRequest', shippingRequestSchema);
