const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

const storage = multer.memoryStorage();

const extFilter = (allowed) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`File type ${ext} not allowed. Allowed: ${allowed.join(', ')}`), false);
  }
};

/** Documents: PDF, images, docx */
const documentUpload = multer({
  storage,
  fileFilter: extFilter(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.docx']),
  limits: { fileSize: 10 * 1024 * 1024 },
});

/** Product images */
const imageUpload = multer({
  storage,
  fileFilter: extFilter(['.jpg', '.jpeg', '.png', '.webp', '.gif']),
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = documentUpload;
module.exports.imageUpload = imageUpload;
module.exports.single = documentUpload.single.bind(documentUpload);
module.exports.array = documentUpload.array.bind(documentUpload);
