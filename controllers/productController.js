// productController.js
const db = require('../config/database');

exports.getProductById = (req, res) => {
  const productId = req.params.id;

  const query = 'SELECT * FROM products WHERE id = ?';
  db.query(query, [productId], (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération du produit :', err);
      return res.status(500).send('Erreur interne lors de la récupération du produit.');
    }
    if (results.length === 0) {
      return res.status(404).send('Produit non trouvé.');
    }
    res.status(200).json(results[0]); // Envoie le premier résultat, puisque l'ID est unique
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


// Récupérer tous les produits
exports.getAllProducts = (req, res) => {
  const query = `
    SELECT p.id, p.name, p.price, p.category_id, pi.image_url
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des produits :', err);
      return res.status(500).send('Erreur interne lors de la récupération des produits.');
    }
    const products = results.reduce((acc, row) => {
      const { id, name, price, category_id, image_url } = row;
      let product = acc.find(p => p.id === id);

      if (!product) {
        product = { id, name, price, category_id, images: [] };
        acc.push(product);
      }
      if (image_url) product.images.push(image_url);
      return acc;
    }, []);
    res.status(200).json(products);
  });
};


// AJOUTER UN Produit
exports.addProduct = (req, res) => {
  const { name, price, categoryId } = req.body;

  // Vérifie que tous les champs obligatoires sont présents
  if (!name || !price || !categoryId || !req.files || req.files.length === 0) {
    return res.status(400).send("Tous les champs, y compris au moins une image, sont requis.");
  }

  // Insère le produit
  const productQuery = 'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)';
  db.query(productQuery, [name, price, categoryId], (err, result) => {
    if (err) {
      console.error("Erreur lors de l'ajout du produit :", err);
      return res.status(500).send("Erreur lors de l'ajout du produit.");
    }

    const productId = result.insertId;

    // Insère chaque image
    const imageQueries = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const imageQuery = 'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)';
        db.query(imageQuery, [productId, file.path], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });

    // Gère les promesses d'insertion d'images
    Promise.all(imageQueries)
      .then(() => res.status(201).send({ id: productId, name, price, categoryId, images: req.files.map(f => f.path) }))
      .catch(error => {
        console.error("Erreur lors de l'ajout d'images :", error);
        res.status(500).send("Erreur lors de l'ajout d'images.");
      });
  });
};


// Mettre à jour un produit
exports.updateProduct = (req, res) => {
  const productId = req.params.id;
  const { name, price, categoryId } = req.body;

  if (!name || !price || !categoryId) {
    return res.status(400).send('Tous les champs sont requis.');
  }

  const query = 'UPDATE products SET name = ?, price = ?, category_id = ? WHERE id = ?';
  db.query(query, [name, price, categoryId, productId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du produit :', err);
      return res.status(500).send('Erreur interne lors de la mise à jour du produit.');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Produit non trouvé.');
    }
    res.status(200).send('Produit mis à jour avec succès.');
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
