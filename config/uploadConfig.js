const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    format: async (req, file) => 'jpg', // Optionnel : définir le format
    public_id: (req, file) => file.originalname,
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
