// purchasedController.js
const db = require('../config/database');

// Récupérer tous les achats
exports.getAllPurchases = (req, res) => {
  const query = 'SELECT * FROM purchased';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des achats :', err);
      return res.status(500).send('Erreur interne lors de la récupération des achats.');
    }
    res.status(200).json(results);
  });
};

// Ajouter un achat
exports.addPurchase = (req, res) => {
  const { userId, productId, quantity, totalAmount, purchaseDate } = req.body;

  if (!userId || !productId || !quantity || !totalAmount || !purchaseDate) {
    return res.status(400).send('Tous les champs sont requis.');
  }

  const query = 'INSERT INTO purchased (user_id, product_id, quantity, total_amount, purchase_date) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [userId, productId, quantity, totalAmount, purchaseDate], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'ajout de l\'achat :', err);
      return res.status(500).send('Erreur interne lors de l\'ajout de l\'achat.');
    }
    res.status(201).send('Achat ajouté avec succès.' + result);
  });
};

// Mettre à jour un achat
exports.updatePurchase = (req, res) => {
  const purchaseId = req.params.id;
  const { quantity, totalAmount } = req.body;

  if (!quantity || !totalAmount) {
    return res.status(400).send('Tous les champs sont requis pour la mise à jour');
  }

  const query = 'UPDATE purchased SET quantity = ?, total_amount = ? WHERE id = ?';
  db.query(query, [quantity, totalAmount, purchaseId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de l\'achat :', err);
      return res.status(500).send('Erreur interne lors de la mise à jour de l\'achat.');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Achat non trouvé.');
    }

    res.status(200).send('Achat mis à jour avec succès.');
  });
};

// Supprimer un achat
exports.deletePurchase = (req, res) => {
  const purchaseId = req.params.id;

  const query = 'DELETE FROM purchased WHERE id = ?';
  db.query(query, [purchaseId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de l\'achat :', err);
      return res.status(500).send('Erreur interne lors de la suppression de l\'achat.');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Achat non trouvé.');
    }

    res.status(200).send('Achat supprimé avec succès.');
  });
};
