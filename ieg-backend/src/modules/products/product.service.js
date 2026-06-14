'use strict';

const Product = require('./product.model');
const ApiError = require('../../utils/ApiError');
const { getPagination } = require('../../utils/pagination');
const { saveFile, deleteFile } = require('../../utils/fileStorage');

/**
 * Upload files to Cloudinary (or local) and return image objects ready for the DB.
 * First file becomes isPrimary = true.
 */
const _uploadImages = async (files = [], userId) => {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    const saved = await saveFile(files[i], userId, 'products');
    results.push({
      url:       saved.url,
      publicId:  saved.publicId,   // null when using local storage
      isPrimary: i === 0,
    });
  }
  return results;
};

/**
 * Delete a list of image objects from Cloudinary / local disk.
 */
const _deleteImages = async (images = []) => {
  for (const img of images) {
    await deleteFile(img.url, img.publicId, 'image');
  }
};

// ─── Create Product ────────────────────────────────────────────────────────────
const create = async (exporterId, data, isVerified, files = []) => {
  const images = await _uploadImages(files, exporterId);
  let status = data.status || 'draft';
  if (status === 'published' && !isVerified) {
    status = 'pending_review';
  }
  const product = await Product.create({
    ...data,
    status,
    images: images.length ? images : data.images || [],
    exporterId,
    isVerifiedExporter: isVerified,
  });
  return product;
};

// ─── Get Marketplace (public) ──────────────────────────────────────────────────
const getMarketplace = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { status: 'published' };

  if (query.q) {
    const term = String(query.q).trim();
    if (term) {
      filter.$or = [
        { $text: { $search: term } },
        { nameEn: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { tags: { $regex: term, $options: 'i' } },
      ];
    }
  }
  if (query.category) filter.category = query.category;
  if (query.cert)     filter['certifications.type'] = query.cert;
  if (query.origin)   filter.countryOfOrigin = query.origin.toUpperCase();
  if (query.moq)      filter.moq = { $lte: parseInt(query.moq) };
  if (query.minPrice) filter['pricing.pricePerUnit'] = { $gte: parseFloat(query.minPrice) };
  if (query.maxPrice) {
    filter['pricing.pricePerUnit'] = {
      ...filter['pricing.pricePerUnit'],
      $lte: parseFloat(query.maxPrice),
    };
  }

  const sort = { createdAt: -1 };
  const [data, total] = await Promise.all([
    Product.find(filter)
      .populate('exporterId', 'fullName companyName country avatarUrl isVerified')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { data, total, page, limit };
};

// ─── Get Product by ID (increments view count) ────────────────────────────────
const getById = async (productId) => {
  const product = await Product.findByIdAndUpdate(
    productId,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('exporterId', 'fullName companyName country avatarUrl isVerified rating');

  if (!product) throw ApiError.notFound('Product not found');
  return product;
};

// ─── Get My Products ───────────────────────────────────────────────────────────
const getMyProducts = async (exporterId, query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = { exporterId };
  if (query.status)   filter.status = query.status;
  if (query.category) filter.category = query.category;

  const [data, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

// ─── Update Product ────────────────────────────────────────────────────────────
// New files are uploaded and appended to existing images.
// To replace all images, callers can pass replaceImages=true in data (future extension).
const update = async (productId, exporterId, data, files = []) => {
  const product = await Product.findOne({ _id: productId, exporterId });
  if (!product) throw ApiError.notFound('Product not found or you do not own it');

  if (files.length) {
    const newImages = await _uploadImages(files, exporterId);
    product.images = [...(product.images || []), ...newImages];
  }

  Object.assign(product, data);
  await product.save();
  return product;
};

// ─── Update Status ─────────────────────────────────────────────────────────────
const updateStatus = async (productId, userId, userRole, status) => {
  const filter = userRole === 'admin' ? { _id: productId } : { _id: productId, exporterId: userId };
  const product = await Product.findOneAndUpdate(filter, { status }, { new: true });
  if (!product) throw ApiError.notFound('Product not found or you do not own it');
  return product;
};

// ─── Delete Product ────────────────────────────────────────────────────────────
// Removes the product from DB and deletes all associated images from Cloudinary / disk.
const remove = async (productId, exporterId) => {
  const product = await Product.findOneAndDelete({ _id: productId, exporterId });
  if (!product) throw ApiError.notFound('Product not found or you do not own it');
  await _deleteImages(product.images || []);
};

// ─── Admin: Get All Products ───────────────────────────────────────────────────
const adminGetAll = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const filter = {};
  if (query.status)   filter.status = query.status;
  if (query.category) filter.category = query.category;

  const [data, total] = await Promise.all([
    Product.find(filter)
      .populate('exporterId', 'fullName companyName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { data, total, page, limit };
};

module.exports = { create, getMarketplace, getById, getMyProducts, update, updateStatus, remove, adminGetAll };
