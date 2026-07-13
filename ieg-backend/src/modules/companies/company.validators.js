const Joi = require('joi');

/**
 * Used internally by auth.service.js (M2) when creating a Company alongside
 * a new User during registration. Not exposed as a standalone public route
 * in Phase 1 — a Company is only ever created as part of registration.
 */
const createCompanySchema = Joi.object({
  legalName: Joi.string().min(2).max(200).required(),
  tradeName: Joi.string().max(200).allow('', null),
  companyType: Joi.string().valid('exporter', 'buyer', 'shipper').required(),
  country: Joi.string().length(2).uppercase().default('EG'),
  taxId: Joi.string().max(100).allow('', null),
  registrationNumber: Joi.string().max(100).allow('', null),
});

/**
 * PATCH /companies/me — self-service profile update.
 * Deliberately excludes companyType, verificationStatus, ownerUserId, and all
 * review/audit fields — those are either immutable or admin/system-only.
 */
const updateCompanySchema = Joi.object({
  legalName: Joi.string().min(2).max(200),
  tradeName: Joi.string().max(200).allow('', null),
  country: Joi.string().length(2).uppercase(),
  taxId: Joi.string().max(100).allow('', null),
  registrationNumber: Joi.string().max(100).allow('', null),
}).min(1); // at least one field must be present on update

module.exports = { createCompanySchema, updateCompanySchema };
