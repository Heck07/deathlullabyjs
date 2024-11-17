// productController.js
const db = require('../config/database');
const cloudinary = require('../config/cloudinaryConfig');


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

exports.getAllProducts = (req, res) => {
  const query = `
    SELECT 
      p.id AS product_id, 
      p.name AS product_name, 
      p.price, 
      c.id AS color_id, 
      c.color_name, 
      c.hex_code, 
      pi.image_url
    FROM 
      products p
    LEFT JOIN 
      colors c ON p.id = c.product_id
    LEFT JOIN 
      product_images pi ON c.id = pi.color_id;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des produits :', err);
      return res.status(500).send('Erreur interne.');
    }

    const products = results.reduce((acc, row) => {
      const {
        product_id, product_name, price, color_id, color_name, hex_code, image_url
      } = row;

      let product = acc.find(p => p.id === product_id);

      if (!product) {
        product = { 
          id: product_id, 
          name: product_name, 
          price, 
          colors: [] 
        };
        acc.push(product);
      }

      let color = product.colors.find(c => c.id === color_id);

      if (!color) {
        color = { id: color_id, name: color_name, hex: hex_code, images: [] };
        product.colors.push(color);
      }

      if (image_url) color.images.push(image_url);

      return acc;
    }, []);

    res.status(200).json(products);
  });
};

// Updated getAllProducts to include colors
exports.getAllProductsDetails = (req, res) => {
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
  const { name, price, categoryId, color_name, color_hex } = req.body;

  if (!name || !price || !categoryId) {
    return res.status(400).send("Les champs 'name', 'price' et 'categoryId' sont obligatoires.");
  }

  // Étape 1 : Insérer le produit
  const productQuery = 'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)';
  db.query(productQuery, [name, price, categoryId], (err, result) => {
    if (err) {
      console.error("Erreur lors de l'ajout du produit :", err);
      return res.status(500).send("Erreur lors de l'ajout du produit.");
    }

    const productId = result.insertId;

    // Étape 2 : Ajouter la couleur associée
    const colorQuery = 'INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)';
    db.query(colorQuery, [productId, color_name, color_hex], (err, colorResult) => {
      if (err) {
        console.error("Erreur lors de l'ajout de la couleur :", err);
        return res.status(500).send("Erreur lors de l'ajout de la couleur.");
      }

      const colorId = colorResult.insertId;

      // Étape 3 : Ajouter les images
      if (req.files && req.files.length > 0) {
        const imagePromises = req.files.map(file => {
          return new Promise((resolve, reject) => {
            console.log("Tentative d'upload de l'image sur Cloudinary : ", file.path);
            cloudinary.uploader.upload(file.path, (error, uploadResult) => {
              if (error) {
                console.error("Erreur lors de l'upload sur Cloudinary :", error);
                reject(error);
              } else {
                console.log("Upload réussi :", uploadResult.secure_url);
                const imageQuery = 'INSERT INTO product_images (product_id, image_url, color_id) VALUES (?, ?, ?)';
                db.query(imageQuery, [productId, uploadResult.secure_url, colorId], (err) => {
                  if (err) {
                    console.error("Erreur lors de l'insertion de l'image dans la base de données:", err);
                    reject(err);
                  } else {
                    resolve(uploadResult.secure_url);
                  }
                });
              }
            });
          });
        });

        Promise.all(imagePromises)
          .then((imageUrls) => {
            console.log("Images ajoutées avec succès :", imageUrls);
            res.status(201).json({ message: 'Produit, couleur et images ajoutés avec succès', images: imageUrls });
          })
          .catch((error) => {
            console.error("Erreur lors de l'ajout des images :", error);
            res.status(500).json({ error: "Erreur serveur lors de l'ajout des images" });
          });
      } else {
        res.status(201).json({ message: 'Produit et couleur ajoutés sans images' });
      }
    });
  });
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
