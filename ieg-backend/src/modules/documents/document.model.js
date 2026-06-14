const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    type: {
      type: String,
      required: true,
      enum: ['certificate_of_origin','commercial_invoice','packing_list','bill_of_lading',
             'bill_of_name','phytosanitary_certificate','customs_clearance',
             'insurance_certificate','trade_license','tax_registration','other'],
    },
    fileName:    { type: String, required: true },
    fileUrl:     { type: String, required: true },
    publicId:    { type: String, default: null },   // Cloudinary public_id for deletion
    fileSize:    { type: Number },
    mimeType:    { type: String },
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
      index: true,
    },
    uploadDate:  { type: Date, default: Date.now },
    expiryDate:  { type: Date },
    reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt:  { type: Date },
    rejectionReason: { type: String },
    approvalNotes:   { type: String },
    /** @deprecated use rejectionReason / approvalNotes */
    reviewNotes: { type: String },
  },
  { timestamps: true }
);
documentSchema.index({ userId: 1, status: 1 });
module.exports = mongoose.model('Document', documentSchema);
