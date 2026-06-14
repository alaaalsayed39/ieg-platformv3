/**
 * End-to-end product + image persistence verification against live API + Atlas.
 * Usage: npm run dev (or test:e2e:ci) then node scripts/verify-product-flow.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { getMongoUri, getMongoOptions } = require('../src/config/mongoUri');
const { resolveFilePath } = require('../src/utils/fileStorage');

const HOST = process.env.API_HOST || '127.0.0.1';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const BASE = `http://${HOST}:${PORT}/api/v1`;

const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exit(1);
};

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

async function main() {
  console.log('\n=== Product Flow Verification ===\n');

  // Health
  const health = await fetch(`http://${HOST}:${PORT}/health`, { signal: AbortSignal.timeout(5000) })
    .catch(() => fail('API not running on port ' + PORT));
  if (!health.ok) fail('Health check failed');

  const token = await login();
  const name = `__audit_product_${Date.now()}`;

  // Create minimal PNG (1x1)
  const pngPath = path.join(__dirname, 'test-pixel.png');
  if (!fs.existsSync(pngPath)) {
    const buf = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    fs.writeFileSync(pngPath, buf);
  }

  const form = new FormData();
  form.append('nameEn', name);
  form.append('category', 'Agriculture');
  form.append('description', 'Audit test product');
  form.append('status', 'published');
  form.append('moq', '10');
  form.append('tags', 'audit,test');
  form.append('pricing[pricePerUnit]', '99.5');
  form.append('pricing[currency]', 'USD');
  form.append('pricing[unit]', 'kg');
  form.append('inventory[quantity]', '100');
  form.append('inventory[unit]', 'kg');
  form.append('images', new Blob([fs.readFileSync(pngPath)], { type: 'image/png' }), 'test-pixel.png');

  console.log('1. POST /products (multipart)...');
  const createRes = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: AbortSignal.timeout(30000),
  });
  const createBody = await createRes.json();
  if (!createRes.ok) {
    console.error('Response:', JSON.stringify(createBody, null, 2));
    fail(`Create product HTTP ${createRes.status}: ${createBody.message}`);
  }

  const product = createBody.data;
  const productId = product._id;
  const imageUrl = product.images?.[0]?.url;
  console.log('   Created id:', productId);
  console.log('   Status:', product.status);
  console.log('   Image URL:', imageUrl);

  if (!productId) fail('No product _id in response');
  if (!imageUrl) fail('No image URL in created product');

  console.log('\n2. Atlas direct read...');
  await mongoose.connect(getMongoUri(), getMongoOptions());
  const Product = require('../src/modules/products/product.model');
  const doc = await Product.findById(productId).lean();
  if (!doc) fail('Product not found in Atlas');
  if (doc.nameEn !== name) fail(`Atlas name mismatch: ${doc.nameEn}`);
  console.log('   Atlas document OK');

  console.log('\n3. GET /products/my/products...');
  const myRes = await fetch(`${BASE}/products/my/products?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const myData = await myRes.json();
  const found = (myData.data || []).find((p) => p._id === productId);
  if (!found) fail('Product not in exporter list API');
  console.log('   Exporter list OK');

  console.log('\n4. GET /products (marketplace)...');
  const mktRes = await fetch(`${BASE}/products?limit=50`);
  const mktData = await mktRes.json();
  const inMarket = (mktData.data || []).find((p) => p._id === productId);
  if (product.status === 'published' && !inMarket) {
    fail(`Published product not in marketplace (status=${product.status})`);
  }
  if (product.status !== 'published') {
    console.log(`   Skipped marketplace check — status is ${product.status}`);
  } else {
    console.log('   Marketplace OK');
  }

  console.log('\n5. Static image file...');
  const filePath = resolveFilePath(imageUrl);
  if (!filePath) fail(`Image file missing on disk for ${imageUrl}`);
  console.log('   File exists:', filePath);

  const imgHttp = await fetch(`http://${HOST}:${PORT}${imageUrl}`, { signal: AbortSignal.timeout(5000) });
  if (!imgHttp.ok) fail(`Image HTTP ${imgHttp.status} for ${imageUrl}`);
  console.log('   Image HTTP OK, bytes:', (await imgHttp.arrayBuffer()).byteLength);

  // Cleanup
  await Product.findByIdAndDelete(productId);
  if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await mongoose.disconnect();

  console.log('\n=== ALL CHECKS PASSED ===\n');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
