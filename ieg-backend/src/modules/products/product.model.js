const mongoose = require('mongoose');

const tieredPricingSchema = new mongoose.Schema({
  minQty:       { type: Number, required: true },
  maxQty:       { type: Number },
  pricePerUnit: { type: Number, required: true },
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  type: { type: String, enum: ['ISO', 'Organic', 'Halal', 'OEKO-TEX', 'Custom'] },
  name: { type: String },
}, { _id: false });

const productSchema = new mongoose.Schema(
  {
    exporterId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nameEn:      { type: String, required: true, trim: true, maxlength: 200 },
    nameAr:      { type: String, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Agriculture', 'Textiles', 'Chemicals', 'Marble', 'Handicrafts',
             'Electronics', 'Food & Beverage', 'Machinery', 'Furniture', 'Other'],
    },
    description: { type: String, maxlength: 5000 },
    images: [{
      url:       { type: String, required: true },
      publicId:  { type: String, default: null },   // Cloudinary public_id for deletion
      isPrimary: { type: Boolean, default: false },
    }],
    pricing: {
      pricePerUnit:  { type: Number, required: true, min: 0 },
      currency:      { type: String, default: 'USD' },
      unit:          { type: String, required: true }, // kg, ton, piece, m²
      tieredPricing: [tieredPricingSchema],
    },
    moq:       { type: Number, default: 1 }, // Minimum Order Quantity
    inventory: {
      quantity: { type: Number, default: 0 },
      unit:     { type: String },
    },
    shipping: {
      length: Number, width: Number, height: Number, weight: Number,
    },
    certifications:    [certificationSchema],
    specifications:    { type: Map, of: String }, // flexible k-v: { color: 'White', grade: 'AA+' }
    status:            { type: String, enum: ['published', 'draft', 'inactive', 'pending_review'], default: 'draft', index: true },
    isVerifiedExporter:{ type: Boolean, default: false },
    rating:            { type: Number, default: 0, min: 0, max: 5 },
    reviewCount:       { type: Number, default: 0 },
    views:             { type: Number, default: 0 },
    tags:              [{ type: String, lowercase: true, trim: true }],
    countryOfOrigin:   { type: String, default: 'EG' },
  },
  { timestamps: true }
);

// ─── Full-text search index ────────────────────────────────────────────────────
productSchema.index({ nameEn: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ 'pricing.pricePerUnit': 1 });

module.exports = mongoose.model('Product', productSchema);
