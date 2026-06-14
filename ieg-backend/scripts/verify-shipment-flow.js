/**
 * End-to-end shipment workflow verification.
 * Run: node scripts/verify-shipment-flow.js
 * Requires backend running on PORT (default 5000).
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { getMongoUri, getMongoOptions } = require('../src/config/mongoUri');
const Shipment = require('../src/modules/shipments/shipment.model');
const Order = require('../src/modules/orders/order.model');

const BASE = process.env.API_BASE || 'http://127.0.0.1:5000/api/v1';

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data.data.accessToken;
}

async function json(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function main() {
  console.log('\n=== Shipment Flow Verification ===\n');

  await mongoose.connect(getMongoUri(), getMongoOptions());
  const shipperToken = await login('shipper1@ieg.com', 'Ship@1234');
  const buyerToken = await login('buyer1@ieg.com', 'Buyer@1234');

  // Find processing order without shipment
  const orderIdsWithShipment = await Shipment.distinct('orderId');
  let order = await Order.findOne({
    status: 'processing',
    paymentStatus: { $in: ['held', 'paid'] },
    _id: { $nin: orderIdsWithShipment },
  }).lean();

  if (!order) {
    console.log('No available processing order — using OR-2025-10003 pattern or skipping create');
    order = await Order.findOne({ orderNumber: 'OR-2025-10003' }).lean();
    if (order) {
      await Order.findByIdAndUpdate(order._id, { status: 'processing', paymentStatus: 'held', shipperId: null });
      await Shipment.deleteOne({ orderId: order._id });
      order = await Order.findById(order._id).lean();
      console.log('   Reset order OR-2025-10003 for create test');
    }
  }

  if (!order) throw new Error('No order available for shipment create test');

  console.log('1. GET /shipments/available-orders...');
  const availRes = await fetch(`${BASE}/shipments/available-orders`, {
    headers: { Authorization: `Bearer ${shipperToken}` },
  });
  const availData = await json(availRes);
  const found = (availData.data || []).some((o) => o._id === order._id.toString());
  if (!found) console.log('   Warning: test order not in available list (may still create)');

  console.log('2. POST /shipments...');
  const createRes = await fetch(`${BASE}/shipments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${shipperToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId: order._id.toString(),
      originPort: 'Alexandria Port, Egypt',
      destinationPort: 'Rotterdam, Netherlands',
      carrier: 'Maersk Test',
      departureDate: new Date().toISOString(),
      eta: new Date(Date.now() + 14 * 86400000).toISOString(),
    }),
  });
  const createData = await json(createRes);
  const shipmentId = createData.data._id;
  const container = createData.data.containerNumber;
  console.log(`   Created ${container} id=${shipmentId}`);

  console.log('3. Atlas direct read...');
  const atlasDoc = await Shipment.findById(shipmentId);
  if (!atlasDoc) throw new Error('Not in Atlas');
  console.log('   Atlas document OK');

  const stages = ['customs_cleared', 'in_transit', 'arrived', 'delivered'];
  for (const status of stages) {
    console.log(`4. PATCH status → ${status}...`);
    const patchRes = await fetch(`${BASE}/shipments/${shipmentId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${shipperToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        location: `Test location ${status}`,
        note: `Automated test ${status}`,
      }),
    });
    await json(patchRes);
  }

  const finalDoc = await Shipment.findById(shipmentId);
  if (finalDoc.stages.length < 5) throw new Error('Stages not accumulated');
  console.log(`   Stages count: ${finalDoc.stages.length}`);

  console.log('5. GET /shipments/by-order/:orderId (buyer)...');
  const byOrderRes = await fetch(`${BASE}/shipments/by-order/${order._id}`, {
    headers: { Authorization: `Bearer ${buyerToken}` },
  });
  const byOrderData = await json(byOrderRes);
  if (byOrderData.data.status !== 'delivered') throw new Error('Buyer view wrong status');
  console.log('   Buyer tracking OK');

  console.log('6. GET /shipments/stats...');
  const statsRes = await fetch(`${BASE}/shipments/stats`, {
    headers: { Authorization: `Bearer ${shipperToken}` },
  });
  const statsData = await json(statsRes);
  if (typeof statsData.data.total !== 'number') throw new Error('Invalid stats');
  console.log(`   Stats: total=${statsData.data.total} delivered=${statsData.data.delivered}`);

  console.log('7. GET /shipments/export/report (CSV)...');
  const csvRes = await fetch(`${BASE}/shipments/export/report`, {
    headers: { Authorization: `Bearer ${shipperToken}` },
  });
  const csvText = await csvRes.text();
  if (!csvText.includes('Container')) throw new Error('Invalid CSV');
  console.log('   CSV OK');

  console.log('8. GET /shipments/export/report/pdf...');
  const pdfRes = await fetch(`${BASE}/shipments/export/report/pdf`, {
    headers: { Authorization: `Bearer ${shipperToken}` },
  });
  const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
  if (!pdfBuf.toString('utf8', 0, 4).startsWith('%PDF')) throw new Error('Invalid PDF');
  console.log(`   PDF OK (${pdfBuf.length} bytes)`);

  console.log('9. GET /shipments?search=...');
  const searchRes = await fetch(`${BASE}/shipments?search=${encodeURIComponent(container.slice(0, 8))}`, {
    headers: { Authorization: `Bearer ${shipperToken}` },
  });
  const searchData = await json(searchRes);
  if (!searchData.data.some((s) => s.containerNumber === container)) throw new Error('Search failed');
  console.log('   Search OK');

  console.log('\n=== ALL SHIPMENT CHECKS PASSED ===\n');
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('FAILED:', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
