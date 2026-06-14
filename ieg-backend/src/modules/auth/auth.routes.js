const router = require('express').Router();
const ctrl   = require('./auth.controller');
const validate     = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const { authLimiter } = require('../../middleware/rateLimiter');
const {
  registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema,
} = require('./auth.validators');

// Public routes
router.post('/register',        authLimiter, validate(registerSchema),       ctrl.register);
router.post('/login',           authLimiter, validate(loginSchema),          ctrl.login);
router.post('/refresh-token',                                                 ctrl.refresh);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password/:token',        validate(resetPasswordSchema),  ctrl.resetPassword);

// Protected routes
router.post('/logout', authenticate, ctrl.logout);
router.get('/me',      authenticate, ctrl.getMe);

module.exports = router;
