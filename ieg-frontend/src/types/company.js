/**
 * JSDoc type definitions for the Company module.
 *
 * The project is plain JS/JSX with no existing TypeScript or typedef
 * convention. This file is additive editor-autocomplete/documentation
 * tooling only — it introduces no build step, no compilation, and no
 * structural change. Import types via JSDoc comments where useful, e.g.:
 *
 *   /** @type {import('../types/company').Company} *\/
 *   const company = ...
 *
 * No runtime code lives here.
 */

/**
 * @typedef {'exporter' | 'buyer' | 'shipper'} CompanyType
 */

/**
 * @typedef {'draft' | 'pending' | 'verified' | 'rejected'} CompanyVerificationStatus
 */

/**
 * @typedef {Object} Company
 * @property {string} _id
 * @property {string} ownerUserId
 * @property {string} legalName
 * @property {string|null} tradeName
 * @property {CompanyType} companyType
 * @property {string} country
 * @property {string|null} taxId
 * @property {string|null} registrationNumber
 * @property {CompanyVerificationStatus} verificationStatus
 * @property {string|null} verifiedAt
 * @property {string|null} rejectedAt
 * @property {string|null} rejectionReason
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Placeholder for M3 (Verification & Private Documents). Documented now so
 * the shape is known ahead of time; CompanyDocument does not exist yet as
 * a backend model in M1.1.
 *
 * @typedef {Object} CompanyDocument
 * @property {string} _id
 * @property {string} companyId
 * @property {'commercial_registration' | 'tax_card' | 'export_license' | 'bank_account_info'} type
 * @property {'pending_review' | 'approved' | 'rejected'} status
 * @property {string} fileName
 * @property {string|null} expiryDate
 * @property {string|null} rejectionReason
 */

export {};
