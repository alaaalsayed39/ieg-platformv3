/**
 * Verify export document upload dates, expiry (+15 days), Atlas persistence, and delete.
 * Usage: npm run dev then node scripts/verify-documents-flow.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { getMongoUri, getMongoOptions } = require('../src/config/mongoUri');
const { resolveFilePath } = require('../src/utils/fileStorage');
const Document = require('../src/modules/documents/document.model');

const HOST = process.env.API_HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const BASE = `http://${HOST}:${PORT}/api/v1`;

const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exit(1);
};

const pass = (msg) => console.log('PASS:', msg);

async function login() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'exporter1@ieg.com', password: 'Export@1234' }),
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json();
  if (!res.ok) fail(`Login: ${data.message}`);
  return data.data.accessToken;
}

function sameDay(a, b) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate();
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('\n=== Document Flow Verification ===\n');

  const health = await fetch(`http://${HOST}:${PORT}/health`, { signal: AbortSignal.timeout(5000) })
    .catch(() => fail('API not running on port ' + PORT));
  if (!health.ok) fail('Health check failed');

  const token = await login();
  const pdfPath = path.join(__dirname, 'test-doc.pdf');
  const pdfContent = '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF';
  fs.writeFileSync(pdfPath, pdfContent);

  const form = new FormData();
  form.append('file', new Blob([pdfContent], { type: 'application/pdf' }), 'verify-doc.pdf');
  form.append('type', 'commercial_invoice');

  console.log('1. POST /documents/upload...');
  const uploadRes = await fetch(`${BASE}/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: AbortSignal.timeout(15000),
  });
  const uploadBody = await uploadRes.json();
  if (!uploadRes.ok) fail(`Upload HTTP ${uploadRes.status}: ${uploadBody.message}`);

  const doc = uploadBody.data;
  if (!doc._id) fail('No document id returned');
  pass(`Document created: ${doc._id}`);

  const now = new Date();
  const uploadDate = doc.uploadDate || doc.createdAt;
  if (!sameDay(uploadDate, now)) fail(`Upload date mismatch: ${uploadDate}`);
  pass('Upload date is today');

  if (!doc.expiryDate) fail('Expiry date missing');
  if (!sameDay(doc.expiryDate, addDays(uploadDate, 15))) {
    fail(`Expiry date should be upload + 15 days: got ${doc.expiryDate}`);
  }
  pass('Expiry date is upload date + 15 days');

  const filePath = resolveFilePath(doc.fileUrl);
  if (!filePath || !fs.existsSync(filePath)) fail('Physical file not saved');
  pass('Physical file exists on disk');

  await mongoose.connect(getMongoUri(), getMongoOptions());
  const atlasDoc = await Document.findById(doc._id).lean();
  if (!atlasDoc) fail('Document not found in MongoDB Atlas');
  if (!atlasDoc.uploadDate) fail('uploadDate not persisted in Atlas');
  if (!atlasDoc.expiryDate) fail('expiryDate not persisted in Atlas');
  pass('Document persisted in MongoDB Atlas');

  console.log('2. DELETE /documents/:id...');
  const delRes = await fetch(`${BASE}/documents/${doc._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10000),
  });
  const delBody = await delRes.json().catch(() => ({}));
  if (!delRes.ok) fail(`Delete HTTP ${delRes.status}: ${delBody.message}`);
  pass('Delete API succeeded');

  const gone = await Document.findById(doc._id);
  if (gone) fail('Document still in Atlas after delete');
  pass('MongoDB record removed');

  if (fs.existsSync(filePath)) fail('Physical file still exists after delete');
  pass('Physical file removed');

  await mongoose.disconnect();
  fs.unlinkSync(pdfPath);
  console.log('\n=== All document checks passed ===\n');
}

main().catch((e) => fail(e.message));
