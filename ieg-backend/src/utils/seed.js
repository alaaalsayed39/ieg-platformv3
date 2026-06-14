// src/utils/seed.js
/**
 * IEG Platform — Complete Database Seeder
 *
 * FIXED:
 *  1. Removed invalid `{ Wallet, Transaction }` destructuring from wallet.model.js.
 *     wallet.model.js exports a single "Transaction" Mongoose model, not an object
 *     with a Wallet property. Balances are stored on the User document
 *     (availableBalance / heldBalance), not in a separate Wallet collection.
 *
 *  2. Transaction records now use `transactionType` (the canonical field) instead
 *     of `type` (the deprecated alias), and include the required `userId` field.
 *
 *  3. Removed all Wallet.insertMany / Wallet.deleteMany / Wallet.create calls
 *     since no Wallet collection exists. User balances are seeded directly on the
 *     User documents via availableBalance / heldBalance fields.
 *
 *  4. Replaced `require('../sockets/message.model')` with the canonical
 *     `require('../modules/messages/message.model')` — sockets/message.model.js
 *     now re-exports these models anyway, but being explicit is cleaner.
 *
 * Run: npm run seed  (or: node src/utils/seed.js)
 */
require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const { MONGO_URI } = require('../config/env');

const User           = require('../modules/users/user.model');
const Product        = require('../modules/products/product.model');
const Order          = require('../modules/orders/order.model');
const Shipment       = require('../modules/shipments/shipment.model');
// wallet.model.js IS the Transaction model — no Wallet collection exists.
// Balances live on User documents (availableBalance / heldBalance).
const Transaction    = require('../modules/payments/wallet.model');
const ExportDocument = require('../modules/documents/document.model');
const Verification   = require('../modules/verifications/verification.model');
const Notification   = require('../modules/notifications/notification.model');
const QuoteRequest   = require('../modules/orders/quoteRequest.model');
// Use the canonical message models from their authoritative source.
const { Conversation, Message } = require('../modules/messages/message.model');

const log = (msg) => console.log(`  ✓  ${msg}`);

