const db = require('../config/database');
const cloudinary = require('../config/cloudinaryConfig'); // Assurez-vous que votre configuration Cloudinary est correcte

exports.addColor = (req, res) => {
  const { color_name, hex_code } = req.body;
  const productId = req.params.id;
  const images = req.files || [];

  // Insère la couleur dans la base de données
  db.query(
    'INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)', 
    [productId, color_name, hex_code], 
    (err, colorResult) => {
      if (err) {
        return res.status(500).json({ error: "Erreur serveur lors de l'ajout de la couleur" });
      }

      const colorId = colorResult.insertId;

      // Tableau pour stocker les promesses de téléchargement et d'insertion
      const imagePromises = images.map((file) => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload(file.path, (error, uploadResult) => {
            if (error) {
              console.error("Erreur lors du téléchargement sur Cloudinary :", error);
              reject(error);
            } else {
              db.query(
                'INSERT INTO product_images (product_id, image_url, color_id) VALUES (?, ?, ?)', 
                [productId, uploadResult.secure_url, colorId], 
                (err) => {
                  if (err) {
                    console.error("Erreur lors de l'insertion de l'image dans la base de données :", err);
                    reject(err);
                  } else {
                    resolve(uploadResult.secure_url);
                  }
                }
              );
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
    }
  );
};

exports.getColorsByProductId = (req, res) => {
  const { id: productId } = req.params;
  const query = 'SELECT id, color_name, hex_code FROM colors WHERE product_id = ?';

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des couleurs :', err);
      return res.status(500).send('Erreur lors de la récupération des couleurs');
    }
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

  // Étape 1 : Récupérer les URLs des images associées à cette couleur
  const getImageUrlsQuery = 'SELECT image_url FROM product_images WHERE color_id = ?';
  db.query(getImageUrlsQuery, [colorId], (err, results) => {
    if (err) return res.status(500).send('Error retrieving images for color');

    const imageUrls = results.map(row => row.image_url);

    // Étape 2 : Supprimer les images de Cloudinary
    const deleteImagePromises = imageUrls.map((url) => {
      const publicId = url.split('/').pop().split('.')[0]; // Récupère le public_id de l'URL
      return cloudinary.uploader.destroy(publicId);
    });

    Promise.all(deleteImagePromises)
      .then(() => {
        // Étape 3 : Supprimer les entrées des images associées dans `product_images`
        const deleteImagesQuery = 'DELETE FROM product_images WHERE color_id = ?';
        db.query(deleteImagesQuery, [colorId], (err) => {
          if (err) return res.status(500).send('Error deleting images from database');

          // Étape 4 : Supprimer la couleur de `colors`
          const deleteColorQuery = 'DELETE FROM colors WHERE id = ?';
          db.query(deleteColorQuery, [colorId], (err) => {
            if (err) return res.status(500).send('Error deleting color');
            res.status(200).send('Color and associated images deleted successfully');
          });
        });
      })
      .catch((error) => {
        console.error("Error deleting images from Cloudinary:", error);
        res.status(500).send("Error deleting images from Cloudinary");
      });
  });
};
