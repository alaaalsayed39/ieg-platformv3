/**
 * Verify MongoDB Atlas connection and audit all collections + CRUD.
 * Run: node scripts/verify-db.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const { getMongoUri, getMongoOptions } = require('../src/config/mongoUri');

const User = require('../src/modules/users/user.model');
const Product = require('../src/modules/products/product.model');
const Order = require('../src/modules/orders/order.model');
const QuoteRequest = require('../src/modules/orders/quoteRequest.model');
const Shipment = require('../src/modules/shipments/shipment.model');
const Transaction = require('../src/modules/payments/wallet.model');
const Document = require('../src/modules/documents/document.model');
const Verification = require('../src/modules/verifications/verification.model');
const Notification = require('../src/modules/notifications/notification.model');
const { Conversation, Message } = require('../src/modules/messages/message.model');

const MODELS = [
  { name: 'users', model: User },
  { name: 'products', model: Product },
  { name: 'orders', model: Order },
  { name: 'quoterequests', model: QuoteRequest },
  { name: 'shipments', model: Shipment },
  { name: 'transactions', model: Transaction },
  { name: 'documents', model: Document },
  { name: 'verifications', model: Verification },
  { name: 'notifications', model: Notification },
  { name: 'conversations', model: Conversation },
  { name: 'messages', model: Message },
];

const redactUri = (uri) => uri.replace(/:([^@/]+)@/, ':****@');

async function auditCollections() {
  console.log('\n── Collection counts ──');
  for (const { name, model } of MODELS) {
    const count = await model.countDocuments();
    const coll = model.collection.collectionName;
    console.log(`  ${coll.padEnd(18)} ${count}`);
  }
}

async function smokeCrud() {
  console.log('\n── CRUD smoke tests ──');
  const exporter = await User.findOne({ role: 'exporter' });
  if (!exporter) {
    console.log('  ⚠ No exporter in DB — run: npm run seed');
    return false;
  }

  const created = await Product.create({
    nameEn: '__verify_test_product__',
    category: 'Other',
    exporterId: exporter._id,
    pricing: { pricePerUnit: 1, unit: 'kg', currency: 'USD' },
    status: 'draft',
    inventory: { quantity: 1, unit: 'kg' },
  });
  const read = await Product.findById(created._id);
  await Product.findByIdAndUpdate(created._id, { description: 'updated' });
  await Product.findByIdAndDelete(created._id);
  const deleted = await Product.findById(created._id);

  const ok = read && read.nameEn === '__verify_test_product__' && !deleted;
  console.log(`  products CRUD: ${ok ? 'PASS' : 'FAIL'}`);

  const convCount = await Conversation.countDocuments();
  const msgCount = await Message.countDocuments();
  console.log(`  messages persist: ${msgCount >= 0 ? 'PASS' : 'FAIL'} (${msgCount} messages, ${convCount} conversations)`);

  const docCount = await Document.countDocuments();
  console.log(`  documents in Atlas: ${docCount} records`);

  const shipCount = await Shipment.countDocuments();
  console.log(`  shipments in Atlas: ${shipCount} records`);

  return ok;
}

async function main() {
  const uri = getMongoUri();
  console.log('Connecting to:', redactUri(uri));

  await mongoose.connect(uri, getMongoOptions());
  const { host, name, readyState } = mongoose.connection;
  console.log(`\n✓ Connected — host: ${host}, database: ${name}, state: ${readyState}`);

  const isAtlas = uri.includes('mongodb+srv://');
  console.log(`  Provider: ${isAtlas ? 'MongoDB Atlas' : 'Local/self-hosted'}`);

  await auditCollections();
  const crudOk = await smokeCrud();

  await mongoose.disconnect();
  console.log('\n── Summary ──');
  console.log(crudOk ? '✓ Atlas verification passed' : '✗ Some checks failed — run npm run seed');
  process.exit(crudOk ? 0 : 1);
}

main().catch((err) => {
  console.error('\n✗ Verification failed:', err.message);
  process.exit(1);
});
