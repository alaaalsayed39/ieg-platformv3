const Joi = require('joi');

const registerSchema = Joi.object({
  fullName:    Joi.string().min(2).max(100).required(),
  email:       Joi.string().email().lowercase().required(),
  password:    Joi.string().min(8).max(64).required(),
  phone:       Joi.string().allow('', null),
  companyName: Joi.string().max(150).allow('', null),
  role:        Joi.string().valid('exporter', 'buyer', 'shipper').required(),
  country:     Joi.string().length(2).uppercase().default('EG'),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
});

const resetPasswordSchema = Joi.object({
  password: Joi.string().min(8).max(64).required(),
});

module.exports = { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema };
