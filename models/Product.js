// models/productModel.js
const db = require('../config/database');

// Récupérer tous les produits
exports.getAllProducts = (callback) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};

// Créer un produit
exports.createProduct = (productData, callback) => {
  const query = 'INSERT INTO products (name, price, description, category_id) VALUES (?, ?, ?, ?)';
  const { name, price, description, category_id } = productData;
  db.query(query, [name, price, description, category_id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result.insertId);
  });
};

// Mettre à jour un produit
exports.updateProduct = (id, productData, callback) => {
  const query = 'UPDATE products SET name = ?, price = ?, description = ?, category_id = ? WHERE id = ?';
  const { name, price, description, category_id } = productData;
  db.query(query, [name, price, description, category_id, id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

// Supprimer un produit
exports.deleteProduct = (id, callback) => {
  const query = 'DELETE FROM products WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};
