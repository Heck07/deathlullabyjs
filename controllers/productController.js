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


// Ajouter un nouveau produit
exports.addProduct = (req, res) => {
  const { name, price, categoryId } = req.body;
  const imageUrl = req.file ? req.file.path : null;

  // Vérifie que les champs nécessaires sont présents
  if (!name || !price || !categoryId || !imageUrl) {
    return res.status(400).send('Tous les champs, y compris l\'image, sont requis.');
  }

  // Insère le produit dans la table products
  const productQuery = 'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)';
  db.query(productQuery, [name, price, categoryId], (err, result) => {
    if (err) {
      return res.status(500).send('Erreur lors de l\'ajout du produit.');
    }

    const productId = result.insertId;

    // Insère l'image dans la table product_images avec l'ID du produit
    const imageQuery = 'INSERT INTO product_images (product_id, image_url) VALUES (?, ?)';
    db.query(imageQuery, [productId, imageUrl], (err) => {
      if (err) {
        return res.status(500).send('Erreur lors de l\'ajout de l\'image du produit.');
      }
      res.status(201).send({ id: productId, name, price, categoryId, imageUrl });
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
