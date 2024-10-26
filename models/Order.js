// models/orderModel.js
const db = require('../config/database');

// Récupérer toutes les commandes
exports.getAllOrders = (callback) => {
  const query = 'SELECT * FROM orders';
  db.query(query, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};

// Créer une commande
exports.createOrder = (orderData, callback) => {
  const query = 'INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)';
  const { user_id, total, status } = orderData;
  db.query(query, [user_id, total, status], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result.insertId);
  });
};

// Mettre à jour une commande
exports.updateOrder = (id, orderData, callback) => {
  const query = 'UPDATE orders SET status = ? WHERE id = ?';
  const { status } = orderData;
  db.query(query, [status, id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

// Supprimer une commande
exports.deleteOrder = (id, callback) => {
  const query = 'DELETE FROM orders WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};
