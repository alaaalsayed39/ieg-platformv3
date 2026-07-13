/**
 * Migration: backfill Company records for existing users.
 *
 * For every non-admin User missing a companyId:
 *   1. Create a Company (via the existing company.service.createForUser —
 *      not reimplemented here) with companyType derived from User.role.
 *   2. Derive the initial verificationStatus from the legacy Verification
 *      collection (see STATUS_MAP below), then apply it as a deliberate
 *      follow-up write — company.service.createForUser always defaults new
 *      companies to 'draft' by design (see company.service.js), so setting
 *      a different starting status here is an explicit, separate step.
 *   3. Link User.companyId to the new Company.
 *
 * Every user is processed inside its own MongoDB transaction (steps 1-3
 * commit or roll back together) — a crash mid-run never leaves a User
 * linked to a non-existent Company, or a Company with no owning User link.
 *
 * IDEMPOTENT: safe to re-run.
 *   - Selection filter only picks up users still missing companyId.
 *   - Defensive check: if a Company already exists for a user (e.g. a prior
 *     run created the Company but crashed before saving User.companyId),
 *     the existing Company is reused and linked — never duplicated.
 *
 * Usage:
 *   node scripts/migrate-companies.js
 *   node scripts/migrate-companies.js --dry-run   (report only, no writes)
 *
 * Run against a staging copy of production data first. Always follow this
 * script with scripts/verify-companies-migration.js before trusting the
 * result.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { getMongoUri, getMongoOptions } = require('../src/config/mongoUri');

const User = require('../src/modules/users/user.model');
const Company = require('../src/modules/companies/company.model');
const Verification = require('../src/modules/verifications/verification.model');
const companyService = require('../src/modules/companies/company.service');

const isDryRun = process.argv.includes('--dry-run');

// Legacy Verification.status -> Company.verificationStatus
const STATUS_MAP = {
  pending: 'pending',
  under_review: 'pending',
  approved: 'verified',
  rejected: 'rejected',
};

const REPORT_DIR = path.join(__dirname, 'migration-reports');

const buildLegalName = (user) => {
  const trimmed = (user.companyName || '').trim();
  return trimmed || `${user.fullName}'s Company`;
};

/**
 * Migrate a single user inside its own transaction.
 * Returns a result descriptor: { userId, email, outcome, companyId? }
 * outcome ∈ 'created' | 'relinked-existing' | 'skipped-dry-run' | 'failed'
 */
const migrateOneUser = async (user) => {
  // Defensive idempotency check: does a Company already exist for this
  // user (e.g. left over from a crashed prior run)? If so, reuse it
  // instead of creating a duplicate.
  const existingCompany = await Company.findOne({ ownerUserId: user._id });

  if (isDryRun) {
    return {
      userId: String(user._id),
      email: user.email,
      outcome: existingCompany ? 'would-relink-existing' : 'would-create',
    };
  }

  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      let company = existingCompany;

      if (!company) {
        const legacyVerification = await Verification.findOne({ userId: user._id }).session(session);
        const verificationStatus = legacyVerification
          ? (STATUS_MAP[legacyVerification.status] || 'draft')
          : 'draft';

        company = await companyService.createForUser(
          user._id,
          user.role, // role enum ['exporter','buyer','shipper'] maps 1:1 to companyType
          {
            legalName: buildLegalName(user),
            country: user.country || 'EG',
          },
          session,
        );

        // Apply the derived starting status as a deliberate, separate write
        // (createForUser always defaults to 'draft' — see company.service.js).
        if (verificationStatus !== 'draft') {
          company.verificationStatus = verificationStatus;
          if (verificationStatus === 'verified') {
            company.verifiedAt = legacyVerification.reviewedAt || new Date();
          }
          if (verificationStatus === 'rejected') {
            company.rejectedAt = legacyVerification.reviewedAt || new Date();
            company.rejectionReason = legacyVerification.reviewerNotes || 'Migrated from legacy verification record';
          }
          await company.save({ session });
        }
      }

      user.companyId = company._id;
      await user.save({ session });

      result = {
        userId: String(user._id),
        email: user.email,
        outcome: existingCompany ? 'relinked-existing' : 'created',
        companyId: String(company._id),
        verificationStatus: company.verificationStatus,
      };
    });
  } catch (err) {
    // withTransaction aborts automatically on a thrown error — nothing
    // partially committed. Record the failure and move on to the next user.
    result = {
      userId: String(user._id),
      email: user.email,
      outcome: 'failed',
      error: err.message,
    };
  } finally {
    await session.endSession();
  }

  return result;
};

const run = async () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Company Migration ${isDryRun ? '(DRY RUN — no writes will occur)' : ''}`);
  console.log('='.repeat(60));

  await mongoose.connect(getMongoUri(), getMongoOptions());
  console.log(`Connected: ${mongoose.connection.host}/${mongoose.connection.name}\n`);

  const eligibleUsers = await User.find({ role: { $ne: 'admin' }, companyId: null });
  console.log(`Eligible users found (role != admin, companyId == null): ${eligibleUsers.length}\n`);

  if (eligibleUsers.length === 0) {
    console.log('Nothing to migrate — all eligible users already have a linked Company.');
  }

  const results = [];
  for (const [i, user] of eligibleUsers.entries()) {
    const r = await migrateOneUser(user);
    results.push(r);
    const marker = r.outcome === 'failed' ? '✗' : '✓';
    console.log(
      `  [${i + 1}/${eligibleUsers.length}] ${marker} ${user.email} (${user.role}) -> ${r.outcome}` +
      (r.verificationStatus ? ` [status: ${r.verificationStatus}]` : '') +
      (r.error ? ` — ERROR: ${r.error}` : ''),
    );
  }

  const summary = {
    timestamp: new Date().toISOString(),
    dryRun: isDryRun,
    totalEligible: eligibleUsers.length,
    created: results.filter((r) => r.outcome === 'created' || r.outcome === 'would-create').length,
    relinkedExisting: results.filter((r) => r.outcome === 'relinked-existing' || r.outcome === 'would-relink-existing').length,
    failed: results.filter((r) => r.outcome === 'failed'),
  };

  console.log(`\n${'-'.repeat(60)}`);
  console.log('Summary');
  console.log('-'.repeat(60));
  console.log(`  Total eligible:      ${summary.totalEligible}`);
  console.log(`  Created:             ${summary.created}`);
  console.log(`  Relinked (existing): ${summary.relinkedExisting}`);
  console.log(`  Failed:              ${summary.failed.length}`);

  if (summary.failed.length > 0) {
    console.log('\n  Failures:');
    summary.failed.forEach((f) => console.log(`    - ${f.email} (${f.userId}): ${f.error}`));
    console.log('\n  Re-run this script after investigating — it is idempotent and will only retry the users above.');
  }

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `migrate-companies-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({ summary, results }, null, 2));
  console.log(`\n  Full report written to: ${reportPath}`);
  console.log('  (contains user IDs/emails — treat as sensitive, do not commit)\n');

  await mongoose.disconnect();
  process.exit(summary.failed.length > 0 ? 1 : 0);
};

run().catch((err) => {
  console.error('\nFATAL migration error:', err);
  process.exit(1);
});
