const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    phone: { type: String, trim: true },
    companyName: { type: String, trim: true },
    role: {
      type: String,
      enum: ['admin', 'exporter', 'buyer', 'shipper'],
      required: true,
    },
    country: { type: String, trim: true, default: 'EG' },
    avatarUrl: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    subscription: {
      type: String,
      enum: ['free', 'starter', 'business', 'enterprise'],
      default: 'free',
    },
    refreshTokenHash: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    // Wallet — available = spendable/withdrawable; held = escrow (exporters only)
    availableBalance: { type: Number, default: 0 },
    heldBalance:      { type: Number, default: 0 },
    /** @deprecated synced with availableBalance */
    walletBalance:    { type: Number, default: 0 },
    /** @deprecated unused — use heldBalance for exporters */
    pendingBalance:   { type: Number, default: 0 },
    bankName: { type: String },
    bankAccount: { type: String },
    isChatSuspended: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    presenceStatus: { type: String, enum: ['online', 'offline', 'away'], default: 'offline' },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ─── Indexes (email index created by unique: true) ─────────────────────────────
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// ─── Instance Methods ──────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// ─── Pre-save hook: hash password ─────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

module.exports = mongoose.model('User', userSchema);
