// models/userModel.js
const db = require('../config/database');

// Récupérer tous les utilisateurs
exports.getAllUsers = (callback) => {
  const query = 'SELECT * FROM users';
  db.query(query, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};

// Récupérer un utilisateur par son ID
exports.getUserById = (id, callback) => {
  const query = 'SELECT * FROM users WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results[0]);
  });
};

// Créer un nouvel utilisateur
exports.createUser = (userData, callback) => {
  const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
  const { username, email, password, role } = userData;
  db.query(query, [username, email, password, role], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result.insertId);
  });
};

// Mettre à jour un utilisateur
exports.updateUser = (id, userData, callback) => {
  const query = 'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?';
  const { username, email, role } = userData;
  db.query(query, [username, email, role, id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

// Supprimer un utilisateur
exports.deleteUser = (id, callback) => {
  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};
