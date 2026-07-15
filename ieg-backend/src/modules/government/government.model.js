const mongoose = require('mongoose');

const governmentRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    serviceType: {
      type: String,
      enum: [
        'Export License',
        'Certificate of Origin',
        'Inspection Certificate',
        'Phytosanitary Certificate',
        'Customs Clearance',
      ],
      required: true,
    },
    companyName:        { type: String, required: true, trim: true },
    product:            { type: String, required: true, trim: true },
    destinationCountry: { type: String, required: true, trim: true },
    hsCode:             { type: String, trim: true },
    documents: [
      {
        url:      { type: String, required: true },
        publicId: { type: String, default: null },
        name:     { type: String },
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: { type: String, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GovernmentRequest', governmentRequestSchema);