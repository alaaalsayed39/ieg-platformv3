'use strict';

const cloudinary = require('cloudinary').v2;
const { CLOUDINARY } = require('./env');

const isConfigured = !!(CLOUDINARY.CLOUD_NAME && CLOUDINARY.API_KEY && CLOUDINARY.API_SECRET);

if (isConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY.CLOUD_NAME,
    api_key:    CLOUDINARY.API_KEY,
    api_secret: CLOUDINARY.API_SECRET,
    secure:     true,
  });
  console.log(`✅ Cloudinary configured (cloud: ${CLOUDINARY.CLOUD_NAME})`);
} else {
  console.warn('⚠️  Cloudinary not configured — file uploads will fall back to local disk');
}

// Export both the configured client AND the readiness flag.
// fileStorage.js uses cloudinary.isReady to avoid calling config() getter
// (which behaves differently across cloudinary SDK v1/v2).
cloudinary.isReady = isConfigured;

module.exports = cloudinary;
