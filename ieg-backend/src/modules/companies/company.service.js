const mongoose = require('mongoose');
const Company = require('./company.model');
const ApiError = require('../../utils/ApiError');

/**
 * Create a Company for a user, INSIDE an existing transaction.
 *
 * A `session` is mandatory (not optional) by design: this method is always
 * called as one half of a two-write operation (create Company + set
 * User.companyId). Requiring the session at the signature level makes it
 * impossible to accidentally call this outside a transaction and end up
 * with a partially-linked user/company pair.
 *
 * Callers (M1.2 migration script, M2 registration flow) are responsible for
 * opening the session, calling session.withTransaction(), and committing —
 * this method only performs the Company-side write within that transaction.
 *
 * @param {string|ObjectId} userId
 * @param {'exporter'|'buyer'|'shipper'} companyType
 * @param {object} data - { legalName, tradeName, country, taxId, registrationNumber }
 * @param {mongoose.ClientSession} session - REQUIRED, active transaction session
 */
const createForUser = async (userId, companyType, data, session) => {
  if (!session) {
    throw new Error(
      'company.service.createForUser requires an active Mongoose session. ' +
      'Company creation must always be transactional with the related User update.',
    );
  }
  if (!userId) throw new Error('createForUser requires a userId');
  if (!['exporter', 'buyer', 'shipper'].includes(companyType)) {
    throw new Error(`createForUser received an invalid companyType: "${companyType}"`);
  }

  const [company] = await Company.create(
    [
      {
        ownerUserId: userId,
        legalName: data.legalName,
        tradeName: data.tradeName || null,
        companyType,
        country: data.country || 'EG',
        taxId: data.taxId || null,
        registrationNumber: data.registrationNumber || null,
        // verificationStatus intentionally omitted — schema default 'draft' applies.
        // Callers that need a specific starting status (e.g. the M1.2 migration
        // script re-deriving legacy verification state) must set it explicitly
        // via a separate, deliberate write — never silently overridden here.
      },
    ],
    { session },
  );

  return company;
};

/**
 * Fetch the Company owned by a given user. Returns null (not a throw) when
 * none exists — callers decide whether that's an error (e.g. a non-admin
 * user with no company is a data bug) or expected (e.g. an admin user).
 */
const getByUser = async (userId) => {
  return Company.findOne({ ownerUserId: userId });
};

const getById = async (companyId) => {
  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');
  return company;
};

/**
 * Self-service profile update. Ownership is enforced here — not only at the
 * route layer — so this service function is safe to call from anywhere.
 */
const updateProfile = async (companyId, userId, data) => {
  const company = await Company.findById(companyId);
  if (!company) throw ApiError.notFound('Company not found');

  if (String(company.ownerUserId) !== String(userId)) {
    throw ApiError.forbidden('You do not have permission to update this company');
  }

  const allowedFields = ['legalName', 'tradeName', 'country', 'taxId', 'registrationNumber'];
  for (const field of allowedFields) {
    if (data[field] !== undefined) company[field] = data[field];
  }

  await company.save();
  return company;
};

module.exports = { createForUser, getByUser, getById, updateProfile };
