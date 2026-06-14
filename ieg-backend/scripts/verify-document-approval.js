/**
 * End-to-end document approval workflow verification.
 * Usage: npm run dev then node scripts/verify-document-approval.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { getMongoUri, getMongoOptions } = require('../src/config/mongoUri');
const Document = require('../src/modules/documents/document.model');
const Notification = require('../src/modules/notifications/notification.model');

const HOST = process.env.API_HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const BASE = `http://${HOST}:${PORT}/api/v1`;

const pass = (msg) => console.log('PASS:', msg);
const fail = (msg) => { console.error('FAIL:', msg); process.exit(1); };

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) fail(`Login ${email}: ${data.message}`);
  return data.data.accessToken;
}

async function uploadDoc(token) {
  const pdfContent = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';
  const form = new FormData();
  form.append('file', new Blob([pdfContent], { type: 'application/pdf' }), 'approval-test.pdf');
  form.append('type', 'commercial_invoice');

  const res = await fetch(`${BASE}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: AbortSignal.timeout(15000),
  });
  const body = await res.json();
  if (!res.ok) fail(`Upload: ${body.message}`);
  return body.data;
}

async function main() {
  console.log('\n=== Document Approval Workflow Verification ===\n');

  await fetch(`http://${HOST}:${PORT}/health`, { signal: AbortSignal.timeout(5000) })
    .catch(() => fail('API not running'));

  const exporterToken = await login('exporter1@ieg.com', 'Export@1234');
  const adminToken = await login('admin@ieg.com', 'Admin@1234');

  console.log('1. Exporter uploads document...');
  const uploaded = await uploadDoc(exporterToken);
  if (uploaded.status !== 'pending_review' && uploaded.status !== 'pending') {
    fail(`Expected pending_review, got ${uploaded.status}`);
  }
  pass(`Upload status = pending_review (${uploaded._id})`);

  await mongoose.connect(getMongoUri(), getMongoOptions());
  const atlasPending = await Document.findById(uploaded._id).lean();
  if (!atlasPending || atlasPending.status !== 'pending_review') fail('Atlas record not pending_review');
  pass('Persisted in MongoDB Atlas as pending_review');

  console.log('2. Admin lists pending documents...');
  const listRes = await fetch(`${BASE}/documents/admin/all?status=pending_review`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    signal: AbortSignal.timeout(10000),
  });
  const listBody = await listRes.json();
  if (!listRes.ok) fail(`Admin list: ${listBody.message}`);
  const found = (listBody.data || []).some((d) => String(d._id) === String(uploaded._id));
  if (!found) fail('Uploaded document not visible to admin');
  pass('Admin sees document in pending queue');

  console.log('3. Admin approves document...');
  const approveRes = await fetch(`${BASE}/documents/${uploaded._id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ approvalNotes: 'Verified for export compliance.' }),
    signal: AbortSignal.timeout(10000),
  });
  const approveBody = await approveRes.json();
  if (!approveRes.ok) fail(`Approve: ${approveBody.message}`);
  if (approveBody.data.status !== 'approved') fail('Approve did not set approved status');
  pass('Admin approve succeeded');

  const notifApprove = await Notification.findOne({
    userId: approveBody.data.userId._id || approveBody.data.userId,
    title: 'Your document has been approved.',
  }).sort({ createdAt: -1 });
  if (!notifApprove) fail('Approval notification not created');
  pass(`Approval notification: "${notifApprove.body?.slice(0, 60)}..."`);

  console.log('4. Exporter sees approved status...');
  const myRes = await fetch(`${BASE}/documents/my`, {
    headers: { Authorization: `Bearer ${exporterToken}` },
    signal: AbortSignal.timeout(10000),
  });
  const myBody = await myRes.json();
  const approvedDoc = (myBody.data || []).find((d) => String(d._id) === String(uploaded._id));
  if (!approvedDoc || approvedDoc.status !== 'approved') fail('Exporter does not see approved status');
  pass('Exporter sees approved document');

  console.log('5. Upload second document and reject...');
  const upload2 = await uploadDoc(exporterToken);
  const rejectRes = await fetch(`${BASE}/documents/${upload2._id}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectionReason: 'Document is blurry — please re-upload a clear scan.' }),
    signal: AbortSignal.timeout(10000),
  });
  const rejectBody = await rejectRes.json();
  if (!rejectRes.ok) fail(`Reject: ${rejectBody.message}`);
  if (rejectBody.data.status !== 'rejected') fail('Reject did not set rejected status');
  if (!rejectBody.data.rejectionReason) fail('Rejection reason not saved');
  pass('Admin reject with reason succeeded');

  const notifReject = await Notification.findOne({
    userId: rejectBody.data.userId._id || rejectBody.data.userId,
    title: 'Your document has been rejected.',
  }).sort({ createdAt: -1 });
  if (!notifReject) fail('Rejection notification not created');
  if (!notifReject.body?.includes('blurry')) fail('Notification missing rejection reason');
  pass(`Rejection notification: "${notifReject.body?.slice(0, 80)}..."`);

  const atlasRejected = await Document.findById(upload2._id).lean();
  if (atlasRejected.status !== 'rejected') fail('Rejected status not in Atlas');
  pass('Rejected document persisted in Atlas');

  console.log('6. Exporter stats reflect counts...');
  const statsRes = await fetch(`${BASE}/documents/stats`, {
    headers: { Authorization: `Bearer ${exporterToken}` },
    signal: AbortSignal.timeout(10000),
  });
  const statsBody = await statsRes.json();
  const stats = statsBody.data || {};
  if (typeof stats.approved !== 'number' || typeof stats.pending !== 'number' || typeof stats.rejected !== 'number') {
    fail('Stats missing approved/pending/rejected counts');
  }
  pass(`Stats — approved: ${stats.approved}, pending: ${stats.pending}, rejected: ${stats.rejected}`);

  await mongoose.disconnect();
  console.log('\n=== All document approval checks passed ===\n');
}

main().catch((e) => fail(e.message));
