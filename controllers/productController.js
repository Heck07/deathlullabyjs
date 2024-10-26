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

// Récupérer tous les produits
exports.getAllProducts = (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des produits :', err);
      return res.status(500).send('Erreur interne lors de la récupération des produits.');
    }
    res.status(200).json(results);
  });
};

// Ajouter un nouveau produit
exports.addProduct = (req, res) => {
  const { name, price, categoryId } = req.body;

  if (!name || !price || !categoryId) {
    return res.status(400).send('Tous les champs sont requis.');
  }

  const query = 'INSERT INTO products (name, price, category_id) VALUES (?, ?, ?)';
  db.query(query, [name, price, categoryId], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'ajout du produit :', err);
      return res.status(500).send('Erreur interne lors de l\'ajout du produit.');
    }
    res.status(201).send({ id: result.insertId, name, price, categoryId });
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
