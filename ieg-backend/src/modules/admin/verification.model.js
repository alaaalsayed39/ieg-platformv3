/**
 * admin/verification.model.js
 *
 * FIXED: This file previously registered a second Mongoose model named
 * "Verification", which conflicted with verifications/verification.model.js.
 *
 * The canonical model lives in verifications/verification.model.js (used by
 * the active verification routes and services). This file now simply re-exports
 * it so that any code that requires admin/verification.model.js still works
 * without causing a "Cannot overwrite `Verification` model" crash.
 */
const Verification = require('../verifications/verification.model');
module.exports = Verification;
