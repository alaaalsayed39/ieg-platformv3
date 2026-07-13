const service = require('./company.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

/**
 * GET /companies/me
 * Returns the caller's Company. Admins have no companyId — respond with a
 * clear, typed 404 rather than a raw/silent empty object so the frontend
 * can distinguish "you're an admin, this doesn't apply" from "data bug".
 */
const getMe = async (req, res) => {
  if (!req.user.companyId) {
    throw ApiError.notFound('No company is linked to this account');
  }
  const company = await service.getById(req.user.companyId);
  ApiResponse.success(res, company, 'Company fetched');
};

/**
 * PATCH /companies/me
 * Self-service profile update. Ownership is re-checked inside the service
 * layer (defense in depth) even though this route only ever passes the
 * caller's own companyId.
 */
const updateMe = async (req, res) => {
  if (!req.user.companyId) {
    throw ApiError.notFound('No company is linked to this account');
  }
  const company = await service.updateProfile(req.user.companyId, req.user._id, req.body);
  ApiResponse.success(res, company, 'Company updated');
};

module.exports = { getMe, updateMe };
