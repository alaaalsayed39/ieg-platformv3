/**
 * IEG — Seed Data
 * ─────────────────────────────────────────────────────────────────────────────
 * Creates a complete demo dataset:
 *   • 1 Admin, 3 Exporters, 4 Buyers, 2 Shippers
 *   • 12 Products (various categories, real Egyptian exports)
 *   • 8 Orders (spanning full lifecycle)
 *   • 3 Shipments
 *   • Documents, Verifications, Transactions, Notifications
 *
 * Run:  node src/seed/index.js
 * Clear: node src/seed/index.js --clear
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const User         = require('../modules/users/user.model');
const Product      = require('../modules/products/product.model');
const Order        = require('../modules/orders/order.model');
const QuoteRequest = require('../modules/orders/quoteRequest.model');
const Shipment     = require('../modules/shipments/shipment.model');
const Transaction  = require('../modules/payments/wallet.model');
const Document     = require('../modules/documents/document.model');
const Verification = require('../modules/verifications/verification.model');
const Notification = require('../modules/notifications/notification.model');
const { Conversation, Message } = require('../modules/messages/message.model');

const logger = require('../utils/logger');

// ─── Helper ──────────────────────────────────────────────────────────────────
const hash = (pw) => bcrypt.hash(pw, 12);
const daysAgo = (n) => new Date(Date.now() - n * 86400000);
const daysFromNow = (n) => new Date(Date.now() + n * 86400000);

// ─── Clear All Collections ────────────────────────────────────────────────────
const clearAll = async () => {
  logger.info('Clearing all collections...');
  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}), QuoteRequest.deleteMany({}),
    Shipment.deleteMany({}), Transaction.deleteMany({}), Document.deleteMany({}),
    Verification.deleteMany({}), Notification.deleteMany({}),
    Conversation.deleteMany({}), Message.deleteMany({}),
  ]);
  logger.info('All collections cleared.');
};

// ─── Seed Users ───────────────────────────────────────────────────────────────
const seedUsers = async () => {
  logger.info('Seeding users...');

  const usersData = [
    // Admin
    {
      fullName: 'Ahmed Hassan', email: 'admin@ieg.com',
      passwordHash: await hash('Admin@1234'), role: 'admin',
      country: 'EG', companyName: 'IEG Platform',
      isVerified: true, isActive: true, walletBalance: 125000,
    },
    // Exporters
    {
      fullName: 'Mohamed Kamal', email: 'exporter1@ieg.com',
      passwordHash: await hash('Export@1234'), role: 'exporter',
      country: 'EG', companyName: 'EgyTex Industries',
      phone: '+201012345678', isVerified: true, isActive: true,
      walletBalance: 48250, subscription: 'business',
    },
    {
      fullName: 'Fatima Al-Rashid', email: 'exporter2@ieg.com',
      passwordHash: await hash('Export@1234'), role: 'exporter',
      country: 'EG', companyName: 'Nile Agro Exports',
      phone: '+201098765432', isVerified: true, isActive: true,
      walletBalance: 22100, subscription: 'starter',
    },
    {
      fullName: 'Khaled Mansour', email: 'exporter3@ieg.com',
      passwordHash: await hash('Export@1234'), role: 'exporter',
      country: 'EG', companyName: 'Cairo Marble Co.',
      phone: '+201123456789', isVerified: false, isActive: true,
      walletBalance: 5000, subscription: 'free',
    },
    // Buyers
    {
      fullName: 'James Wilson', email: 'buyer1@ieg.com',
      passwordHash: await hash('Buyer@1234'), role: 'buyer',
      country: 'US', companyName: 'Global Grocers Inc.',
      phone: '+12125551234', isVerified: true, isActive: true,
      walletBalance: 156000, subscription: 'business',
    },
    {
      fullName: 'Lara Petrova', email: 'buyer2@ieg.com',
      passwordHash: await hash('Buyer@1234'), role: 'buyer',
      country: 'GB', companyName: 'Elite Snacks Ltd.',
      phone: '+447911123456', isVerified: true, isActive: true,
      walletBalance: 89000, subscription: 'starter',
    },
    {
      fullName: 'Carlos Rodriguez', email: 'buyer3@ieg.com',
      passwordHash: await hash('Buyer@1234'), role: 'buyer',
      country: 'ES', companyName: 'Iberian Trade Hub',
      phone: '+34612345678', isVerified: true, isActive: true,
      walletBalance: 43500, subscription: 'starter',
    },
    {
      fullName: 'Yuki Tanaka', email: 'buyer4@ieg.com',
      passwordHash: await hash('Buyer@1234'), role: 'buyer',
      country: 'JP', companyName: 'Tokyo Imports Co.',
      phone: '+81312345678', isVerified: false, isActive: true,
      walletBalance: 12000, subscription: 'free',
    },
    // Shippers
    {
      fullName: 'Skyline International Logistics', email: 'shipper1@ieg.com',
      passwordHash: await hash('Ship@1234'), role: 'shipper',
      country: 'EG', companyName: 'Skyline Logistics',
      phone: '+20223456789', isVerified: true, isActive: true,
      walletBalance: 0, subscription: 'business',
    },
    {
      fullName: 'OceanLink Shipping', email: 'shipper2@ieg.com',
      passwordHash: await hash('Ship@1234'), role: 'shipper',
      country: 'AE', companyName: 'OceanLink Shipping',
      phone: '+97144567890', isVerified: true, isActive: true,
      walletBalance: 0, subscription: 'starter',
    },
  ];

  const users = await User.insertMany(usersData, { lean: true });
  logger.info(`Seeded ${users.length} users`);
  return users;
};

// ─── Seed Products ────────────────────────────────────────────────────────────
const seedProducts = async (exporters) => {
  logger.info('Seeding products...');

  const productsData = [
    {
      exporterId: exporters[0]._id,
      nameEn: 'Egyptian Long-Staple Cotton Grade A',
      nameAr: 'قطن مصري طويل التيلة درجة أ',
      category: 'Textiles',
      description: 'Premium Egyptian long-staple cotton, known worldwide for its exceptional softness and durability. Fiber length 65mm, Grade AA+, White color.',
      images: [{ url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 1500, currency: 'USD', unit: 'ton', tieredPricing: [{ minQty: 5, maxQty: 10, pricePerUnit: 1400 }, { minQty: 11, pricePerUnit: 1300 }] },
      moq: 5, inventory: { quantity: 500, unit: 'ton' },
      certifications: [{ type: 'ISO', name: 'ISO 9001:2015' }, { type: 'Organic', name: 'USDA Organic' }, { type: 'OEKO-TEX', name: 'OEKO-TEX Standard 100' }],
      specifications: new Map([['fiberLength', '65mm'], ['grade', 'AA+'], ['color', 'White'], ['moisture', '8.5%']]),
      tags: ['cotton', 'textile', 'organic', 'egypt'], status: 'published',
      isVerifiedExporter: true, rating: 4.8, reviewCount: 178, views: 3420,
    },
    {
      exporterId: exporters[0]._id,
      nameEn: 'Egyptian Cotton Towels - Hotel Grade',
      category: 'Textiles',
      description: 'Luxury hotel-grade cotton towels made from 100% Egyptian cotton. Ultra-absorbent, 650 GSM.',
      images: [{ url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 12, currency: 'USD', unit: 'piece', tieredPricing: [{ minQty: 500, maxQty: 1000, pricePerUnit: 10 }, { minQty: 1001, pricePerUnit: 8.5 }] },
      moq: 200, inventory: { quantity: 50000, unit: 'piece' },
      certifications: [{ type: 'Organic', name: 'GOTS Certified' }, { type: 'OEKO-TEX', name: 'OEKO-TEX Standard 100' }],
      tags: ['towels', 'cotton', 'hotel', 'luxury'], status: 'published',
      isVerifiedExporter: true, rating: 4.6, reviewCount: 92, views: 1850,
    },
    {
      exporterId: exporters[1]._id,
      nameEn: 'Premium Medjool Dates',
      nameAr: 'تمر مجهول فاخر',
      category: 'Agriculture',
      description: 'Sun-dried Medjool dates from Egypt\'s Siwa Oasis. Extra-large size, rich caramel flavor. Perfect for export.',
      images: [{ url: 'https://images.unsplash.com/photo-1558642891-54be180ea339?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 8, currency: 'USD', unit: 'kg', tieredPricing: [{ minQty: 100, maxQty: 500, pricePerUnit: 7 }, { minQty: 501, pricePerUnit: 6 }] },
      moq: 50, inventory: { quantity: 20000, unit: 'kg' },
      certifications: [{ type: 'Halal', name: 'Halal Certified' }, { type: 'Organic', name: 'EU Organic' }],
      specifications: new Map([['variety', 'Medjool'], ['size', 'Extra Large'], ['moisture', '18-22%'], ['origin', 'Siwa Oasis']]),
      tags: ['dates', 'agriculture', 'organic', 'halal', 'fruit'], status: 'published',
      isVerifiedExporter: true, rating: 4.9, reviewCount: 241, views: 5120,
    },
    {
      exporterId: exporters[1]._id,
      nameEn: 'Dried Mango Slices - Export Quality',
      category: 'Agriculture',
      description: 'Sun-dried Egyptian mango slices, no preservatives or added sugar. Sukkari variety from Ismailia.',
      images: [{ url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 5.5, currency: 'USD', unit: 'kg' },
      moq: 100, inventory: { quantity: 8000, unit: 'kg' },
      certifications: [{ type: 'Organic', name: 'USDA Organic' }],
      tags: ['mango', 'dried fruit', 'organic', 'snacks'], status: 'published',
      isVerifiedExporter: true, rating: 4.5, reviewCount: 67, views: 2100,
    },
    {
      exporterId: exporters[1]._id,
      nameEn: 'Pomegranate Concentrate - Food Grade',
      category: 'Agriculture',
      description: 'Cold-pressed pomegranate juice concentrate. 65 Brix. Ideal for beverages, food manufacturing and export.',
      images: [{ url: 'https://images.unsplash.com/photo-1571575173927-60d3aec9f11d?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 4.2, currency: 'USD', unit: 'kg' },
      moq: 500, inventory: { quantity: 30000, unit: 'kg' },
      certifications: [{ type: 'Halal', name: 'Halal' }, { type: 'ISO', name: 'ISO 22000' }],
      tags: ['pomegranate', 'concentrate', 'beverage', 'food'], status: 'published',
      isVerifiedExporter: true, rating: 4.7, reviewCount: 53, views: 1780,
    },
    {
      exporterId: exporters[2]._id,
      nameEn: 'Sinai White Marble Tiles - Premium',
      category: 'Marble',
      description: 'High-quality white marble from Sinai Peninsula. Suitable for flooring, wall cladding and decorative use.',
      images: [{ url: 'https://images.unsplash.com/photo-1615971677499-5467cbab01b0?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 85, currency: 'USD', unit: 'm²', tieredPricing: [{ minQty: 100, maxQty: 500, pricePerUnit: 75 }, { minQty: 501, pricePerUnit: 65 }] },
      moq: 50, inventory: { quantity: 5000, unit: 'm²' },
      specifications: new Map([['thickness', '20mm'], ['finish', 'Polished'], ['origin', 'Sinai, Egypt'], ['absorption', '< 0.5%']]),
      tags: ['marble', 'stone', 'tiles', 'construction'], status: 'published',
      isVerifiedExporter: false, rating: 4.3, reviewCount: 28, views: 890,
    },
    {
      exporterId: exporters[0]._id,
      nameEn: 'Handwoven Kilim Rugs - Artisan Made',
      category: 'Handicrafts',
      description: 'Traditional Egyptian Kilim rugs handwoven by artisans in Assiut. Natural dyes, unique geometric patterns.',
      images: [{ url: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 180, currency: 'USD', unit: 'piece' },
      moq: 10, inventory: { quantity: 200, unit: 'piece' },
      certifications: [{ type: 'Custom', name: 'Fair Trade Certified' }],
      tags: ['rugs', 'kilim', 'handmade', 'artisan', 'home decor'], status: 'published',
      isVerifiedExporter: true, rating: 4.9, reviewCount: 45, views: 1200,
    },
    {
      exporterId: exporters[1]._id,
      nameEn: 'Extra Virgin Olive Oil - Cold Pressed',
      category: 'Agriculture',
      description: 'Premium extra virgin olive oil from Egypt\'s North Coast. Cold-pressed, acidity < 0.3%. Excellent for export.',
      images: [{ url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 6.5, currency: 'USD', unit: 'liter', tieredPricing: [{ minQty: 1000, pricePerUnit: 5.8 }] },
      moq: 200, inventory: { quantity: 50000, unit: 'liter' },
      certifications: [{ type: 'Organic', name: 'EU Organic' }, { type: 'Halal', name: 'Halal Certified' }, { type: 'ISO', name: 'ISO 22000' }],
      tags: ['olive oil', 'organic', 'food', 'healthy'], status: 'published',
      isVerifiedExporter: true, rating: 4.8, reviewCount: 134, views: 3890,
    },
    {
      exporterId: exporters[0]._id,
      nameEn: 'Egyptian Cotton Yarn - Ring Spun',
      category: 'Textiles',
      description: 'Ring-spun Egyptian cotton yarn. Ne 30/1 count. For knitting, weaving, and textile manufacturing.',
      images: [{ url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 3.2, currency: 'USD', unit: 'kg' },
      moq: 1000, inventory: { quantity: 100000, unit: 'kg' },
      certifications: [{ type: 'OEKO-TEX', name: 'OEKO-TEX Standard 100' }],
      tags: ['yarn', 'cotton', 'textile', 'spinning'], status: 'draft',
      isVerifiedExporter: true, rating: 0, reviewCount: 0, views: 45,
    },
    {
      exporterId: exporters[2]._id,
      nameEn: 'Basalt Stone - Construction Grade',
      category: 'Marble',
      description: 'High-strength Egyptian basalt for construction and landscaping. Available in various sizes.',
      images: [{ url: 'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 45, currency: 'USD', unit: 'ton' },
      moq: 10, inventory: { quantity: 2000, unit: 'ton' },
      tags: ['basalt', 'stone', 'construction', 'landscaping'], status: 'published',
      isVerifiedExporter: false, rating: 4.1, reviewCount: 15, views: 420,
    },
    {
      exporterId: exporters[1]._id,
      nameEn: 'Hibiscus (Karkade) Dried Flowers',
      category: 'Agriculture',
      description: 'Dried Hibiscus sabdariffa flowers from Upper Egypt. Ideal for herbal tea, food coloring and health products.',
      images: [{ url: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 3.8, currency: 'USD', unit: 'kg' },
      moq: 100, inventory: { quantity: 15000, unit: 'kg' },
      certifications: [{ type: 'Organic', name: 'USDA Organic' }, { type: 'Halal', name: 'Halal Certified' }],
      tags: ['hibiscus', 'karkade', 'herbal', 'organic', 'tea'], status: 'published',
      isVerifiedExporter: true, rating: 4.7, reviewCount: 89, views: 2340,
    },
    {
      exporterId: exporters[0]._id,
      nameEn: 'Papyrus Paper - Handmade Art Sheets',
      category: 'Handicrafts',
      description: 'Authentic handmade papyrus sheets crafted using ancient Egyptian techniques. For art, calligraphy, and souvenirs.',
      images: [{ url: 'https://images.unsplash.com/photo-1506619216599-9d16d0903dfd?w=600', isPrimary: true }],
      pricing: { pricePerUnit: 2.5, currency: 'USD', unit: 'piece' },
      moq: 100, inventory: { quantity: 10000, unit: 'piece' },
      tags: ['papyrus', 'art', 'handicraft', 'egypt', 'souvenir'], status: 'published',
      isVerifiedExporter: true, rating: 4.6, reviewCount: 33, views: 780,
    },
  ];

  const products = await Product.insertMany(productsData, { lean: true });
  logger.info(`Seeded ${products.length} products`);
  return products;
};

// ─── Seed Orders ──────────────────────────────────────────────────────────────
const seedOrders = async (users, products) => {
  logger.info('Seeding orders...');

  const admin    = users.find(u => u.role === 'admin');
  const ex1      = users.find(u => u.email === 'exporter1@ieg.com');
  const ex2      = users.find(u => u.email === 'exporter2@ieg.com');
  const b1       = users.find(u => u.email === 'buyer1@ieg.com');
  const b2       = users.find(u => u.email === 'buyer2@ieg.com');
  const b3       = users.find(u => u.email === 'buyer3@ieg.com');
  const sh1      = users.find(u => u.email === 'shipper1@ieg.com');

  const cotton   = products.find(p => p.nameEn.includes('Long-Staple Cotton'));
  const dates    = products.find(p => p.nameEn.includes('Medjool Dates'));
  const mango    = products.find(p => p.nameEn.includes('Mango'));
  const olive    = products.find(p => p.nameEn.includes('Olive Oil'));
  const hibiscus = products.find(p => p.nameEn.includes('Hibiscus'));
  const towels   = products.find(p => p.nameEn.includes('Towels'));

  const ordersData = [
    // Delivered order - full lifecycle
    {
      orderNumber: 'OR-2025-10001', exporterId: ex1._id, buyerId: b1._id,
      shipperId: sh1._id, productId: cotton._id, productName: cotton.nameEn,
      quantity: 20, unit: 'ton', totalValueUsd: 28000, currency: 'USD',
      status: 'delivered', paymentStatus: 'released',
      deliveryMethod: 'Sea', shipmentMode: 'FCL', insurance: true,
      eta: daysAgo(5), deliveredAt: daysAgo(3),
      timeline: [
        { status: 'pending', note: 'Order placed by buyer', changedAt: daysAgo(45) },
        { status: 'processing', note: 'Exporter confirmed order', changedAt: daysAgo(43) },
        { status: 'shipped', note: 'Shipment CON-10001 created', changedAt: daysAgo(30) },
        { status: 'in_transit', note: 'Customs cleared, vessel at sea', changedAt: daysAgo(20) },
        { status: 'delivered', note: 'Delivered to buyer warehouse', changedAt: daysAgo(3) },
      ],
      createdAt: daysAgo(45),
    },
    // In-transit order
    {
      orderNumber: 'OR-2025-10002', exporterId: ex2._id, buyerId: b1._id,
      shipperId: sh1._id, productId: dates._id, productName: dates.nameEn,
      quantity: 500, unit: 'kg', totalValueUsd: 3500, currency: 'USD',
      status: 'in_transit', paymentStatus: 'held',
      deliveryMethod: 'Air', shipmentMode: 'Express', insurance: true,
      eta: daysFromNow(7),
      timeline: [
        { status: 'pending', note: 'Order placed', changedAt: daysAgo(15) },
        { status: 'processing', note: 'Documents verified', changedAt: daysAgo(13) },
        { status: 'shipped', note: 'Shipment CON-10002 created', changedAt: daysAgo(10) },
        { status: 'in_transit', note: 'Customs cleared at Cairo International', changedAt: daysAgo(3) },
      ],
      createdAt: daysAgo(15),
    },
    // Processing order - awaiting shipment
    {
      orderNumber: 'OR-2025-10003', exporterId: ex2._id, buyerId: b2._id,
      productId: mango._id, productName: mango.nameEn,
      quantity: 1000, unit: 'kg', totalValueUsd: 5500, currency: 'USD',
      status: 'processing', paymentStatus: 'held',
      deliveryMethod: 'Sea', shipmentMode: 'LCL', insurance: false,
      eta: daysFromNow(21),
      timeline: [
        { status: 'pending', note: 'Order placed', changedAt: daysAgo(8) },
        { status: 'processing', note: 'Payment received, preparing shipment', changedAt: daysAgo(6) },
      ],
      createdAt: daysAgo(8),
    },
    // Pending order - just placed
    {
      orderNumber: 'OR-2025-10004', exporterId: ex2._id, buyerId: b2._id,
      productId: olive._id, productName: olive.nameEn,
      quantity: 2000, unit: 'liter', totalValueUsd: 13000, currency: 'USD',
      status: 'pending', paymentStatus: 'unpaid',
      deliveryMethod: 'Sea', shipmentMode: 'FCL', insurance: true,
      eta: daysFromNow(35),
      timeline: [{ status: 'pending', note: 'Order placed by buyer', changedAt: daysAgo(2) }],
      createdAt: daysAgo(2),
    },
    // Cancelled order
    {
      orderNumber: 'OR-2025-10005', exporterId: ex1._id, buyerId: b3._id,
      productId: towels._id, productName: towels.nameEn,
      quantity: 500, unit: 'piece', totalValueUsd: 6000, currency: 'USD',
      status: 'cancelled', paymentStatus: 'refunded',
      deliveryMethod: 'Air', shipmentMode: 'Standard', insurance: false,
      timeline: [
        { status: 'pending', note: 'Order placed', changedAt: daysAgo(20) },
        { status: 'cancelled', note: 'Buyer cancelled - logistics issue', changedAt: daysAgo(18) },
      ],
      createdAt: daysAgo(20),
    },
    // Delivered order 2 - b3
    {
      orderNumber: 'OR-2025-10006', exporterId: ex2._id, buyerId: b3._id,
      shipperId: sh1._id, productId: hibiscus._id, productName: hibiscus.nameEn,
      quantity: 500, unit: 'kg', totalValueUsd: 1900, currency: 'USD',
      status: 'delivered', paymentStatus: 'released',
      deliveryMethod: 'Air', shipmentMode: 'Express', insurance: false,
      eta: daysAgo(10), deliveredAt: daysAgo(8),
      timeline: [
        { status: 'pending', changedAt: daysAgo(35) },
        { status: 'processing', changedAt: daysAgo(33) },
        { status: 'shipped', changedAt: daysAgo(22) },
        { status: 'in_transit', changedAt: daysAgo(15) },
        { status: 'delivered', changedAt: daysAgo(8) },
      ],
      createdAt: daysAgo(35),
    },
    // Shipped order
    {
      orderNumber: 'OR-2025-10007', exporterId: ex1._id, buyerId: b1._id,
      shipperId: sh1._id, productId: towels._id, productName: towels.nameEn,
      quantity: 1000, unit: 'piece', totalValueUsd: 12000, currency: 'USD',
      status: 'shipped', paymentStatus: 'held',
      deliveryMethod: 'Sea', shipmentMode: 'FCL', insurance: true,
      eta: daysFromNow(14),
      timeline: [
        { status: 'pending', changedAt: daysAgo(18) },
        { status: 'processing', changedAt: daysAgo(16) },
        { status: 'shipped', changedAt: daysAgo(10) },
      ],
      createdAt: daysAgo(18),
    },
    // Processing - b4
    {
      orderNumber: 'OR-2025-10008', exporterId: ex2._id, buyerId: b1._id,
      productId: dates._id, productName: dates.nameEn,
      quantity: 200, unit: 'kg', totalValueUsd: 1400, currency: 'USD',
      status: 'processing', paymentStatus: 'paid',
      deliveryMethod: 'Air', shipmentMode: 'Standard', insurance: false,
      eta: daysFromNow(10),
      timeline: [
        { status: 'pending', changedAt: daysAgo(5) },
        { status: 'processing', changedAt: daysAgo(3) },
      ],
      createdAt: daysAgo(5),
    },
  ];

  const orders = await Order.insertMany(ordersData, { lean: true });
  logger.info(`Seeded ${orders.length} orders`);
  return { orders, users: { admin, ex1, ex2, b1, b2, b3, sh1 } };
};

// ─── Seed Shipments ───────────────────────────────────────────────────────────
const seedShipments = async (orders, sh1) => {
  logger.info('Seeding shipments...');
  const o1 = orders.find(o => o.orderNumber === 'OR-2025-10001');
  const o2 = orders.find(o => o.orderNumber === 'OR-2025-10002');
  const o7 = orders.find(o => o.orderNumber === 'OR-2025-10007');

  const shipmentsData = [
    {
      containerNumber: 'CON-10001',
      orderId: o1._id, shipperId: sh1._id, exporterId: o1.exporterId, buyerId: o1.buyerId,
      originPort: 'Port Said, Egypt', destinationPort: 'Port of New York, USA',
      carrier: 'Hapag-Lloyd', departureDate: daysAgo(30), eta: daysAgo(5),
      status: 'delivered', currentLat: 40.7128, currentLng: -74.0060, currentLocation: 'New York, USA',
      stages: [
        { stage: 'pickup', location: 'Port Said, Egypt', note: 'Container loaded', recordedAt: daysAgo(30), lat: 31.2625, lng: 32.3089 },
        { stage: 'customs_cleared', location: 'Port Said, Egypt', note: 'Egyptian customs cleared', recordedAt: daysAgo(28), lat: 31.2625, lng: 32.3089 },
        { stage: 'in_transit', location: 'Mediterranean Sea', note: 'Vessel departed', recordedAt: daysAgo(20), lat: 36.0, lng: 18.0 },
        { stage: 'in_transit', location: 'Atlantic Ocean', note: 'Mid-Atlantic transit', recordedAt: daysAgo(12), lat: 38.0, lng: -40.0 },
        { stage: 'arrived', location: 'Port of New York, USA', note: 'Vessel arrived at port', recordedAt: daysAgo(7), lat: 40.7128, lng: -74.0060 },
        { stage: 'delivered', location: 'New York Warehouse', note: 'Delivered to buyer warehouse', recordedAt: daysAgo(3), lat: 40.7128, lng: -74.0060 },
      ],
    },
    {
      containerNumber: 'CON-10002',
      orderId: o2._id, shipperId: sh1._id, exporterId: o2.exporterId, buyerId: o2.buyerId,
      originPort: 'Cairo International Airport, Egypt', destinationPort: 'JFK Airport, USA',
      carrier: 'EgyptAir Cargo', departureDate: daysAgo(10), eta: daysFromNow(7),
      status: 'in_transit', currentLat: 38.0, currentLng: -10.0, currentLocation: 'Mid-Atlantic (Air)',
      stages: [
        { stage: 'pickup', location: 'Cairo International Airport', note: 'Cargo handed over', recordedAt: daysAgo(10), lat: 30.1219, lng: 31.4056 },
        { stage: 'customs_cleared', location: 'Cairo International Airport', note: 'Egyptian customs cleared', recordedAt: daysAgo(9), lat: 30.1219, lng: 31.4056 },
        { stage: 'in_transit', location: 'European Airspace', note: 'In transit via Frankfurt', recordedAt: daysAgo(3), lat: 50.0, lng: 8.0 },
      ],
    },
    {
      containerNumber: 'CON-10003',
      orderId: o7._id, shipperId: sh1._id, exporterId: o7.exporterId, buyerId: o7.buyerId,
      originPort: 'Alexandria Port, Egypt', destinationPort: 'Port of Los Angeles, USA',
      carrier: 'MSC Mediterranean', departureDate: daysAgo(10), eta: daysFromNow(14),
      status: 'in_transit', currentLat: 20.0, currentLng: -30.0, currentLocation: 'South Atlantic Ocean',
      stages: [
        { stage: 'pickup', location: 'Alexandria Port, Egypt', note: 'Container loaded on MSC Vessel', recordedAt: daysAgo(10), lat: 31.1975, lng: 29.8925 },
        { stage: 'customs_cleared', location: 'Alexandria Port', note: 'Customs cleared', recordedAt: daysAgo(9), lat: 31.1975, lng: 29.8925 },
        { stage: 'in_transit', location: 'Red Sea', note: 'Transiting Red Sea', recordedAt: daysAgo(6), lat: 20.0, lng: 38.0 },
      ],
    },
  ];

  const shipments = await Shipment.insertMany(shipmentsData, { lean: true });
  logger.info(`Seeded ${shipments.length} shipments`);
  return shipments;
};

// ─── Seed Quote Requests ──────────────────────────────────────────────────────
const seedQuoteRequests = async (users, products) => {
  logger.info('Seeding quote requests...');
  const b1 = users.find((u) => u.email === 'buyer1@ieg.com');
  const b2 = users.find((u) => u.email === 'buyer2@ieg.com');
  const ex1 = users.find((u) => u.email === 'exporter1@ieg.com');
  const ex2 = users.find((u) => u.email === 'exporter2@ieg.com');
  const p1 = products.find((p) => String(p.exporterId) === String(ex1._id));
  const p2 = products.find((p) => String(p.exporterId) === String(ex2._id));

  const quotesData = [
    { buyerId: b1._id, exporterId: ex1._id, productId: p1?._id, productType: p1?.nameEn || 'Egyptian Cotton', quantity: 500, budgetMin: 12000, budgetMax: 18000, deliveryTimeline: '45 days', status: 'new', specialRequirements: 'Organic certification and phytosanitary docs required.' },
    { buyerId: b2._id, exporterId: ex1._id, productId: p1?._id, productType: p1?.nameEn || 'Textile Products', quantity: 200, budgetMin: 8000, budgetMax: 12000, deliveryTimeline: '30 days', status: 'pending' },
    { buyerId: b1._id, exporterId: ex2._id, productId: p2?._id, productType: p2?.nameEn || 'Premium Dates', quantity: 1000, budgetMin: 25000, budgetMax: 35000, deliveryTimeline: '60 days', status: 'negotiating', responderNote: 'We can offer 5% discount for bulk order.' },
    { buyerId: b2._id, exporterId: ex2._id, productId: p2?._id, productType: p2?.nameEn || 'Dried Mango', quantity: 300, budgetMin: 5000, budgetMax: 7500, deliveryTimeline: '21 days', status: 'accepted' },
    { buyerId: b1._id, exporterId: ex1._id, productType: 'Custom Olive Oil Blend', quantity: 100, budgetMin: 3000, budgetMax: 4500, deliveryTimeline: '14 days', status: 'declined', responderNote: 'MOQ not met for this blend.' },
  ];

  const quotes = await QuoteRequest.insertMany(quotesData, { lean: true });
  logger.info(`Seeded ${quotes.length} quote requests`);
  return quotes;
};

// ─── Seed Documents ───────────────────────────────────────────────────────────
const seedDocuments = async (users) => {
  logger.info('Seeding documents...');
  const ex1 = users.find(u => u.email === 'exporter1@ieg.com');
  const ex2 = users.find(u => u.email === 'exporter2@ieg.com');
  const admin = users.find(u => u.role === 'admin');

  const docsData = [
    { userId: ex1._id, type: 'certificate_of_origin', fileName: 'COO-CHN002.pdf', fileUrl: '/uploads/docs/COO-CHN002.pdf', fileSize: 245000, mimeType: 'application/pdf', status: 'approved', expiryDate: daysFromNow(180), reviewedBy: admin._id, reviewedAt: daysAgo(20), reviewNotes: 'Verified and approved.' },
    { userId: ex1._id, type: 'commercial_invoice', fileName: 'INV-2025-001.pdf', fileUrl: '/uploads/docs/INV-2025-001.pdf', fileSize: 182000, mimeType: 'application/pdf', status: 'approved', expiryDate: daysFromNow(90), reviewedBy: admin._id, reviewedAt: daysAgo(18) },
    { userId: ex1._id, type: 'packing_list', fileName: 'PKL-2025-001.pdf', fileUrl: '/uploads/docs/PKL-2025-001.pdf', fileSize: 156000, mimeType: 'application/pdf', status: 'pending_review', uploadDate: daysAgo(2), expiryDate: daysFromNow(13) },
    { userId: ex1._id, type: 'bill_of_lading', fileName: 'BOL-HH002.pdf', fileUrl: '/uploads/docs/BOL-HH002.pdf', fileSize: 198000, mimeType: 'application/pdf', status: 'approved', reviewedBy: admin._id, reviewedAt: daysAgo(15), uploadDate: daysAgo(20), expiryDate: daysFromNow(5) },
    { userId: ex1._id, type: 'phytosanitary_certificate', fileName: 'PHYTO-001.pdf', fileUrl: '/uploads/docs/PHYTO-001.pdf', fileSize: 134000, mimeType: 'application/pdf', status: 'rejected', rejectionReason: 'Certificate expired — please upload a current version.', reviewedBy: admin._id, reviewedAt: daysAgo(10), uploadDate: daysAgo(25), expiryDate: daysAgo(10) },
    { userId: ex2._id, type: 'certificate_of_origin', fileName: 'COO-NILE-001.pdf', fileUrl: '/uploads/docs/COO-NILE-001.pdf', fileSize: 211000, mimeType: 'application/pdf', status: 'approved', expiryDate: daysFromNow(120), reviewedBy: admin._id, reviewedAt: daysAgo(30) },
    { userId: ex2._id, type: 'phytosanitary_certificate', fileName: 'PHYTO-AGR-002.pdf', fileUrl: '/uploads/docs/PHYTO-AGR-002.pdf', fileSize: 165000, mimeType: 'application/pdf', status: 'pending_review', uploadDate: daysAgo(1), expiryDate: daysFromNow(14) },
    { userId: ex2._id, type: 'commercial_invoice', fileName: 'INV-NILE-025.pdf', fileUrl: '/uploads/docs/INV-NILE-025.pdf', fileSize: 178000, mimeType: 'application/pdf', status: 'approved', reviewedBy: admin._id, reviewedAt: daysAgo(12) },
  ];

  const documents = await Document.insertMany(docsData, { lean: true });
  logger.info(`Seeded ${documents.length} documents`);
  return documents;
};

// ─── Seed Verifications ───────────────────────────────────────────────────────
const seedVerifications = async (users) => {
  logger.info('Seeding verifications...');
  const admin = users.find(u => u.role === 'admin');
  const ex1   = users.find(u => u.email === 'exporter1@ieg.com');
  const ex2   = users.find(u => u.email === 'exporter2@ieg.com');
  const ex3   = users.find(u => u.email === 'exporter3@ieg.com');
  const sh1   = users.find(u => u.email === 'shipper1@ieg.com');
  const sh2   = users.find(u => u.email === 'shipper2@ieg.com');

  const vData = [
    { userId: ex1._id, taxId: 'EG-TAX-100234', tradeLicenseUrl: '/docs/trade-ex1.pdf', businessRegUrl: '/docs/reg-ex1.pdf', status: 'approved', reviewerId: admin._id, reviewerNotes: 'All documents verified.', submittedAt: daysAgo(60), reviewedAt: daysAgo(55) },
    { userId: ex2._id, taxId: 'EG-TAX-200567', tradeLicenseUrl: '/docs/trade-ex2.pdf', businessRegUrl: '/docs/reg-ex2.pdf', status: 'approved', reviewerId: admin._id, reviewerNotes: 'Approved.', submittedAt: daysAgo(45), reviewedAt: daysAgo(42) },
    { userId: ex3._id, taxId: 'EG-TAX-300891', tradeLicenseUrl: '/docs/trade-ex3.pdf', status: 'pending', submittedAt: daysAgo(5) },
    { userId: sh1._id, taxId: 'EG-LOG-100001', tradeLicenseUrl: '/docs/trade-sh1.pdf', businessRegUrl: '/docs/reg-sh1.pdf', status: 'approved', reviewerId: admin._id, reviewerNotes: 'Logistics license verified.', submittedAt: daysAgo(50), reviewedAt: daysAgo(48) },
    { userId: sh2._id, taxId: 'AE-LOG-500221', tradeLicenseUrl: '/docs/trade-sh2.pdf', status: 'under_review', submittedAt: daysAgo(3) },
  ];

  const verifications = await Verification.insertMany(vData, { lean: true });
  logger.info(`Seeded ${verifications.length} verifications`);
  return verifications;
};

// ─── Seed Transactions ────────────────────────────────────────────────────────
const seedTransactions = async (orders, users) => {
  logger.info('Seeding transactions...');
  const ex1 = users.find(u => u.email === 'exporter1@ieg.com');
  const ex2 = users.find(u => u.email === 'exporter2@ieg.com');
  const b1  = users.find(u => u.email === 'buyer1@ieg.com');
  const b2  = users.find(u => u.email === 'buyer2@ieg.com');
  const o1  = orders.find(o => o.orderNumber === 'OR-2025-10001');
  const o6  = orders.find(o => o.orderNumber === 'OR-2025-10006');

  // transactionType is the canonical required field.
  // type is a deprecated alias kept for backward-compat — the pre('validate')
  // hook in wallet.model.js syncs both directions automatically.
  // 'income' maps to the 'escrow_release' business concept but remains a valid
  // legacy enum value (kept in TX_TYPES for backward compat).
  const txData = [
    { userId: b1._id,  orderId: o1._id, transactionType: 'payment',         type: 'payment',    amountUsd: -28000,  description: 'Payment held for Order OR-2025-10001',                  status: 'completed', reference: 'OR-2025-10001', createdAt: daysAgo(43)  },
    { userId: ex1._id, orderId: o1._id, transactionType: 'escrow_release',   type: 'income',     amountUsd:  27300,  description: 'Payment released for Order OR-2025-10001 (fee: $700)',   status: 'completed', reference: 'OR-2025-10001', createdAt: daysAgo(3)   },
    { userId: b2._id,  orderId: o6._id, transactionType: 'payment',          type: 'deposit',    amountUsd: -1900,   description: 'Payment held for Order OR-2025-10006',                  status: 'completed', reference: 'OR-2025-10006', createdAt: daysAgo(33)  },
    { userId: ex2._id, orderId: o6._id, transactionType: 'escrow_release',   type: 'income',     amountUsd:  1852.5, description: 'Payment released for Order OR-2025-10006 (fee: $47.50)', status: 'completed', reference: 'OR-2025-10006', createdAt: daysAgo(8)   },
    { userId: ex1._id,                  transactionType: 'escrow_release',   type: 'income',     amountUsd:  12000,  description: 'Legacy order payment received',                          status: 'completed',                              createdAt: daysAgo(90)  },
    { userId: ex1._id,                  transactionType: 'withdrawal',       type: 'withdrawal', amountUsd: -5000,   description: 'Bank transfer to HSBC Egypt',                           status: 'completed', reference: 'WITHDRAW-001', createdAt: daysAgo(60)  },
    { userId: ex1._id,                  transactionType: 'escrow_release',   type: 'income',     amountUsd:  8500,   description: 'OR-2024-09988 payment',                                 status: 'completed',                              createdAt: daysAgo(75)  },
    { userId: ex2._id,                  transactionType: 'escrow_release',   type: 'income',     amountUsd:  4200,   description: 'OR-2024-09765 payment',                                 status: 'completed',                              createdAt: daysAgo(120) },
  ];

  const txns = await Transaction.insertMany(txData, { lean: true });
  logger.info(`Seeded ${txns.length} transactions`);
  return txns;
};

// ─── Seed Notifications ───────────────────────────────────────────────────────
const seedNotifications = async (users) => {
  logger.info('Seeding notifications...');
  const ex1 = users.find(u => u.email === 'exporter1@ieg.com');
  const b1  = users.find(u => u.email === 'buyer1@ieg.com');
  const admin = users.find(u => u.role === 'admin');

  const nData = [
    { userId: ex1._id, type: 'order', title: 'New Order Received', body: 'James Wilson placed a new order for Egyptian Cotton Towels.', link: '/exporter/orders', isRead: false },
    { userId: ex1._id, type: 'payment', title: 'Payment Released', body: 'USD 27,300 has been released to your wallet for Order OR-2025-10001.', link: '/exporter/wallet', isRead: true },
    { userId: ex1._id, type: 'verification', title: 'Account Verified', body: 'Your business has been verified. You can now access all features.', link: '/exporter/dashboard', isRead: true },
    { userId: b1._id, type: 'shipment', title: 'Shipment Delivered', body: 'Your order OR-2025-10001 has been delivered. Rate your experience.', link: '/buyer/orders', isRead: false },
    { userId: b1._id, type: 'order', title: 'Order Confirmed', body: 'Your order OR-2025-10002 has been confirmed by the exporter.', link: '/buyer/orders', isRead: true },
    { userId: b1._id, type: 'order', title: 'Purchase Request Update', body: 'Your purchase request received a response from the exporter.', link: '/buyer/orders', isRead: false },
    { userId: admin._id, type: 'verification', title: 'New Verification Request', body: 'Cairo Marble Co. submitted verification documents for review.', link: '/admin/verifications', isRead: false },
    { userId: admin._id, type: 'system', title: 'System Health OK', body: 'All systems are operational. Database uptime: 100%.', link: '/admin/dashboard', isRead: true },
  ];

  const notifs = await Notification.insertMany(nData, { lean: true });
  logger.info(`Seeded ${notifs.length} notifications`);
  return notifs;
};

// ─── Seed Messages ────────────────────────────────────────────────────────────
const seedMessages = async (users) => {
  logger.info('Seeding messages...');
  const ex1 = users.find(u => u.email === 'exporter1@ieg.com');
  const b1  = users.find(u => u.email === 'buyer1@ieg.com');
  const sh1 = users.find(u => u.email === 'shipper1@ieg.com');

  const conv1 = await Conversation.create({ participants: [ex1._id, b1._id], lastMessage: 'We can arrange that. Let me send you the shipping terms.', lastMessageAt: daysAgo(1) });
  const conv2 = await Conversation.create({ participants: [ex1._id, sh1._id], lastMessage: 'Container CON-10003 is now in transit.', lastMessageAt: daysAgo(0) });

  const msgsData = [
    { conversationId: conv1._id, senderId: b1._id, receiverId: ex1._id, content: "Hi, I'm interested in your cotton products. Can you provide samples?", isRead: true, createdAt: daysAgo(10) },
    { conversationId: conv1._id, senderId: ex1._id, receiverId: b1._id, content: 'Hello James! Yes, we can send samples. What quantity are you looking for?', isRead: true, createdAt: daysAgo(9) },
    { conversationId: conv1._id, senderId: b1._id, receiverId: ex1._id, content: "We're looking for about 20 tons initially, with potential for regular orders.", isRead: true, createdAt: daysAgo(8) },
    { conversationId: conv1._id, senderId: ex1._id, receiverId: b1._id, content: 'That works well. I can offer you our tiered pricing — $1,400/ton for 20 tons. Shall I send the formal quote?', isRead: true, createdAt: daysAgo(7) },
    { conversationId: conv1._id, senderId: b1._id, receiverId: ex1._id, content: "Yes please. Also, what's your lead time for shipment?", isRead: true, createdAt: daysAgo(6) },
    { conversationId: conv1._id, senderId: ex1._id, receiverId: b1._id, content: 'We can arrange that. Let me send you the shipping terms.', isRead: false, createdAt: daysAgo(1), attachments: [{ fileName: 'ShippingTerms.pdf', fileUrl: '/docs/shipping-terms.pdf', fileType: 'application/pdf' }] },
    { conversationId: conv2._id, senderId: sh1._id, receiverId: ex1._id, content: 'Container CON-10003 has been loaded. Departure confirmed for tomorrow.', isRead: true, createdAt: daysAgo(10) },
    { conversationId: conv2._id, senderId: ex1._id, receiverId: sh1._id, content: 'Great! Please keep me updated on customs clearance.', isRead: true, createdAt: daysAgo(9) },
    { conversationId: conv2._id, senderId: sh1._id, receiverId: ex1._id, content: 'Container CON-10003 is now in transit. ETA Los Angeles in 14 days.', isRead: false, createdAt: daysAgo(0) },
  ];

  await Message.insertMany(msgsData, { lean: true });
  logger.info(`Seeded ${msgsData.length} messages in ${2} conversations`);
};

// ─── Main Seed Runner ─────────────────────────────────────────────────────────
const runSeed = async () => {
  try {
    const { getMongoUri, getMongoOptions } = require('../config/mongoUri');
    const uri = getMongoUri();
    await mongoose.connect(uri, getMongoOptions());
    logger.info(`Connected to MongoDB (${mongoose.connection.name})`);

    const isClear = process.argv.includes('--clear');

    await clearAll();
    if (isClear) {
      logger.info('Data cleared. Exiting.');
      await mongoose.disconnect();
      return;
    }

    const users    = await seedUsers();
    const products = await seedProducts(users.filter(u => u.role === 'exporter'));
    await seedQuoteRequests(users, products);
    const { orders, users: namedUsers } = await seedOrders(users, products);
    await seedShipments(orders, namedUsers.sh1);
    await seedDocuments(users);
    await seedVerifications(users);
    await seedTransactions(orders, users);
    await seedNotifications(users);
    await seedMessages(users);

    logger.info('');
    logger.info('══════════════════════════════════════════════');
    logger.info('  IEG Seed Complete!');
    logger.info('──────────────────────────────────────────────');
    logger.info('  Test Credentials:');
    logger.info('  Admin    → admin@ieg.com      / Admin@1234');
    logger.info('  Exporter → exporter1@ieg.com  / Export@1234');
    logger.info('  Exporter → exporter2@ieg.com  / Export@1234');
    logger.info('  Buyer    → buyer1@ieg.com     / Buyer@1234');
    logger.info('  Buyer    → buyer2@ieg.com     / Buyer@1234');
    logger.info('  Shipper  → shipper1@ieg.com   / Ship@1234');
    logger.info('══════════════════════════════════════════════');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
};

runSeed();
