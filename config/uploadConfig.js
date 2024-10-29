const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig'); // Assurez-vous que ceci importe correctement votre config Cloudinary

// Configurez Multer pour utiliser Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products', // Facultatif : nom du dossier sur Cloudinary
    format: async (req, file) => 'jpg', // Facultatif : spécifiez le format de fichier
    public_id: (req, file) => file.originalname,
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
