/**
 * Full business workflow verification using newly registered users (no seed accounts).
 * Run: node scripts/verify-business-workflow.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { getMongoUri, getMongoOptions } = require('../src/config/mongoUri');
const Shipment = require('../src/modules/shipments/shipment.model');
const Order = require('../src/modules/orders/order.model');
const QuoteRequest = require('../src/modules/orders/quoteRequest.model');
const Product = require('../src/modules/products/product.model');
const User = require('../src/modules/users/user.model');

const BASE = process.env.API_BASE || 'http://127.0.0.1:5000/api/v1';
const ts = Date.now();

async function json(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

async function register(role, suffix) {
  const email = `${role}${suffix}${ts}@test.ieg.com`;
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: `Test ${role} ${suffix}`,
      email,
      password: 'Workflow@1234',
      role,
      companyName: `${role} Co ${ts}`,
      country: role === 'buyer' ? 'US' : 'EG',
      phone: '+10000000000',
    }),
  });
  const data = await json(res);
  return { email, token: data.data.accessToken, user: data.data.user };
}

async function main() {
  console.log('\n=== Business Workflow Verification (New Users) ===\n');

  await mongoose.connect(getMongoUri(), getMongoOptions());

  const suffix = 'wf';
  console.log('1. Register buyer, exporter, shipper...');
  const buyer = await register('buyer', suffix);
  const exporter = await register('exporter', suffix);
  const shipper = await register('shipper', suffix);

  const buyerUser = await User.findOne({ email: buyer.email });
  if (!buyerUser?.walletBalance || buyerUser.walletBalance <= 0) {
    throw new Error('New buyer should receive starter wallet balance');
  }
  console.log(`   Buyer wallet: $${buyerUser.walletBalance}`);

  console.log('2. Exporter creates published product...');
  const form = new FormData();
  form.append('nameEn', `Workflow Product ${ts}`);
  form.append('category', 'Agriculture');
  form.append('description', 'E2E workflow test product');
  form.append('status', 'published');
  form.append('pricing[pricePerUnit]', '25');
  form.append('pricing[currency]', 'USD');
  form.append('pricing[unit]', 'kg');
  form.append('inventory[quantity]', '5000');
  form.append('inventory[unit]', 'kg');
  form.append('moq', '100');

  const productRes = await fetch(`${BASE}/products`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${exporter.token}` },
    body: form,
  });
  const productData = await json(productRes);
  const productId = productData.data._id;
  if (productData.data.status !== 'published') {
    throw new Error(`Product not published (status: ${productData.data.status})`);
  }
  console.log(`   Product ${productId} published`);

  console.log('3. Buyer requests quote...');
  const quoteRes = await fetch(`${BASE}/orders/quotes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyer.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      quantity: 200,
      budgetMin: 4000,
      budgetMax: 6000,
      deliveryTimeline: '30 days',
      specialRequirements: 'Workflow test',
    }),
  });
  const quoteData = await json(quoteRes);
  const quoteId = quoteData.data._id;
  console.log(`   Quote ${quoteId} created`);

  console.log('4. Exporter accepts quote → order created...');
  const acceptRes = await fetch(`${BASE}/orders/quotes/${quoteId}/respond`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${exporter.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'accepted', responderNote: 'Accepted for workflow test' }),
  });
  const acceptData = await json(acceptRes);
  const orderId = acceptData.data.orderId?._id || acceptData.data.orderId;
  if (!orderId) throw new Error('No order created on quote accept');
  console.log(`   Order ${orderId} created`);

  const orderBeforePay = await Order.findById(orderId);
  if (orderBeforePay.status !== 'pending' || orderBeforePay.paymentStatus !== 'unpaid') {
    throw new Error('Order should be pending/unpaid before payment');
  }

  console.log('5. Buyer pays order (escrow)...');
  const payRes = await fetch(`${BASE}/payments/pay/${orderId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${buyer.token}` },
  });
  await json(payRes);

  const orderAfterPay = await Order.findById(orderId);
  if (orderAfterPay.status !== 'processing') throw new Error(`Expected processing, got ${orderAfterPay.status}`);
  if (orderAfterPay.paymentStatus !== 'held') throw new Error(`Expected held payment, got ${orderAfterPay.paymentStatus}`);
  console.log('   Order is processing with held payment');

  console.log('6. Exporter submits shipping request...');
  const shipReqRes = await fetch(`${BASE}/shipping-requests`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${exporter.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      originPort: 'Alexandria Port',
      destinationPort: 'Port of Rotterdam',
      carrier: 'Maersk',
      departureDate: new Date().toISOString(),
      eta: new Date(Date.now() + 14 * 86400000).toISOString(),
    }),
  });
  const shipReqData = await json(shipReqRes);
  const requestId = shipReqData.data._id;

  console.log('7. Shipper approves shipping request...');
  const approveRes = await fetch(`${BASE}/shipping-requests/${requestId}/review`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${shipper.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved', reviewerNote: 'Approved for workflow test' }),
  });
  const approveData = await json(approveRes);
  const shipmentId = approveData.data.shipment._id;
  const container = approveData.data.shipment.containerNumber;
  console.log(`   Shipment ${container} created`);

  console.log('8. Atlas persistence...');
  const atlasShipment = await Shipment.findById(shipmentId);
  if (!atlasShipment) throw new Error('Shipment not in Atlas');
  console.log('   Atlas OK');

  console.log('9. Buyer tracks shipment...');
  const trackRes = await fetch(`${BASE}/shipments/by-order/${orderId}`, {
    headers: { Authorization: `Bearer ${buyer.token}` },
  });
  await json(trackRes);
  console.log('   Buyer tracking OK');

  console.log('10. Mark shipment delivered (await buyer confirmation)...');
  const patchRes = await fetch(`${BASE}/shipments/${shipmentId}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${shipper.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'delivered', location: 'Destination port', note: 'Delivered' }),
  });
  await json(patchRes);
  const orderAfterDelivery = await Order.findById(orderId);
  if (orderAfterDelivery.status !== 'delivered') throw new Error('Order not marked delivered');
  if (orderAfterDelivery.paymentStatus !== 'held') throw new Error('Escrow should remain held until confirmation');
  console.log('   Shipment delivered — escrow still held');

  console.log('11. Escrow release on delivery confirmation...');
  const orderBeforeConfirm = await Order.findById(orderId);
  if (orderBeforeConfirm.paymentStatus !== 'held') throw new Error('Payment should still be held before confirmation');

  const confirmRes = await fetch(`${BASE}/orders/${orderId}/confirm-delivery`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${buyer.token}` },
  });
  await json(confirmRes);

  const orderDelivered = await Order.findById(orderId);
  if (orderDelivered.paymentStatus !== 'released') throw new Error('Escrow not released after delivery confirmation');
  if (!orderDelivered.platformFeeUsd || !orderDelivered.exporterPayoutUsd) {
    throw new Error('Platform fee / exporter payout not recorded on order');
  }

  const exporterUser = await User.findOne({ email: exporter.email });
  const expectedPayout = orderDelivered.totalValueUsd * 0.975;
  if (Math.abs(exporterUser.availableBalance - expectedPayout) > 0.02) {
    throw new Error(`Exporter available balance expected ~${expectedPayout}, got ${exporterUser.availableBalance}`);
  }
  console.log(`   Escrow released — fee $${orderDelivered.platformFeeUsd}, exporter payout $${orderDelivered.exporterPayoutUsd}`);

  console.log('\n=== ALL BUSINESS WORKFLOW CHECKS PASSED ===');
  console.log(`Test users: buyer=${buyer.email} exporter=${exporter.email} shipper=${shipper.email}\n`);

  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('FAILED:', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
