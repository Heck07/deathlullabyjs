const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Replace with your target Cloudinary folder
    allowedFormats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage: storage });
module.exports = upload;
