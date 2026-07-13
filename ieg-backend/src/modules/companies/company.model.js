const mongoose = require('mongoose');

/**
 * Company represents the legal business entity behind a User account —
 * exporter, buyer, or shipper. Decoupled from User so that verification,
 * documents, products, orders, and wallet balances all belong to a stable
 * business identity rather than a single login.
 *
 * verificationStatus lifecycle:
 *   draft     — default on creation; no verification documents submitted yet.
 *   pending   — company has submitted documents and is awaiting admin review.
 *   verified  — admin approved the company.
 *   rejected  — admin rejected the company (can resubmit → back to pending).
 *
 * NOTE: In Phase 1, verification is only ENFORCED for companyType 'exporter'.
 * Buyers and shippers still get a Company record (needed for Order/Wallet
 * linkage in later milestones) but 'draft'/'pending' buyers are not blocked
 * from using the platform — see requireVerifiedCompany middleware (M4).
 */
const companySchema = new mongoose.Schema(
  {
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    legalName: {
      type: String,
      required: [true, 'Legal company name is required'],
      trim: true,
      maxlength: [200, 'Legal name cannot exceed 200 characters'],
    },
    tradeName: {
      type: String,
      trim: true,
      maxlength: [200, 'Trade name cannot exceed 200 characters'],
      default: null,
    },
    companyType: {
      type: String,
      enum: ['exporter', 'buyer', 'shipper'],
      required: true,
      index: true,
    },
    country: {
      type: String,
      trim: true,
      default: 'EG',
    },
    taxId: {
      type: String,
      trim: true,
      default: null,
    },
    registrationNumber: {
      type: String,
      trim: true,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['draft', 'pending', 'verified', 'rejected'],
      default: 'draft',
      index: true,
    },
    verifiedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  },
);

// ─── Indexes ────────────────────────────────────────────────────────────────
// ownerUserId already indexed+unique above (one company per user in Phase 1).
// Composite index supports the admin review queue: filter by type + status.
companySchema.index({ companyType: 1, verificationStatus: 1 });

module.exports = mongoose.model('Company', companySchema);
