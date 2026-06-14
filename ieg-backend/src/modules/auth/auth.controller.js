const authService = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');
const { REFRESH_COOKIE_OPTIONS } = require('../../config/jwt');

const register = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  ApiResponse.created(res, { user, accessToken }, 'Account created successfully');
};

const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  ApiResponse.success(res, { user, accessToken }, 'Login successful');
};

const refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw require('../../utils/ApiError').unauthorized('No refresh token');
  const { accessToken, refreshToken } = await authService.refreshTokens(token);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  ApiResponse.success(res, { accessToken }, 'Token refreshed');
};

const logout = async (req, res) => {
  await authService.logout(req.user._id);
  res.clearCookie('refreshToken');
  ApiResponse.success(res, null, 'Logged out successfully');
};

const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  ApiResponse.success(res, null, 'If that email exists, a reset link has been sent');
};

const resetPassword = async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  ApiResponse.success(res, null, 'Password reset successfully');
};

const getMe = async (req, res) => {
  ApiResponse.success(res, { user: req.user }, 'Profile fetched');
};

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword, getMe };
