// models/categoryModel.js
const db = require('../config/database');

// Récupérer toutes les catégories
exports.getAllCategories = (callback) => {
  const query = 'SELECT * FROM categories';
  db.query(query, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};

// Créer une catégorie
exports.createCategory = (categoryData, callback) => {
  const query = 'INSERT INTO categories (name, description) VALUES (?, ?)';
  const { name, description } = categoryData;
  db.query(query, [name, description], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result.insertId);
  });
};

// Mettre à jour une catégorie
exports.updateCategory = (id, categoryData, callback) => {
  const query = 'UPDATE categories SET name = ?, description = ? WHERE id = ?';
  const { name, description } = categoryData;
  db.query(query, [name, description, id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

// Supprimer une catégorie
exports.deleteCategory = (id, callback) => {
  const query = 'DELETE FROM categories WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};
