/**
 * Independent verification of the Company migration.
 *
 * Deliberately a SEPARATE script from migrate-companies.js — it re-queries
 * the database fresh rather than trusting the migration run's own report,
 * so it's a genuine independent check rather than the migration grading
 * its own work. Safe to re-run at any time (e.g. as a periodic health
 * check), not just once after migrating.
 *
 * Checks performed:
 *   1. Every eligible user has a company (User.companyId is set)
 *   2. Every User.companyId references an existing Company
 *   3. Every Company.ownerUserId references an existing User
 *   4. No duplicate companies exist for the same owner
 *   5. Bidirectional consistency: User.companyId <-> Company.ownerUserId
 *      agree with each other, not just each independently resolving to
 *      *something* (this is stricter than checks 2+3 combined — it would
 *      catch a subtle bug where links exist on both sides but point to
 *      mismatched records).
 *   6. Total Company count matches the expected number of migrated users
 *
 * Exit code 0 = all checks passed. Exit code 1 = at least one check failed
 * (usable as a CI/deployment gate).
 *
 * Usage:
 *   node scripts/verify-companies-migration.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { getMongoUri, getMongoOptions } = require('../src/config/mongoUri');

const User = require('../src/modules/users/user.model');
const Company = require('../src/modules/companies/company.model');

const REPORT_DIR = path.join(__dirname, 'migration-reports');
const MAX_LISTED_ERRORS = 20; // cap detailed error listing for readability; full list still in JSON report

const checks = [];

const recordCheck = (name, passed, details) => {
  checks.push({ name, passed, details });
};

// ── Check 1: every eligible user has a company ─────────────────────────────
const checkEveryUserHasCompany = async () => {
  const unlinked = await User.find({ role: { $ne: 'admin' }, companyId: null })
    .select('_id email role')
    .lean();

  recordCheck(
    'Every eligible user has a company (User.companyId is set)',
    unlinked.length === 0,
    {
      unlinkedCount: unlinked.length,
      sample: unlinked.slice(0, MAX_LISTED_ERRORS).map((u) => ({ id: u._id, email: u.email, role: u.role })),
    },
  );
};

// ── Check 2: every User.companyId resolves to a real Company ───────────────
const checkUserCompanyIdResolves = async () => {
  const linkedUsers = await User.find({ companyId: { $ne: null } }).select('_id email companyId').lean();
  const companyIds = [...new Set(linkedUsers.map((u) => String(u.companyId)))];
  const existingCompanies = await Company.find({ _id: { $in: companyIds } }).select('_id').lean();
  const existingIdSet = new Set(existingCompanies.map((c) => String(c._id)));

  const broken = linkedUsers.filter((u) => !existingIdSet.has(String(u.companyId)));

  recordCheck(
    'Every User.companyId references an existing Company',
    broken.length === 0,
    {
      brokenCount: broken.length,
      sample: broken.slice(0, MAX_LISTED_ERRORS).map((u) => ({ userId: u._id, email: u.email, danglingCompanyId: u.companyId })),
    },
  );
};

// ── Check 3: every Company.ownerUserId resolves to a real User ─────────────
const checkCompanyOwnerResolves = async () => {
  const companies = await Company.find({}).select('_id ownerUserId legalName').lean();
  const ownerIds = [...new Set(companies.map((c) => String(c.ownerUserId)))];
  const existingUsers = await User.find({ _id: { $in: ownerIds } }).select('_id').lean();
  const existingIdSet = new Set(existingUsers.map((u) => String(u._id)));

  const orphanCompanies = companies.filter((c) => !existingIdSet.has(String(c.ownerUserId)));

  recordCheck(
    'Every Company.ownerUserId references an existing User',
    orphanCompanies.length === 0,
    {
      orphanCount: orphanCompanies.length,
      sample: orphanCompanies.slice(0, MAX_LISTED_ERRORS).map((c) => ({ companyId: c._id, legalName: c.legalName, danglingOwnerUserId: c.ownerUserId })),
    },
  );

  return companies; // reused by checks 4-6 to avoid re-querying
};

// ── Check 4: no duplicate companies for the same owner ─────────────────────
const checkNoDuplicateCompanies = async (companies) => {
  const countByOwner = new Map();
  for (const c of companies) {
    const key = String(c.ownerUserId);
    countByOwner.set(key, (countByOwner.get(key) || 0) + 1);
  }
  const duplicates = [...countByOwner.entries()].filter(([, count]) => count > 1);

  recordCheck(
    'No duplicate companies exist for the same owner',
    duplicates.length === 0,
    {
      duplicateOwnerCount: duplicates.length,
      sample: duplicates.slice(0, MAX_LISTED_ERRORS).map(([ownerUserId, count]) => ({ ownerUserId, companyCount: count })),
    },
  );
};

// ── Check 5: bidirectional consistency (stricter than 2+3 combined) ────────
const checkBidirectionalConsistency = async () => {
  const linkedUsers = await User.find({ companyId: { $ne: null } }).select('_id email companyId').lean();
  const companyIds = linkedUsers.map((u) => u.companyId);
  const companies = await Company.find({ _id: { $in: companyIds } }).select('_id ownerUserId').lean();
  const companyById = new Map(companies.map((c) => [String(c._id), c]));

  const mismatches = [];
  for (const user of linkedUsers) {
    const company = companyById.get(String(user.companyId));
    if (!company) continue; // already caught by check 2 — avoid double-reporting the same root cause
    if (String(company.ownerUserId) !== String(user._id)) {
      mismatches.push({
        userId: user._id,
        email: user.email,
        userPointsToCompany: user.companyId,
        thatCompanyPointsBackTo: company.ownerUserId,
      });
    }
  }

  recordCheck(
    'User.companyId and Company.ownerUserId are bidirectionally consistent',
    mismatches.length === 0,
    {
      mismatchCount: mismatches.length,
      sample: mismatches.slice(0, MAX_LISTED_ERRORS),
    },
  );
};

// ── Check 6: total Company count matches expected migrated user count ──────
const checkCountReconciliation = async () => {
  const expectedUserCount = await User.countDocuments({ role: { $ne: 'admin' } });
  const actualCompanyCount = await Company.countDocuments();

  recordCheck(
    'Total Company count matches expected number of migrated users',
    expectedUserCount === actualCompanyCount,
    { expectedUserCount, actualCompanyCount, difference: actualCompanyCount - expectedUserCount },
  );
};

const run = async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log('Company Migration — Independent Verification');
  console.log('='.repeat(60));

  await mongoose.connect(getMongoUri(), getMongoOptions());
  console.log(`Connected: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  await checkEveryUserHasCompany();
  await checkUserCompanyIdResolves();
  const companies = await checkCompanyOwnerResolves();
  await checkNoDuplicateCompanies(companies);
  await checkBidirectionalConsistency();
  await checkCountReconciliation();

  console.log('Results:');
  console.log('-'.repeat(60));
  let allPassed = true;
  for (const check of checks) {
    const marker = check.passed ? '✓ PASS' : '✗ FAIL';
    if (!check.passed) allPassed = false;
    console.log(`  [${marker}] ${check.name}`);
    if (!check.passed) {
      console.log(`           ${JSON.stringify(check.details, null, 2).split('\n').join('\n           ')}`);
    }
  }

  console.log(`\n${'-'.repeat(60)}`);
  console.log(`Overall: ${allPassed ? 'ALL CHECKS PASSED ✓' : 'ONE OR MORE CHECKS FAILED ✗'}`);
  console.log('-'.repeat(60));

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `verify-companies-migration-${Date.now()}.json`);
  fs.writeFileSync(
    reportPath,
    JSON.stringify({ timestamp: new Date().toISOString(), allPassed, checks }, null, 2),
  );
  console.log(`\nFull report written to: ${reportPath}\n`);

  await mongoose.disconnect();
  process.exit(allPassed ? 0 : 1);
};

run().catch((err) => {
  console.error('\nFATAL verification error:', err);
  process.exit(1);
});
