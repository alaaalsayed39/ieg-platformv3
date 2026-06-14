'use strict';

const Document = require('./document.model');
const Notification = require('../notifications/notification.model');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');
const { saveFile, deleteFile, resolveFilePath } = require('../../utils/fileStorage');

const PENDING_STATUSES = ['pending_review', 'pending'];

const normalizeStatusFilter = (status) => {
  if (!status) return null;
  if (status === 'pending' || status === 'pending_review') return { $in: PENDING_STATUSES };
  return status;
};

const notifyExporter = async (userId, { title, body, documentId }) => {
  await Notification.create({
    userId,
    type: 'document',
    title,
    body,
    link: '/exporter/documents',
    metadata: { documentId: String(documentId) },
  }).catch(() => {});
};

// ─── Upload ────────────────────────────────────────────────────────────────────
const upload = async (userId, file, { type, orderId }) => {
  if (!file) throw ApiError.badRequest('No file provided');
  const fd = await saveFile(file, userId, 'documents');
  const uploadDate = new Date();
  const expiryDate = new Date(uploadDate);
  expiryDate.setDate(expiryDate.getDate() + 15);
  return Document.create({
    userId,
    orderId: orderId || null,
    type,
    fileName: fd.fileName,
    fileUrl:  fd.url,
    publicId: fd.publicId,   // null when local storage
    fileSize: fd.fileSize,
    mimeType: fd.mimeType,
    status: 'pending_review',
    uploadDate,
    expiryDate,
  });
};

// ─── Get single doc (with access control) ─────────────────────────────────────
const getById = async (userId, documentId, role) => {
  const doc = await Document.findById(documentId)
    .populate('userId', 'fullName email companyName')
    .populate('reviewedBy', 'fullName email')
    .lean();
  if (!doc) throw ApiError.notFound('Document not found');
  if (role !== 'admin' && String(doc.userId._id || doc.userId) !== String(userId)) {
    throw ApiError.forbidden('Access denied');
  }
  return doc;
};

// ─── Get file for download / inline view ──────────────────────────────────────
// Returns { doc, filePath } for local files, or { doc, cloudinaryUrl } for Cloudinary files.
const getFileStream = async (userId, documentId, role) => {
  const doc = await getById(userId, documentId, role);
  // Cloudinary-hosted file: return the URL directly (controller will redirect)
  if (doc.fileUrl && doc.fileUrl.startsWith('http')) {
    return { doc, cloudinaryUrl: doc.fileUrl };
  }
  // Local file: resolve path and stream
  const filePath = resolveFilePath(doc.fileUrl);
  if (!filePath) throw ApiError.notFound('File not found on server');
  return { doc, filePath };
};

