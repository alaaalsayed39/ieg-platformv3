const Verification = require('./verification.model');
const User = require('../users/user.model');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');
const { sendEmail, emailTemplates } = require('../../utils/email');

const submit = async (userId, { taxId, tradeLicenseUrl, businessRegUrl }) => {
  const existing = await Verification.findOne({ userId });
  if (existing && existing.status === 'approved') throw ApiError.conflict('Already verified');
  const ver = await Verification.findOneAndUpdate(
    { userId },
    { taxId, tradeLicenseUrl, businessRegUrl, status: 'pending', submittedAt: new Date() },
    { upsert: true, new: true }
  );
  return ver;
};

const getMyStatus = async (userId) => {
  return Verification.findOne({ userId }).lean();
};

const getAll = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  const [data, total] = await Promise.all([
    Verification.find(filter).populate('userId', 'fullName email companyName country role').sort({ submittedAt: 1 }).skip(skip).limit(limit).lean(),
    Verification.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

const review = async (adminId, verificationId, { status, reviewerNotes }) => {
  const ver = await Verification.findByIdAndUpdate(
    verificationId,
    { status, reviewerId: adminId, reviewerNotes, reviewedAt: new Date() },
    { new: true }
  ).populate('userId', 'fullName email');
  if (!ver) throw ApiError.notFound('Verification not found');

  if (status === 'approved') {
    await User.findByIdAndUpdate(ver.userId._id, { isVerified: true });
    const { subject, html } = emailTemplates.verificationApproved(ver.userId.fullName);
    sendEmail({ to: ver.userId.email, subject, html });
  } else if (status === 'rejected') {
    const { subject, html } = emailTemplates.verificationRejected(ver.userId.fullName, reviewerNotes || 'Documents did not meet requirements');
    sendEmail({ to: ver.userId.email, subject, html });
  }
  return ver;
};

module.exports = { submit, getMyStatus, getAll, review };
