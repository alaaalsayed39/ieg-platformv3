'use strict';

const fs   = require('fs');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '../../uploads');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const sanitizeName = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

// ── Cloudinary availability check ──────────────────────────────────────────────
// Lazy-loaded so the module doesn't crash at startup if cloudinary isn't installed.
// We check the .isReady flag set by config/cloudinary.js rather than calling
// cloudinary.config() getter, which behaves differently across SDK v1/v2.
let _cloudinary = null;
const getCloudinary = () => {
  if (_cloudinary !== null) return _cloudinary;
  try {
    const c = require('../config/cloudinary');
    _cloudinary = c.isReady ? c : false;
  } catch {
    _cloudinary = false;
  }
  return _cloudinary;
};

// ── Upload a buffer to Cloudinary ──────────────────────────────────────────────
const _cloudinaryUpload = (buffer, folder, resourceType = 'auto') =>
  new Promise((resolve, reject) => {
    const cloudinary = getCloudinary();
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType, use_filename: false, unique_filename: true },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

// ── Delete a Cloudinary asset by its public_id ─────────────────────────────────
const _cloudinaryDelete = async (publicId, resourceType = 'raw') => {
  const cloudinary = getCloudinary();
  if (!cloudinary || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('[Cloudinary] delete failed:', publicId, err.message);
  }
};

/**
 * Detect the Cloudinary resource_type for a MIME type.
 * Cloudinary accepts 'image', 'video', 'raw'.
 */
const _resourceType = (mimeType = '') => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
};

/**
 * Save a multer in-memory file to Cloudinary (when configured) or local disk.
 *
 * Returns: { url, publicId, fileName, fileSize, mimeType, storage }
 *   - url      → full https Cloudinary URL  OR  relative /uploads/... path
 *   - publicId → Cloudinary public_id  OR  null (local)
 *   - storage  → 'cloudinary' | 'local'
 */
const saveFile = async (file, userId, subdir = 'documents') => {
  if (!file?.buffer) throw new Error('No file buffer to save');

  const cloudinary = getCloudinary();

  if (cloudinary) {
    // ── Cloudinary path ────────────────────────────────────────────────────────
    const folder = `ieg/${subdir}/${userId}`;
    const resType = _resourceType(file.mimetype);
    const result = await _cloudinaryUpload(file.buffer, folder, resType);
    return {
      url:      result.secure_url,
      publicId: result.public_id,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      storage:  'cloudinary',
    };
  }

  // ── Local disk fallback ────────────────────────────────────────────────────
  const dir = path.join(UPLOAD_ROOT, subdir, String(userId));
  ensureDir(dir);
  const fileName = `${Date.now()}_${sanitizeName(file.originalname)}`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, file.buffer);
  const url = `/uploads/${subdir}/${userId}/${fileName}`;
  return {
    url,
    publicId: null,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    storage:  'local',
  };
};

/**
 * Delete a file from Cloudinary (by publicId) or local disk (by url).
 * Safe to call with partial/missing data — will no-op if nothing to delete.
 */
const deleteFile = async (url, publicId, mimeType) => {
  if (publicId) {
    const resType = _resourceType(mimeType);
    await _cloudinaryDelete(publicId, resType);
    return;
  }
  // Local fallback
  if (!url || !url.startsWith('/uploads/')) return;
  const rel = url.replace('/uploads/', '');
  const filePath = path.join(UPLOAD_ROOT, rel);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }
};

/**
 * Resolve a local /uploads/... URL to an absolute file path.
 * Returns null for Cloudinary URLs (they don't need streaming).
 */
const resolveFilePath = (url) => {
  if (!url?.startsWith('/uploads/')) return null;
  const rel = url.replace('/uploads/', '');
  const filePath = path.join(UPLOAD_ROOT, rel);
  return fs.existsSync(filePath) ? filePath : null;
};

module.exports = { UPLOAD_ROOT, saveFile, deleteFile, resolveFilePath, ensureDir };