// ─── List user's own documents ─────────────────────────────────────────────────
const getMyDocuments = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { userId };
  const statusFilter = normalizeStatusFilter(query.status);
  if (statusFilter) filter.status = statusFilter;
  if (query.type) filter.type = query.type;
  const [data, total] = await Promise.all([
    Document.find(filter)
      .populate('orderId', 'orderNumber')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

// ─── Admin: pending queue ──────────────────────────────────────────────────────
const getPending = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { status: { $in: PENDING_STATUSES } };
  if (query.type) filter.type = query.type;
  const [data, total] = await Promise.all([
    Document.find(filter)
      .populate('userId', 'fullName companyName email country')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

const assertPendingReview = (doc) => {
  if (!PENDING_STATUSES.includes(doc.status)) {
    throw ApiError.badRequest('Only documents pending review can be approved or rejected');
  }
};

// ─── Approve ───────────────────────────────────────────────────────────────────
const approve = async (adminId, documentId, { approvalNotes } = {}) => {
  const existing = await Document.findById(documentId);
  if (!existing) throw ApiError.notFound('Document not found');
  assertPendingReview(existing);

  const doc = await Document.findByIdAndUpdate(
    documentId,
    {
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      approvalNotes: approvalNotes || undefined,
      rejectionReason: undefined,
    },
    { new: true },
  )
    .populate('userId', 'fullName email')
    .populate('reviewedBy', 'fullName email');

  await notifyExporter(doc.userId._id || doc.userId, {
    title: 'Your document has been approved.',
    body: approvalNotes
      ? `${doc.fileName} was approved. ${approvalNotes}`
      : `${doc.fileName} was approved and is now active on your account.`,
    documentId: doc._id,
  });

  return doc;
};

// ─── Reject ────────────────────────────────────────────────────────────────────
const reject = async (adminId, documentId, { rejectionReason }) => {
  if (!rejectionReason || !String(rejectionReason).trim()) {
    throw ApiError.badRequest('Rejection reason is required');
  }
  const existing = await Document.findById(documentId);
  if (!existing) throw ApiError.notFound('Document not found');
  assertPendingReview(existing);

  const reason = String(rejectionReason).trim();
  const doc = await Document.findByIdAndUpdate(
    documentId,
    {
      status: 'rejected',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: reason,
      reviewNotes: reason,
    },
    { new: true },
  )
    .populate('userId', 'fullName email')
    .populate('reviewedBy', 'fullName email');

  await notifyExporter(doc.userId._id || doc.userId, {
    title: 'Your document has been rejected.',
    body: `Reason: ${reason}`,
    documentId: doc._id,
  });

  return doc;
};

/** @deprecated use approve/reject */
const review = async (adminId, documentId, { status, reviewNotes, rejectionReason, approvalNotes }) => {
  if (status === 'approved') return approve(adminId, documentId, { approvalNotes: approvalNotes || reviewNotes });
  if (status === 'rejected') {
    return reject(adminId, documentId, { rejectionReason: rejectionReason || reviewNotes });
  }
  throw ApiError.badRequest('Status must be approved or rejected');
};

// ─── Delete ────────────────────────────────────────────────────────────────────
// Deletes from DB and removes the file from Cloudinary or local disk.
const remove = async (userId, documentId) => {
  const doc = await Document.findOne({ _id: documentId, userId });
  if (!doc) throw ApiError.notFound('Document not found');
  if (doc.status === 'approved') {
    throw ApiError.badRequest('Approved documents cannot be deleted');
  }
  await Document.findByIdAndDelete(documentId);
  await deleteFile(doc.fileUrl, doc.publicId, doc.mimeType);
};

// ─── Admin: all documents ──────────────────────────────────────────────────────
const adminGetAll = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  const statusFilter = normalizeStatusFilter(query.status);
  if (statusFilter) filter.status = statusFilter;
  if (query.type) filter.type = query.type;
  const [data, total] = await Promise.all([
    Document.find(filter)
      .populate('userId', 'fullName companyName email country')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Document.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

// ─── Stats ─────────────────────────────────────────────────────────────────────
const getStats = async (userId) => {
  const [total, approved, pending, rejected] = await Promise.all([
    Document.countDocuments({ userId }),
    Document.countDocuments({ userId, status: 'approved' }),
    Document.countDocuments({ userId, status: { $in: PENDING_STATUSES } }),
    Document.countDocuments({ userId, status: 'rejected' }),
  ]);
  return { total, approved, pending, rejected, active: approved };
};

const getAdminStats = async () => {
  const [pending, approved, rejected] = await Promise.all([
    Document.countDocuments({ status: { $in: PENDING_STATUSES } }),
    Document.countDocuments({ status: 'approved' }),
    Document.countDocuments({ status: 'rejected' }),
  ]);
  return { pending, approved, rejected, total: pending + approved + rejected };
};

module.exports = {
  upload,
  getMyDocuments,
  getPending,
  approve,
  reject,
  review,
  remove,
  adminGetAll,
  getStats,
  getAdminStats,
  getById,
  getFileStream,
};
