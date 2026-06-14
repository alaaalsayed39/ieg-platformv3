const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  userId:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  taxId:           { type: String },
  tradeLicenseUrl: { type: String },
  businessRegUrl:  { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending',
    index: true,
  },
  reviewerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerNotes: { type: String },
  submittedAt:   { type: Date, default: Date.now },
  reviewedAt:    { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Verification', verificationSchema);
