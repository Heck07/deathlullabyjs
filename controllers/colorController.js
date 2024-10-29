const db = require('../config/database');
const cloudinary = require('../config/cloudinaryConfig'); // Assurez-vous que votre configuration Cloudinary est correcte

exports.addColor = (req, res) => {
  const { color_name, hex_code } = req.body;
  const productId = req.params.id;
  const images = req.files || [];

  // Insère la couleur dans la base de données
  db.query('INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)', [productId, color_name, hex_code], (err, colorResult) => {
    if (err) {
      console.error("Erreur lors de l'ajout de la couleur :", err);
      return res.status(500).json({ error: "Erreur serveur lors de l'ajout de la couleur" });
    }

    const colorId = colorResult.insertId;

    // Tableau pour stocker les promesses de téléchargement et d'insertion
    const imagePromises = images.map((file) => {
      return new Promise((resolve, reject) => {
        // Téléchargez chaque image sur Cloudinary
        cloudinary.uploader.upload(file.path, (error, uploadResult) => {
          if (error) {
            console.error("Erreur lors du téléchargement sur Cloudinary :", error);
            reject(error);
          } else {
            // Insère l'URL de l'image dans `product_images`
            db.query('INSERT INTO product_images (product_id, image_url, color_id) VALUES (?, ?, ?)', [productId, uploadResult.secure_url, colorId], (err) => {
              if (err) {
                console.error("Erreur lors de l'insertion de l'image dans la base de données :", err);
                reject(err);
              } else {
                resolve(uploadResult.secure_url);
              }
            });
          }
        });
      });
    });

    // Gère toutes les promesses
    Promise.all(imagePromises)
      .then((results) => {
        res.status(201).json({ message: 'Couleur et images ajoutées avec succès', images: results });
      })
      .catch((error) => {
        console.error("Erreur lors de l'ajout des images :", error);
        res.status(500).json({ error: "Erreur serveur lors de l'ajout des images" });
      });
  });
};

exports.getColorsByProductId = (req, res) => {
  const { id: productId } = req.params;
  const query = 'SELECT color_name, hex_code FROM colors WHERE product_id = ?';
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
