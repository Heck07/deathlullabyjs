// cloudinaryConfig.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fonction de téléversement pour les fichiers
const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'products' // Dossier de destination dans Cloudinary (optionnel)
    });
    return result;
  } catch (error) {
    console.error("Erreur lors de l'upload vers Cloudinary :", error);
    throw error;
  }
};

module.exports = { cloudinary, uploadImage };
