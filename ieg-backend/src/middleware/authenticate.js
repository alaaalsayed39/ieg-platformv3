const { verifyAccessToken } = require('../config/jwt');
const User = require('../modules/users/user.model');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * authenticate — verifies Bearer JWT, attaches req.user
 */
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) throw ApiError.unauthorized('No authentication token provided');

  const decoded = verifyAccessToken(token);
  const user = await User.findById(decoded.userId).select('-passwordHash -refreshTokenHash');

  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Account has been suspended');

  req.user = user;
  next();
});

module.exports = authenticate;
