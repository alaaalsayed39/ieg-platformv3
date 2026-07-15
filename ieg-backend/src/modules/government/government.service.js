const GovernmentRequest = require('./government.model');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');
const { saveFile } = require('../../utils/fileStorage');

// User: Apply for a government service
const apply = async (userId, data, files = []) => {
  const documents = [];
  for (const file of files) {
    const saved = await saveFile(file, userId, 'government');
    documents.push({ url: saved.url, publicId: saved.publicId, name: file.originalname });
  }

  const request = await GovernmentRequest.create({
    user: userId,
    serviceType:        data.serviceType,
    companyName:        data.companyName,
    product:            data.product,
    destinationCountry: data.destinationCountry,
    hsCode:             data.hsCode,
    documents,
  });

  return request;
};

// User: Get my requests
const getMyRequests = async (userId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { user: userId };
  if (query.status) filter.status = query.status;

  const [data, total] = await Promise.all([
    GovernmentRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    GovernmentRequest.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

// Admin: Get all requests
const getAllRequests = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.status)      filter.status = query.status;
  if (query.serviceType) filter.serviceType = query.serviceType;

  const [data, total] = await Promise.all([
    GovernmentRequest.find(filter)
      .populate('user', 'fullName companyName email role')
      .populate('reviewedBy', 'fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    GovernmentRequest.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

// Admin: Update status
const updateStatus = async (requestId, adminId, { status, adminNotes }) => {
  const request = await GovernmentRequest.findById(requestId);
  if (!request) throw new ApiError(404, 'Request not found');

  request.status     = status;
  request.adminNotes = adminNotes || null;
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  await request.save();

  // Create notification for user
  const Notification = require('../notifications/notification.model');
  const messages = {
    approved:     `✅ Your ${request.serviceType} request has been approved!`,
    rejected:     `❌ Your ${request.serviceType} request has been rejected.`,
    under_review: `🔍 Your ${request.serviceType} request is now under review.`,
  };
  if (messages[status]) {
    await Notification.create({
      userId: request.user,
      type:   'government',
      title:  `${request.serviceType} - ${status.replace(/_/g, ' ').toUpperCase()}`,
      body:   messages[status],
      link:   '/exporter/government',
    }).catch(() => {});
  }

  return request;
};

// Get single request
const getById = async (requestId) => {
  const request = await GovernmentRequest.findById(requestId)
    .populate('user', 'fullName companyName email')
    .populate('reviewedBy', 'fullName');
  if (!request) throw new ApiError(404, 'Request not found');
  return request;
};

module.exports = { apply, getMyRequests, getAllRequests, updateStatus, getById };