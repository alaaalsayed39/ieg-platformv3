'use strict';

const path = require('path');
const service = require('./document.service');
const ApiResponse = require('../../utils/ApiResponse');

const upload = async (req, res) => {
  const d = await service.upload(req.user._id, req.file, req.body);
  ApiResponse.created(res, d, 'Document uploaded — pending admin review');
};

const getMyDocs = async (req, res) => {
  const { data, total, page, limit } = await service.getMyDocuments(req.user._id, req.query);
  ApiResponse.paginated(res, data, total, page, limit);
};

const getPending = async (req, res) => {
  const { data, total, page, limit } = await service.getPending(req.query);
  ApiResponse.paginated(res, data, total, page, limit);
};

const approve = async (req, res) => {
  const d = await service.approve(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, d, 'Document approved');
};

const reject = async (req, res) => {
  const d = await service.reject(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, d, 'Document rejected');
};

const review = async (req, res) => {
  const d = await service.review(req.user._id, req.params.id, req.body);
  ApiResponse.success(res, d, 'Document reviewed');
};

const remove = async (req, res) => {
  await service.remove(req.user._id, req.params.id);
  ApiResponse.noContent(res);
};

const adminGetAll = async (req, res) => {
  const { data, total, page, limit } = await service.adminGetAll(req.query);
  ApiResponse.paginated(res, data, total, page, limit);
};

const adminStats = async (req, res) => {
  const s = await service.getAdminStats();
  ApiResponse.success(res, s);
};

const getStats = async (req, res) => {
  const s = await service.getStats(req.user._id);
  ApiResponse.success(res, s);
};

const getById = async (req, res) => {
  const d = await service.getById(req.user._id, req.params.id, req.user.role);
  ApiResponse.success(res, d);
};

// download — triggers browser "Save As" dialog
const download = async (req, res) => {
  const result = await service.getFileStream(req.user._id, req.params.id, req.user.role);
  if (result.cloudinaryUrl) {
    // Cloudinary-hosted: return the URL so the frontend can open it directly.
    // We cannot res.redirect() through axios because the Authorization header is
    // stripped on cross-origin redirects, and blob responseType breaks on HTML error pages.
    return res.json({ url: result.cloudinaryUrl, fileName: result.doc.fileName });
  }
  res.download(result.filePath, result.doc.fileName);
};

// view — inline preview (PDF viewer, image display, etc.)
const view = async (req, res) => {
  const result = await service.getFileStream(req.user._id, req.params.id, req.user.role);
  if (result.cloudinaryUrl) {
    // Same reason as download: return URL as JSON, let the browser open it.
    return res.json({ url: result.cloudinaryUrl, fileName: result.doc.fileName });
  }
  res.setHeader('Content-Type', result.doc.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${path.basename(result.doc.fileName)}"`);
  res.sendFile(path.resolve(result.filePath));
};

module.exports = {
  upload,
  getMyDocs,
  getPending,
  approve,
  reject,
  review,
  remove,
  adminGetAll,
  adminStats,
  getStats,
  getById,
  download,
  view,
};