// ─── Seed ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  console.log('\n🌱  IEG Platform — Database Seeder\n');
  await mongoose.connect(MONGO_URI);
  log('Connected to MongoDB');

  // Wipe all collections — no Wallet collection to clear
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
    Shipment.deleteMany({}),
    Transaction.deleteMany({}),   // clears the "transactions" collection
    ExportDocument.deleteMany({}),
    Verification.deleteMany({}),
    Notification.deleteMany({}),
    QuoteRequest.deleteMany({}),
    Message.deleteMany({}),
    Conversation.deleteMany({}),
  ]);
  log('All collections cleared');

  // ── USERS (with inline balances — no separate Wallet collection) ──────────
  console.log('\n👤  Seeding users...');
  const userDefs = [
    {
      fullName: 'Platform Admin',   email: 'admin@ieg.com',      password: 'Admin@1234',
      role: 'admin',    companyName: 'IEG Operations',          country: 'EG',
      isVerified: true, subscription: 'enterprise',
      availableBalance: 15420.00, heldBalance: 0,
    },
    {
      fullName: 'Ahmed Hassan',     email: 'exporter1@ieg.com',  password: 'Export@1234',
      role: 'exporter', companyName: 'Hassan Textiles Co.',     country: 'EG',
      isVerified: true, subscription: 'business',
      availableBalance: 48320.75, heldBalance: 12000.00,
      bankName: 'CIB Egypt', bankAccount: 'EG38001234567891',
    },
    {
      fullName: 'Layla Mostafa',    email: 'exporter2@ieg.com',  password: 'Export@1234',
      role: 'exporter', companyName: 'Nile Organics Ltd.',      country: 'EG',
      isVerified: true, subscription: 'starter',
      availableBalance: 22100.50, heldBalance: 6800.00,
      bankName: 'NBE Egypt', bankAccount: 'EG38001234567892',
    },
    {
      fullName: 'James Okafor',     email: 'buyer1@ieg.com',     password: 'Buyer@1234',
      role: 'buyer',    companyName: 'Okafor Imports GmbH',     country: 'DE',
      isVerified: true, subscription: 'business',
      availableBalance: 85000.00, heldBalance: 0,
    },
    {
      fullName: 'Sofia Chen',       email: 'buyer2@ieg.com',     password: 'Buyer@1234',
      role: 'buyer',    companyName: 'Pacific Trade Partners',  country: 'SG',
      isVerified: false, subscription: 'free',
      availableBalance: 12000.00, heldBalance: 0,
    },
    {
      fullName: 'Mahmoud Saleh',    email: 'shipper1@ieg.com',   password: 'Ship@1234',
      role: 'shipper',  companyName: 'Mediterranean Logistics', country: 'EG',
      isVerified: true, subscription: 'starter',
      availableBalance: 9800.00, heldBalance: 0,
    },
  ];

  const created = await Promise.all(
    userDefs.map(async ({ password, ...rest }) =>
      User.create({
        ...rest,
        passwordHash: await bcrypt.hash(password, 12),
        walletBalance: rest.availableBalance,  // keep deprecated field in sync
        isActive: true,
      }),
    ),
  );
  const [admin, exp1, exp2, buy1, buy2, ship1] = created;
  log(`Created ${created.length} users (balances stored on User documents)`);

  // ── PRODUCTS ──────────────────────────────────────────────────────────────
  console.log('\n📦  Seeding products...');
  const products = await Product.insertMany([
    {
      exporterId: exp1._id, nameEn: 'Premium Egyptian Cotton Fabric', category: 'Textiles',
      description: '400-thread-count Egyptian cotton. GOTS organic. Grown in the Nile Delta.',
      images: [{ url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800', isPrimary: true }],
      pricing: { pricePerUnit: 8.50, currency: 'USD', unit: 'meter', tieredPricing: [{ minQty: 500, maxQty: 1999, pricePerUnit: 7.80 }, { minQty: 2000, pricePerUnit: 7.20 }] },
      moq: 200, inventory: { quantity: 50000, unit: 'meter' },
      certifications: [{ type: 'Organic', name: 'GOTS Certified' }, { type: 'OEKO-TEX', name: 'OEKO-TEX 100' }],
      specifications: new Map([['Thread Count', '400'], ['Width', '280cm'], ['Composition', '100% Cotton']]),
      status: 'published', isVerifiedExporter: true, rating: 4.8, reviewCount: 34, views: 1240,
      tags: ['cotton', 'textile', 'organic'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp1._id, nameEn: 'Egyptian Linen Table Runners', category: 'Textiles',
      description: 'Handwoven 100% Egyptian linen. Natural, ivory, and sand colors.',
      pricing: { pricePerUnit: 12.00, currency: 'USD', unit: 'piece', tieredPricing: [{ minQty: 100, maxQty: 499, pricePerUnit: 10.50 }, { minQty: 500, pricePerUnit: 9.00 }] },
      moq: 50, inventory: { quantity: 8000, unit: 'piece' },
      certifications: [{ type: 'Organic', name: 'Organic Linen' }],
      status: 'published', isVerifiedExporter: true, rating: 4.6, reviewCount: 18, views: 560,
      tags: ['linen', 'table', 'hospitality'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp1._id, nameEn: 'Hotel Terry Cotton Towels — Bulk', category: 'Textiles',
      description: 'Hotel-grade terry towels. Custom colors. OEM/ODM welcome.',
      pricing: { pricePerUnit: 4.20, currency: 'USD', unit: 'piece', tieredPricing: [{ minQty: 1000, maxQty: 4999, pricePerUnit: 3.80 }, { minQty: 5000, pricePerUnit: 3.20 }] },
      moq: 500, inventory: { quantity: 100000, unit: 'piece' },
      certifications: [{ type: 'ISO', name: 'ISO 9001:2015' }],
      status: 'published', isVerifiedExporter: true, rating: 4.5, reviewCount: 52, views: 2300,
      tags: ['towel', 'hotel', 'terry', 'bulk'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp2._id, nameEn: 'Cold-Pressed Extra Virgin Olive Oil', category: 'Food & Beverage',
      description: 'Single-origin Sinai Peninsula EVOO. Acidity < 0.3%. Certified organic.',
      images: [{ url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800', isPrimary: true }],
      pricing: { pricePerUnit: 6.80, currency: 'USD', unit: 'liter', tieredPricing: [{ minQty: 500, maxQty: 1999, pricePerUnit: 6.20 }, { minQty: 2000, pricePerUnit: 5.60 }] },
      moq: 200, inventory: { quantity: 30000, unit: 'liter' },
      certifications: [{ type: 'Organic', name: 'EU Organic' }, { type: 'Halal', name: 'ESMA Halal' }],
      specifications: new Map([['Acidity', '< 0.3%'], ['Extraction', 'Cold Press'], ['Shelf Life', '24 months']]),
      status: 'published', isVerifiedExporter: true, rating: 4.9, reviewCount: 41, views: 3100,
      tags: ['olive oil', 'organic', 'halal'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp2._id, nameEn: 'Organic Dried Herbs Mix — Export Grade', category: 'Food & Beverage',
      description: 'Chamomile, peppermint, hibiscus, anise. EU/US import-ready.',
      images: [{ url: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=800', isPrimary: true }],
      pricing: { pricePerUnit: 14.50, currency: 'USD', unit: 'kg', tieredPricing: [{ minQty: 100, maxQty: 499, pricePerUnit: 12.80 }, { minQty: 500, pricePerUnit: 11.00 }] },
      moq: 50, inventory: { quantity: 15000, unit: 'kg' },
      certifications: [{ type: 'Organic', name: 'USDA Organic' }, { type: 'ISO', name: 'ISO 22000' }],
      status: 'published', isVerifiedExporter: true, rating: 4.7, reviewCount: 29, views: 1890,
      tags: ['herbs', 'organic', 'chamomile', 'hibiscus'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp2._id, nameEn: 'Black Seed Oil (Nigella Sativa)', category: 'Chemicals',
      description: 'Pure cold-pressed Aswan black seed oil. Thymoquinone > 3.2%.',
      pricing: { pricePerUnit: 22.00, currency: 'USD', unit: 'liter', tieredPricing: [{ minQty: 100, pricePerUnit: 19.50 }, { minQty: 500, pricePerUnit: 17.00 }] },
      moq: 50, inventory: { quantity: 8000, unit: 'liter' },
      certifications: [{ type: 'Halal', name: 'ESMA Halal' }, { type: 'Organic', name: 'EU Organic' }],
      status: 'published', isVerifiedExporter: true, rating: 4.8, reviewCount: 23, views: 2100,
      tags: ['black seed', 'nigella', 'oil', 'organic'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp2._id, nameEn: 'Medjool Dates — Premium Export', category: 'Agriculture',
      description: 'Grade A Medjool dates from El-Beheira. 5kg/10kg gift boxes or bulk.',
      pricing: { pricePerUnit: 9.50, currency: 'USD', unit: 'kg' },
      moq: 100, inventory: { quantity: 50000, unit: 'kg' },
      certifications: [{ type: 'Halal', name: 'ESMA Halal' }, { type: 'ISO', name: 'ISO 22000' }],
      status: 'published', isVerifiedExporter: true, rating: 4.9, reviewCount: 67, views: 4200,
      tags: ['dates', 'medjool', 'halal', 'premium'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp1._id, nameEn: 'Handmade Ceramic Tableware Set', category: 'Handicrafts',
      description: 'Artisan Egyptian ceramic tableware. 6 plates, 6 bowls, serving dish.',
      pricing: { pricePerUnit: 85.00, currency: 'USD', unit: 'set' },
      moq: 20, inventory: { quantity: 500, unit: 'set' },
      certifications: [{ type: 'Custom', name: 'EU Food Contact Safe' }],
      status: 'published', rating: 4.7, reviewCount: 11, views: 340,
      tags: ['ceramic', 'tableware', 'handmade'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp2._id, nameEn: 'Camel Milk Powder — Export Grade', category: 'Food & Beverage',
      description: 'Spray-dried camel milk from Sinai. No preservatives. 24-month shelf life.',
      pricing: { pricePerUnit: 65.00, currency: 'USD', unit: 'kg' },
      moq: 25, inventory: { quantity: 3000, unit: 'kg' },
      certifications: [{ type: 'Halal', name: 'ESMA Halal' }, { type: 'ISO', name: 'ISO 22000' }],
      status: 'published', rating: 4.5, reviewCount: 8, views: 620,
      tags: ['camel milk', 'dairy', 'powder', 'halal'], countryOfOrigin: 'EG',
    },
    {
      exporterId: exp1._id, nameEn: 'Cotton Yarn — Combed Ring Spun', category: 'Textiles',
      description: 'High-tenacity combed ring spun yarn. Ne 20/1 to Ne 80/2 counts.',
      pricing: { pricePerUnit: 3.10, currency: 'USD', unit: 'kg' },
      moq: 1000, inventory: { quantity: 200000, unit: 'kg' },
      status: 'draft', tags: ['yarn', 'cotton'], countryOfOrigin: 'EG',
    },
  ]);

  const [cotton, linen, towels, oliveOil, herbs, blackSeed, dates] = products;
  log(`Created ${products.length} products`);

  // ── ORDERS ────────────────────────────────────────────────────────────────
  console.log('\n🛒  Seeding orders...');

  const mkTimeline = (entries) =>
    entries.map(([status, ts, note]) => ({
      status,
      changedAt: new Date(ts),
      timestamp: new Date(ts),  // alias field now declared in schema
      note,
    }));

  const o1 = await Order.create({
    exporterId: exp1._id, buyerId: buy1._id, shipperId: ship1._id,
    productId: cotton._id, productName: cotton.nameEn,
    quantity: 2000, unit: 'meter', totalValueUsd: 14400.00,
    status: 'delivered', paymentStatus: 'released',
    deliveryMethod: 'Sea', shipmentMode: 'FCL', insurance: true,
    eta: new Date('2026-03-15'), deliveredAt: new Date('2026-03-12'),
    timeline: mkTimeline([
      ['pending',    '2026-01-10', 'Order created'],
      ['processing', '2026-01-11', 'Payment secured by buyer'],
      ['shipped',    '2026-01-20', 'Shipment CON-2026-000001 created'],
      ['in_transit', '2026-01-25', 'Vessel departed Port Said'],
      ['delivered',  '2026-03-12', 'Delivery confirmed by shipper'],
    ]),
  });

  const o2 = await Order.create({
    exporterId: exp2._id, buyerId: buy1._id, shipperId: ship1._id,
    productId: oliveOil._id, productName: oliveOil.nameEn,
    quantity: 1000, unit: 'liter', totalValueUsd: 5600.00,
    status: 'in_transit', paymentStatus: 'held',
    deliveryMethod: 'Sea', shipmentMode: 'FCL', insurance: true,
    eta: new Date('2026-06-01'),
    timeline: mkTimeline([
      ['pending',    '2026-04-01', 'Order created'],
      ['processing', '2026-04-02', 'Payment held in escrow'],
      ['shipped',    '2026-04-10', 'Shipment dispatched'],
      ['in_transit', '2026-04-14', 'Customs cleared'],
    ]),
  });

  const o3 = await Order.create({
    exporterId: exp1._id, buyerId: buy2._id,
    productId: towels._id, productName: towels.nameEn,
    quantity: 3000, unit: 'piece', totalValueUsd: 9600.00,
    status: 'processing', paymentStatus: 'held',
    deliveryMethod: 'Air', shipmentMode: 'Standard',
    eta: new Date('2026-06-10'),
    timeline: mkTimeline([
      ['pending',    '2026-04-20', 'Order created'],
      ['processing', '2026-04-21', 'Payment secured'],
    ]),
  });

  const o4 = await Order.create({
    exporterId: exp2._id, buyerId: buy1._id,
    productId: dates._id, productName: dates.nameEn,
    quantity: 500, unit: 'kg', totalValueUsd: 4750.00,
    status: 'pending', paymentStatus: 'unpaid',
    timeline: mkTimeline([['pending', '2026-05-05', 'Order created']]),
  });

  const o5 = await Order.create({
    exporterId: exp2._id, buyerId: buy1._id, shipperId: ship1._id,
    productId: herbs._id, productName: herbs.nameEn,
    quantity: 200, unit: 'kg', totalValueUsd: 2200.00,
    status: 'shipped', paymentStatus: 'held',
    deliveryMethod: 'Sea', shipmentMode: 'LCL',
    eta: new Date('2026-07-01'),
    timeline: mkTimeline([
      ['pending',    '2026-04-15', 'Order created'],
      ['processing', '2026-04-16', 'Payment secured'],
      ['shipped',    '2026-04-25', 'Shipment dispatched'],
    ]),
  });

  const o6 = await Order.create({
    exporterId: exp1._id, buyerId: buy2._id,
    productId: linen._id, productName: linen.nameEn,
    quantity: 200, unit: 'piece', totalValueUsd: 1800.00,
    status: 'cancelled', paymentStatus: 'refunded',
    // cancelledAt and cancelReason now have declared schema fields
    cancelledAt: new Date('2026-03-03'),
    cancelReason: 'Buyer changed specification requirements',
    cancelledBy: buy2._id,
    timeline: mkTimeline([
      ['pending',   '2026-03-01', 'Order created'],
      ['cancelled', '2026-03-03', 'Cancelled — changed spec requirements'],
    ]),
  });

  log('Created 6 orders (delivered, in_transit, processing, pending, shipped, cancelled)');

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────
  // Stored in the "transactions" collection (Mongoose model name: "Transaction").
  // Fields use `transactionType` (canonical) and include required `userId`.
  // The pre-validate hook syncs `type` from `transactionType` automatically.
  console.log('\n💳  Seeding transactions...');

  await Transaction.insertMany([
    {
      userId: buy1._id,    orderId: o1._id,
      transactionType: 'payment',
      amountUsd: -14400,
      description: 'Payment for order OR-2026-000001',
      status: 'completed',
      reference: 'TXN-20260111-001',
      availableBalanceAfter: 70600,
    },
    {
      userId: exp1._id,    orderId: o1._id,
      transactionType: 'escrow_release',
      amountUsd: 13968,
      description: 'Payment released for order OR-2026-000001 (3% platform fee deducted)',
      status: 'completed',
      reference: 'TXN-20260312-001',
      availableBalanceAfter: 48320.75,
    },
    {
      userId: exp1._id,
      transactionType: 'withdrawal',
      amountUsd: -10000,
      description: 'Bank withdrawal to CIB Egypt',
      status: 'completed',
      reference: 'WDR-20260320-001',
      availableBalanceAfter: 38320.75,
    },
    {
      userId: buy1._id,    orderId: o2._id,
      transactionType: 'payment',
      amountUsd: -5600,
      description: 'Payment held in escrow for order OR-2026-000002',
      status: 'completed',
      reference: 'TXN-20260402-001',
      availableBalanceAfter: 79400,
    },
  ]);
  log('Created 4 transactions (using canonical transactionType field + required userId)');

  // ── SHIPMENTS ─────────────────────────────────────────────────────────────
  console.log('\n🚢  Seeding shipments...');

  await Shipment.create({
    orderId: o1._id, shipperId: ship1._id,
    exporterId: exp1._id, buyerId: buy1._id,
    originPort: 'Port Said, Egypt', destinationPort: 'Hamburg, Germany',
    carrier: 'MSC Mediterranean', departureDate: new Date('2026-01-20'),
    eta: new Date('2026-03-15'), status: 'delivered',
    currentLat: 53.5500, currentLng: 9.9937,
    stages: [
      { stage: 'pickup',          location: 'Port Said, Egypt',  note: 'Container loaded',              recordedAt: new Date('2026-01-18'), lat: 31.2589, lng: 32.5540 },
      { stage: 'customs_cleared', location: 'Port Said, Egypt',  note: 'Export customs approved',       recordedAt: new Date('2026-01-20'), lat: 31.2589, lng: 32.5540 },
      { stage: 'in_transit',      location: 'Mediterranean Sea', note: 'Vessel MSC ANNA departed',      recordedAt: new Date('2026-01-25'), lat: 36.0,    lng: 18.0    },
      { stage: 'arrived',         location: 'Hamburg, Germany',  note: 'Arrived Hamburg port',          recordedAt: new Date('2026-03-10'), lat: 53.5500, lng: 9.9937  },
      { stage: 'delivered',       location: 'Hamburg Warehouse', note: 'Delivered to buyer warehouse',  recordedAt: new Date('2026-03-12'), lat: 53.5500, lng: 9.9937  },
    ],
  });

  await Shipment.create({
    orderId: o2._id, shipperId: ship1._id,
    exporterId: exp2._id, buyerId: buy1._id,
    originPort: 'Alexandria, Egypt', destinationPort: 'Rotterdam, Netherlands',
    carrier: 'CMA CGM', departureDate: new Date('2026-04-10'),
    eta: new Date('2026-06-01'), status: 'in_transit',
    currentLat: 35.8900, currentLng: 14.5146,
    stages: [
      { stage: 'pickup',          location: 'Alexandria, Egypt', note: 'Container picked up',      recordedAt: new Date('2026-04-08'), lat: 31.1975, lng: 29.8925 },
      { stage: 'customs_cleared', location: 'Alexandria, Egypt', note: 'Customs clearance done',   recordedAt: new Date('2026-04-10'), lat: 31.1975, lng: 29.8925 },
      { stage: 'in_transit',      location: 'Malta Strait',      note: 'Passing Malta strait',      recordedAt: new Date('2026-04-14'), lat: 35.89,  lng: 14.51  },
    ],
  });

  await Shipment.create({
    orderId: o5._id, shipperId: ship1._id,
    exporterId: exp2._id, buyerId: buy1._id,
    originPort: 'Port Said, Egypt', destinationPort: 'Singapore Port',
    carrier: 'Evergreen Line', departureDate: new Date('2026-04-25'),
    eta: new Date('2026-07-01'), status: 'pickup',
    currentLat: 31.2589, currentLng: 32.5540,
    stages: [
      { stage: 'pickup', location: 'Port Said, Egypt', note: 'Container loaded, awaiting departure', recordedAt: new Date('2026-04-25'), lat: 31.2589, lng: 32.5540 },
    ],
  });

  log('Created 3 shipments (delivered, in_transit, pickup)');

  // ── DOCUMENTS ─────────────────────────────────────────────────────────────
  console.log('\n📄  Seeding documents...');
  await ExportDocument.insertMany([
    { userId: exp1._id, orderId: o1._id, type: 'certificate_of_origin',     fileName: 'cert_origin_001.pdf',   fileUrl: 'https://storage.ieg.com/docs/cert_001.pdf',  fileSize: 245000, mimeType: 'application/pdf', status: 'approved',  reviewedBy: admin._id, reviewNotes: 'Verified — all fields correct.', reviewedAt: new Date('2026-01-15') },
    { userId: exp1._id, orderId: o1._id, type: 'commercial_invoice',         fileName: 'invoice_001.pdf',        fileUrl: 'https://storage.ieg.com/docs/inv_001.pdf',   fileSize: 189000, mimeType: 'application/pdf', status: 'approved',  reviewedBy: admin._id, reviewedAt: new Date('2026-01-15') },
    { userId: exp1._id, orderId: o1._id, type: 'packing_list',               fileName: 'packing_001.pdf',        fileUrl: 'https://storage.ieg.com/docs/pack_001.pdf',  fileSize: 120000, mimeType: 'application/pdf', status: 'approved',  reviewedBy: admin._id, reviewedAt: new Date('2026-01-15') },
    { userId: exp2._id, orderId: o2._id, type: 'certificate_of_origin',     fileName: 'cert_olive_002.pdf',    fileUrl: 'https://storage.ieg.com/docs/cert_002.pdf',  fileSize: 198000, mimeType: 'application/pdf', status: 'approved',  reviewedBy: admin._id, reviewedAt: new Date('2026-04-05') },
    { userId: exp2._id, orderId: o2._id, type: 'phytosanitary_certificate', fileName: 'phyto_002.pdf',          fileUrl: 'https://storage.ieg.com/docs/phyto_002.pdf', fileSize: 310000, mimeType: 'application/pdf', status: 'pending_review' },
    { userId: exp1._id, orderId: o3._id, type: 'commercial_invoice',         fileName: 'invoice_003.pdf',        fileUrl: 'https://storage.ieg.com/docs/inv_003.pdf',   fileSize: 160000, mimeType: 'application/pdf', status: 'pending_review' },
    { userId: exp2._id,                   type: 'trade_license',              fileName: 'nile_organics_license.pdf', fileUrl: 'https://storage.ieg.com/kyb/trade_lic_002.pdf', fileSize: 450000, mimeType: 'application/pdf', status: 'approved',  reviewedBy: admin._id, reviewedAt: new Date('2026-01-05') },
    { userId: exp1._id,                   type: 'trade_license',              fileName: 'hassan_reg.pdf',         fileUrl: 'https://storage.ieg.com/kyb/biz_reg_001.pdf', fileSize: 390000, mimeType: 'application/pdf', status: 'rejected',  reviewedBy: admin._id, reviewNotes: 'Document appears expired. Resubmit with valid certificate.', reviewedAt: new Date('2026-01-03') },
  ]);
  log('Created 8 documents');

  // ── VERIFICATIONS ─────────────────────────────────────────────────────────
  console.log('\n✅  Seeding verifications...');
  await Verification.insertMany([
    { userId: exp1._id, taxId: 'EG-123456789', tradeLicenseUrl: 'https://storage.ieg.com/kyb/hassan_lic.pdf', businessRegUrl: 'https://storage.ieg.com/kyb/hassan_reg.pdf', status: 'approved', reviewerId: admin._id, reviewerNotes: 'All documents verified.', submittedAt: new Date('2026-01-02'), reviewedAt: new Date('2026-01-04') },
    { userId: exp2._id, taxId: 'EG-987654321', tradeLicenseUrl: 'https://storage.ieg.com/kyb/nile_lic.pdf',   businessRegUrl: 'https://storage.ieg.com/kyb/nile_reg.pdf',   status: 'approved', reviewerId: admin._id, reviewerNotes: 'Verified. Organic certs on file.', submittedAt: new Date('2026-01-03'), reviewedAt: new Date('2026-01-05') },
    { userId: buy2._id, taxId: 'SG-202312345C', tradeLicenseUrl: 'https://storage.ieg.com/kyb/pacific_lic.pdf', status: 'pending', submittedAt: new Date('2026-05-01') },
  ]);
  log('Created 3 verifications');

  // ── QUOTE REQUESTS ────────────────────────────────────────────────────────
  console.log('\n📋  Seeding quote requests...');
  await QuoteRequest.insertMany([
    { buyerId: buy1._id, exporterId: exp1._id, productId: cotton._id,   productType: 'Egyptian Cotton Fabric', quantity: 5000, budgetMin: 30000, budgetMax: 40000, deliveryTimeline: '30-45 days', specialRequirements: 'Custom width 300cm.',  status: 'accepted',    responderNote: 'Can fulfill. Custom width for orders >3000m.' },
    { buyerId: buy1._id, exporterId: exp2._id, productId: blackSeed._id, productType: 'Black Seed Oil',          quantity: 300,  budgetMin: 5000,  budgetMax: 7000,  deliveryTimeline: '21 days',    specialRequirements: 'Private label packaging.', status: 'negotiating', responderNote: 'Private label min 200L.' },
    { buyerId: buy2._id, exporterId: exp2._id, productId: dates._id,     productType: 'Medjool Dates',            quantity: 200,  budgetMin: 1600,  budgetMax: 2200,  deliveryTimeline: '14 days',    status: 'new' },
  ]);
  log('Created 3 quote requests');

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────
  console.log('\n🔔  Seeding notifications...');
  await Notification.insertMany([
    { userId: exp1._id,   type: 'order',        title: 'New Order Received',      body: 'James Okafor placed an order for Premium Egyptian Cotton Fabric — 2,000m', link: '/exporter/orders',    isRead: true  },
    { userId: buy1._id,   type: 'order',        title: 'Order Delivered ✅',       body: 'Your order has been delivered to Hamburg warehouse.',                        link: '/buyer/orders',       isRead: true  },
    { userId: exp2._id,   type: 'shipment',     title: 'Shipment In Transit',      body: 'Your olive oil shipment is passing Malta Strait.',                           link: '/exporter/shipments', isRead: false },
    { userId: buy1._id,   type: 'shipment',     title: 'Shipment Update',          body: 'Your olive oil order is in transit through the Mediterranean.',              link: '/buyer/orders',       isRead: false },
    { userId: exp1._id,   type: 'verification', title: 'Account Verified ✅',      body: 'Your KYB verification has been approved. You can now list products.',         link: '/exporter/dashboard', isRead: true  },
    { userId: exp2._id,   type: 'payment',      title: 'Payment Secured',          body: 'Buyer paid $5,600 for your order. Funds held in escrow.',                    link: '/exporter/wallet',    isRead: false },
    { userId: buy1._id,   type: 'message',      title: 'New Message from Layla',   body: 'Your black seed oil quote — we can do private label for 200L minimum.',     link: '/buyer/messages',     isRead: false },
    { userId: admin._id,  type: 'verification', title: 'New Verification Request', body: 'Pacific Trade Partners submitted KYB documents for review.',                  link: '/admin/verifications',isRead: false },
    { userId: admin._id,  type: 'system',       title: 'Monthly Report Ready',     body: 'Revenue report is ready.',                                                   link: '/admin/reports',      isRead: false },
    { userId: exp1._id,   type: 'order',        title: 'Quote Request Accepted',   body: 'James Okafor accepted your quote for 5,000m of cotton fabric.',             link: '/exporter/orders',    isRead: false },
  ]);
  log('Created 10 notifications');

  // ── MESSAGES ──────────────────────────────────────────────────────────────
  console.log('\n💬  Seeding messages...');

  const conv1 = await Conversation.create({
    participants: [buy1._id, exp2._id],
    lastMessage: 'We can accommodate private label for orders above 200L.',
    lastMessageAt: new Date('2026-05-08'),
  });
  const conv2 = await Conversation.create({
    participants: [buy1._id, exp1._id],
    lastMessage: 'Certificate valid until December 2027.',
    lastMessageAt: new Date('2026-05-09'),
  });

  await Message.insertMany([
    { conversationId: conv1._id, senderId: buy1._id, receiverId: exp2._id, content: 'Hello Layla, we are interested in your black seed oil for private label.', isRead: true,  readAt: new Date('2026-05-07T10:05:00'), createdAt: new Date('2026-05-07T10:00:00') },
    { conversationId: conv1._id, senderId: exp2._id, receiverId: buy1._id, content: 'Hello James! Minimum order for custom packaging is 200 liters.', isRead: true,  readAt: new Date('2026-05-07T14:10:00'), createdAt: new Date('2026-05-07T14:00:00') },
    { conversationId: conv1._id, senderId: buy1._id, receiverId: exp2._id, content: 'That works. We need 300 liters. Can you send a quote with private label costs?', isRead: true,  readAt: new Date('2026-05-08T09:05:00'), createdAt: new Date('2026-05-08T09:00:00') },
    { conversationId: conv1._id, senderId: exp2._id, receiverId: buy1._id, content: 'We can accommodate private label for orders above 200L.', isRead: false, createdAt: new Date('2026-05-08T11:30:00') },
    { conversationId: conv2._id, senderId: buy1._id, receiverId: exp1._id, content: 'Ahmed, can you confirm the OEKO-TEX certificate is still valid?', isRead: true,  createdAt: new Date('2026-05-09T08:00:00') },
    { conversationId: conv2._id, senderId: exp1._id, receiverId: buy1._id, content: 'Certificate valid until December 2027.', isRead: false, createdAt: new Date('2026-05-09T09:30:00') },
  ]);
  log('Created 2 conversations with 6 messages');

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════╗
║        🌍  IEG Seed Complete! (utils/seed.js)        ║
╠══════════════════════════════════════════════════════╣
║  Users         : 6  (admin/2 exporters/2 buyers/     ║
║                      1 shipper)                      ║
║  Products      : 10 across 5 categories              ║
║  Orders        : 6  (all lifecycle stages)           ║
║  Shipments     : 3  (delivered/in_transit/pickup)    ║
║  Documents     : 8  (approved/pending/rejected)      ║
║  Verifications : 3  (2 approved / 1 pending)         ║
║  Transactions  : 4  (transactionType field)          ║
║  Notifications : 10                                  ║
║  Messages      : 6  across 2 conversations           ║
╠══════════════════════════════════════════════════════╣
║  Architecture:                                       ║
║  ✓ No Wallet collection — balances on User           ║
║  ✓ Transaction model from wallet.model.js            ║
║  ✓ Message models from messages/message.model.js     ║
╠══════════════════════════════════════════════════════╣
║  Credentials:                                        ║
║  admin    → admin@ieg.com     / Admin@1234           ║
║  exporter → exporter1@ieg.com / Export@1234          ║
║  exporter → exporter2@ieg.com / Export@1234          ║
║  buyer    → buyer1@ieg.com    / Buyer@1234           ║
║  buyer    → buyer2@ieg.com    / Buyer@1234           ║
║  shipper  → shipper1@ieg.com  / Ship@1234            ║
╚══════════════════════════════════════════════════════╝`);

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('💥  Seed failed:', err);
  mongoose.connection.close().finally(() => process.exit(1));
});
