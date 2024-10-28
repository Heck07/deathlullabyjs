const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowed_formats: ['jpg', 'png'],
  },
});

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});
module.exports = upload;
