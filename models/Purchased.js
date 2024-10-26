// models/purchasedModel.js
const db = require('../config/database');

// Récupérer tous les achats
exports.getAllPurchases = (callback) => {
  const query = 'SELECT * FROM purchases';
  db.query(query, (err, results) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, results);
  });
};

// Créer un achat
exports.createPurchase = (purchaseData, callback) => {
  const query = 'INSERT INTO purchases (user_id, product_id, quantity, total, date) VALUES (?, ?, ?, ?, ?)';
  const { user_id, product_id, quantity, total, date } = purchaseData;
  db.query(query, [user_id, product_id, quantity, total, date], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result.insertId);
  });
};

// Mettre à jour un achat
exports.updatePurchase = (id, purchaseData, callback) => {
  const query = 'UPDATE purchases SET quantity = ?, total = ?, date = ? WHERE id = ?';
  const { quantity, total, date } = purchaseData;
  db.query(query, [quantity, total, date, id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};

// Supprimer un achat
exports.deletePurchase = (id, callback) => {
  const query = 'DELETE FROM purchases WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, result);
  });
};
