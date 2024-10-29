// productController.js
const db = require('../config/database');
const cloudinary = require('../config/cloudinaryConfig'); // Import Cloudinary config

// Updated getProductById to include colors
exports.getProductById = (req, res) => {
  const productId = req.params.id;

  const productQuery = 'SELECT * FROM products WHERE id = ?';
  const colorsQuery = 'SELECT color_name, hex_code, image_url FROM colors WHERE product_id = ?';
  
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




// AJOUTER UN Produit avec couleurs et images associées
exports.addProduct = (req, res) => {
  const { name, price, categoryId, color_name, color_hex } = req.body;

  // Vérifie la présence des champs obligatoires
  if (!name || !price || !categoryId || !color_name || !color_hex || !req.files || req.files.length === 0) {
    return res.status(400).send("Tous les champs, y compris une couleur et des images, sont requis.");
  }

  // Insère le produit
  const productQuery = 'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)';
  db.query(productQuery, [name, price, categoryId], (err, result) => {
    if (err) {
      console.error("Erreur lors de l'ajout du produit :", err);
      return res.status(500).send("Erreur lors de l'ajout du produit.");
    }
    const productId = result.insertId;

    // Insère la couleur principale du produit
    const colorQuery = 'INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)';
    db.query(colorQuery, [productId, color_name, color_hex], (err, colorResult) => {
      if (err) {
        console.error("Erreur lors de l'ajout de la couleur :", err);
        return res.status(500).send("Erreur lors de l'ajout de la couleur.");
      }
      const colorId = colorResult.insertId;

      // Insère les images pour la couleur associée
      const imageQueries = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const imageQuery = 'INSERT INTO product_images (product_id, image_url, color_id) VALUES (?, ?, ?)';
          db.query(imageQuery, [productId, file.path, colorId], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });

      // Gère les promesses d'insertion d'images
      Promise.all(imageQueries)
        .then(() => res.status(201).send({
          id: productId,
          name,
          price,
          categoryId,
          colors: [{ color_name, color_hex, images: req.files.map(f => f.path) }]
        }))
        .catch(error => {
          console.error("Erreur lors de l'ajout d'images :", error);
          res.status(500).send("Erreur lors de l'ajout d'images.");
        });
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

// Fonction de téléchargement d'image sur Cloudinary
const uploadImage = (file) => {
  return cloudinary.uploader.upload(file.path);
};

// Fonction pour télécharger une image sur Cloudinary et obtenir l'URL
async function uploadImageToCloudinary(file) {
  try {
    const result = await cloudinary.uploader.upload(file.path);
    return result.secure_url; // Retourne l'URL sécurisée de l'image
  } catch (error) {
    console.error("Erreur lors de l'upload sur Cloudinary :", error);
    throw new Error("Erreur d'upload Cloudinary");
  }
}

exports.addColor = async (req, res) => {
  const { color_name, hex_code } = req.body;
  const productId = req.params.id;
  const images = req.files || []; // Fichiers d'image associés

  try {
    // Insère la couleur dans la table 'colors'
    const [colorResult] = await db.promise().query(
      'INSERT INTO colors (product_id, color_name, hex_code) VALUES (?, ?, ?)',
      [productId, color_name, hex_code]
    );
    const colorId = colorResult.insertId;

    // Upload des images sur Cloudinary et insertion dans 'product_images'
    const imageUploadPromises = images.map(async (file) => {
      const imageUrl = await uploadImageToCloudinary(file); // Obtient l'URL après upload
      await db.promise().query(
        'INSERT INTO product_images (product_id, color_id, image_url) VALUES (?, ?, ?)',
        [productId, colorId, imageUrl] // Insère avec l'URL Cloudinary
      );
    });

    await Promise.all(imageUploadPromises); // Attend que tous les uploads soient complétés
    res.status(201).json({ message: 'Couleur et images ajoutées avec succès' });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la couleur et des images :", error);
    res.status(500).json({ error: "Erreur serveur lors de l'ajout des images" });
  }
}