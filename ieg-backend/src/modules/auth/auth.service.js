const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../users/user.model');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../config/jwt');
const ApiError = require('../../utils/ApiError');
const { sendEmail, emailTemplates } = require('../../utils/email');

// ─── Register ──────────────────────────────────────────────────────────────────
const register = async ({ fullName, email, password, phone, companyName, role, country }) => {
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const starterWallet =
    role === 'buyer' ? parseFloat(process.env.BUYER_STARTER_WALLET || '50000') : 0;
  const autoVerifyExporter = process.env.AUTO_VERIFY_EXPORTERS !== 'false';

  const user = await User.create({
    fullName,
    email,
    passwordHash: password, // pre-save hook hashes it
    phone,
    companyName,
    role,
    country,
    availableBalance: starterWallet,
    walletBalance: starterWallet,
    isVerified: role === 'exporter' ? autoVerifyExporter : false,
  });

  const { accessToken, refreshToken } = await _issueTokens(user);

  // Welcome email (non-blocking)
  const { subject, html } = emailTemplates.welcome(fullName);
  sendEmail({ to: email, subject, html });

  return { user, accessToken, refreshToken };
};

// ─── Login ─────────────────────────────────────────────────────────────────────
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('Your account has been suspended');

  const valid = await user.comparePassword(password);
  if (!valid) throw ApiError.unauthorized('Invalid email or password');

  const { accessToken, refreshToken } = await _issueTokens(user);
  return { user, accessToken, refreshToken };
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────
const refreshTokens = async (token) => {
  const decoded = verifyRefreshToken(token);
  const user = await User.findById(decoded.userId).select('+refreshTokenHash');
  if (!user) throw ApiError.unauthorized('User not found');

  const valid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!valid) throw ApiError.unauthorized('Invalid refresh token');

  const { accessToken, refreshToken } = await _issueTokens(user);
  return { accessToken, refreshToken };
};

// ─── Logout ────────────────────────────────────────────────────────────────────
const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
};

// ─── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) return; // Silent — don't reveal if email exists

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken   = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 3600000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password/${resetToken}`;
  const { subject, html } = emailTemplates.passwordReset(user.fullName, resetUrl);
  await sendEmail({ to: email, subject, html });
};

// ─── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (token, newPassword) => {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) throw ApiError.badRequest('Invalid or expired reset token');

  user.passwordHash         = newPassword; // pre-save hook hashes
  user.passwordResetToken   = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
};

// ─── Internal: issue & store token pair ───────────────────────────────────────
const _issueTokens = async (user) => {
  const payload = { userId: user._id.toString(), role: user.role, email: user.email };
  const accessToken  = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Store hashed refresh token
  const hashed = await bcrypt.hash(refreshToken, 10);
  await User.findByIdAndUpdate(user._id, { refreshTokenHash: hashed });

  return { accessToken, refreshToken };
};

module.exports = { register, login, refreshTokens, logout, forgotPassword, resetPassword };
