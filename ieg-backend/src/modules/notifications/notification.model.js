const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:     { type: String, enum: ['order','verification','message','shipment','payment','system','document'], required: true },
  title:    { type: String, required: true },
  body:     { type: String },
  link:     { type: String },
  isRead:   { type: Boolean, default: false, index: true },
  metadata: { type: Map, of: String },
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
