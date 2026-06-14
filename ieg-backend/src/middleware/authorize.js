const ApiError = require('../utils/ApiError');

/**
 * authorize(...roles) — role-based access control middleware factory.
 * Usage: router.get('/admin', authenticate, authorize('admin'), controller)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Access denied. Required roles: [${roles.join(', ')}]`);
  }
  next();
};

module.exports = authorize;
