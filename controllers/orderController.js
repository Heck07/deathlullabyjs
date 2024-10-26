// orderController.js
const db = require('../config/database');

// Récupérer toutes les commandes
exports.getAllOrders = (req, res) => {
  const query = 'SELECT * FROM orders';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des commandes :', err);
      return res.status(500).send('Erreur interne lors de la récupération des commandes.');
    }
    res.status(200).json(results);
  });
};

// Créer une nouvelle commande
exports.createOrder = (req, res) => {
  const { clientId, total, status } = req.body;
  const query = 'INSERT INTO orders (client_id, total, status) VALUES (?, ?, ?)';
  db.query(query, [clientId, total, status], (err, result) => {
    if (err) {
      console.error('Erreur lors de la création de la commande :', err);
      return res.status(500).send('Erreur interne lors de la création de la commande.');
    }
    res.status(201).send('Commande créée avec succès.' + result);
  });
};

// Mettre à jour une commande
exports.updateOrder = (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;
  const query = 'UPDATE orders SET status = ? WHERE id = ?';
  db.query(query, [status, orderId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de la commande :', err);
      return res.status(500).send('Erreur interne lors de la mise à jour de la commande.');
    }
    res.status(200).send('Commande mise à jour avec succès.'+ result);
  });
};

// Supprimer une commande
exports.deleteOrder = (req, res) => {
  const orderId = req.params.id;
  const query = 'DELETE FROM orders WHERE id = ?';
  db.query(query, [orderId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de la commande :', err);
      return res.status(500).send('Erreur interne lors de la suppression de la commande.');
    }
    res.status(200).send('Commande supprimée avec succès.'+ result);
  });
};
