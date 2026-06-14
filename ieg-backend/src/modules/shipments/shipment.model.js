const mongoose = require('mongoose');

const shipmentStageSchema = new mongoose.Schema({
  stage:    { type: String, required: true },
  location: { type: String },
  note:     { type: String },
  lat:      { type: Number },
  lng:      { type: Number },
  recordedAt: { type: Date, default: Date.now },
}, { _id: false });

const shipmentSchema = new mongoose.Schema(
  {
    containerNumber: { type: String, unique: true, required: true, index: true },
    orderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    shipperId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    exporterId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originPort:     { type: String, required: true },
    destinationPort:{ type: String, required: true },
    carrier:        { type: String },
    departureDate:  { type: Date },
    eta:            { type: Date },
    status: {
      type: String,
      enum: ['pickup', 'customs_cleared', 'in_transit', 'arrived', 'delivered', 'delayed'],
      default: 'pickup',
      index: true,
    },
    currentLat: { type: Number },
    currentLng: { type: Number },
    currentLocation: { type: String },
    stages:     [shipmentStageSchema],   // full history of position + stage
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shipment', shipmentSchema);
