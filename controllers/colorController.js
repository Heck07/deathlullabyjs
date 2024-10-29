// colorController.js

const db = require('../config/database');
const cloudinary = require('../config/cloudinaryConfig'); // Importer la configuration Cloudinary
const upload = require('../config/uploadConfig'); // Importer multer pour la gestion des fichiers

exports.addColor = async (req, res) => {
  const { color_name, hex_code } = req.body;
  const productId = req.params.id;
  const images = req.files || [];

  try {
    // Insérer la couleur dans la table colors
    const [colorResult] = await db.query(
      'INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)',
      [productId, color_name, hex_code]
    );
    const colorId = colorResult.insertId;
    console.log(`Couleur ajoutée avec ID : ${colorId}`);

    // Télécharge chaque image sur Cloudinary, puis insère dans product_images
    for (const file of images) {
      const uploadResponse = await cloudinary.uploader.upload(file.path);
      console.log(`Image uploadée sur Cloudinary : ${uploadResponse.secure_url}`);
      
      await db.query(
        'INSERT INTO product_images (product_id, image_url, color_id) VALUES (?, ?, ?)',
        [productId, uploadResponse.secure_url, colorId]
      );
      console.log(`Image ajoutée à product_images pour la couleur ID : ${colorId}`);
    }

    res.status(201).json({ message: 'Couleur et images ajoutées avec succès' });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la couleur et des images :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};


exports.getColorsByProductId = (req, res) => {
  const { id: productId } = req.params;
  const query = 'SELECT * FROM colors WHERE product_id = ?';
  db.query(query, [productId], (err, results) => {
    if (err) return res.status(500).send('Error retrieving colors');
    res.status(200).json(results);
  });
};

exports.updateColor = (req, res) => {
  const { colorId } = req.params;
  const { color_name, hex_code } = req.body;
  const query = 'UPDATE colors SET color_name = ?, hex_code = ? WHERE id = ?';
  db.query(query, [color_name, hex_code, colorId], (err) => {
    if (err) return res.status(500).send('Error updating color');
    res.status(200).send('Color updated successfully');
  });
};

exports.deleteColor = (req, res) => {
  const { colorId } = req.params;
  const query = 'DELETE FROM colors WHERE id = ?';
  db.query(query, [colorId], (err) => {
    if (err) return res.status(500).send('Error deleting color');
    res.status(200).send('Color deleted successfully');
  });
};
