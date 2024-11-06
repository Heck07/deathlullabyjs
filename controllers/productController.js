// productController.js
const db = require('../config/database');

// Updated getProductById to include colors
exports.getProductById = (req, res) => {
  const productId = req.params.id;

  const productQuery = 'SELECT * FROM products WHERE id = ?';
  const colorsQuery = 'SELECT color_name, hex_code FROM colors WHERE product_id = ?';
  
  db.query(productQuery, [productId], (err, productResults) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err);
      return res.status(500).send('Erreur interne lors de la récupération du produit.');
    }
    if (productResults.length === 0) {
      return res.status(404).send('Produit non trouvé.');
    }

    db.query(colorsQuery, [productId], (err, colorResults) => {
      if (err) {
        console.error('Erreur lors de la récupération des couleurs :', err);
        return res.status(500).send('Erreur interne lors de la récupération des couleurs.');
      }

      const product = {
        ...productResults[0],
        colors: colorResults, // Add colors to the product data
      };
      res.status(200).json(product);
    });
  });
};


exports.getProductImages = (req, res) => {
  const productId = req.params.id;
  const query = 'SELECT image_url FROM product_images WHERE product_id = ?';

  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des images :', err);
      return res.status(500).send('Erreur interne lors de la récupération des images.');
    }
    res.status(200).json(results.map(row => row.image_url));
  });
};


// Updated getAllProducts to include colors
exports.getAllProducts = (req, res) => {
  const productsQuery = `
    SELECT p.id, p.name, p.price, p.category_id, pi.image_url
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
  `;

  const colorsQuery = `
    SELECT c.product_id, c.color_name, c.hex_code, pi.image_url
    FROM colors c
    LEFT JOIN product_images pi ON c.image_id = pi.id
  `;

  db.query(productsQuery, (err, productResults) => {
    if (err) {
      console.error('Erreur lors de la récupération des produits :', err);
      return res.status(500).send('Erreur interne lors de la récupération des produits.');
    }

    db.query(colorsQuery, (err, colorResults) => {
      if (err) {
        console.error('Erreur lors de la récupération des couleurs :', err);
        return res.status(500).send('Erreur interne lors de la récupération des couleurs.');
      }

      const products = productResults.reduce((acc, row) => {
        const { id, name, price, category_id, image_url } = row;
        let product = acc.find(p => p.id === id);

        if (!product) {
          product = { id, name, price, category_id, images: [], colors: [] };
          acc.push(product);
        }

        if (image_url) product.images.push(image_url);
        
        const colorsForProduct = colorResults
          .filter(color => color.product_id === id)
          .map(({ color_name, hex_code, image_url }) => ({ color_name, hex_code, image_url }));
        
        product.colors = colorsForProduct;

        return acc;
      }, []);
      
      res.status(200).json(products);
    });
  });
};




// AJOUTER UN Produit
exports.addProduct = (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");  // Utilisez "*" ou spécifiez votre origine
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  const { name, price, categoryId, color_name, color_hex } = req.body;
  const images = req.files || [];

  // Vérifie les champs obligatoires
  if (!name || !price || !categoryId || images.length === 0) {
    return res.status(400).send("Tous les champs, y compris au moins une image, sont requis.");
  }

  // Insère le produit
  db.query(
    'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)',
    [name, price, categoryId],
    (err, productResult) => {
      if (err) {
        console.error("Erreur lors de l'ajout du produit :", err);
        return res.status(500).send("Erreur lors de l'ajout du produit.");
      }

      const productId = productResult.insertId;

      // Insère la couleur liée au produit
      db.query(
        'INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)',
        [productId, color_name, color_hex],
        (err, colorResult) => {
          if (err) {
            console.error("Erreur lors de l'ajout de la couleur :", err);
            return res.status(500).send("Erreur lors de l'ajout de la couleur.");
          }

          const colorId = colorResult.insertId;

          // Télécharge et insère chaque image
          const imageUrls = [];
          let imageCount = 0;

          images.forEach((file) => {
            cloudinary.uploader.upload(file.path, (error, result) => {
              if (error) {
                console.error("Erreur lors du téléchargement sur Cloudinary :", error);
                if (imageCount === images.length - 1) {
                  return res.status(500).json({ error: "Erreur lors du téléchargement des images." });
                }
              } else {
                // Insère chaque URL dans la base de données
                db.query(
                  'INSERT INTO product_images (product_id, image_url, color_id) VALUES (?, ?, ?)',
                  [productId, result.secure_url, colorId],
                  (err) => {
                    if (err) {
                      console.error("Erreur lors de l'insertion de l'image :", err);
                      if (imageCount === images.length - 1) {
                        return res.status(500).json({ error: "Erreur lors de l'insertion des images." });
                      }
                    } else {
                      imageUrls.push(result.secure_url);
                      imageCount++;
                      if (imageCount === images.length) {
                        res.status(201).json({
                          message: "Produit, couleur et images ajoutés avec succès",
                          product: {
                            id: productId,
                            name,
                            price,
                            categoryId,
                            color: { id: colorId, color_name, hex_code },
                            images: imageUrls,
                          },
                        });
                      }
                    }
                  }
                );
              }
            });
          });
        }
      );
    }
  );
};

// Mettre a jour un produit
exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  const { name, price, categoryId } = req.body;

  if (!name || !price || !categoryId) {
    return res.status(400).send("Tous les champs sont requis.");
  }

  const updateQuery = 'UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?';
  db.query(updateQuery, [name, price, categoryId, productId], (err) => {
    if (err) {
      return res.status(500).send("Erreur lors de la mise à jour du produit.");
    }

    if (req.files && req.files.length > 0) {
      const imageQueries = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const imageQuery = 'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)';
          db.query(imageQuery, [productId, file.path], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });

      Promise.all(imageQueries)
        .then(() => res.status(200).send("Produit mis à jour avec succès."))
        .catch(() => res.status(500).send("Erreur lors de l'ajout des nouvelles images."));
    } else {
      res.status(200).send("Produit mis à jour avec succès.");
    }
  });
};


// Supprimer un produit
exports.deleteProduct = (req, res) => {
  const productId = req.params.id;

  const query = 'DELETE FROM products WHERE id = ?';
  db.query(query, [productId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression du produit :', err);
      return res.status(500).send('Erreur interne lors de la suppression du produit.');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Produit non trouvé.');
    }
    res.status(200).send('Produit supprimé avec succès.');
  });
};
