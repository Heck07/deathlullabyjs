// permissionsController.js
const db = require('../config/database');

// Récupérer toutes les permissions
exports.getAllPermissions = (req, res) => {
  const query = 'SELECT * FROM permissions';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des permissions :', err);
      return res.status(500).send('Erreur interne lors de la récupération des permissions.');
    }
    res.status(200).json(results);
  });
};

// Ajouter une permission
exports.addPermission = (req, res) => {
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).send('Tous les champs sont requis.');
  }

  const query = 'INSERT INTO permissions (name, description) VALUES (?, ?)';
  db.query(query, [name, description], (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'ajout de la permission :', err);
      return res.status(500).send('Erreur interne lors de l\'ajout de la permission.');
    }
    res.status(201).send('Permission ajoutée avec succès.' + result);
  });
};

// Mettre à jour une permission
exports.updatePermission = (req, res) => {
  const permissionId = req.params.id;
  const { name, description } = req.body;

  if (!name || !description) {
    return res.status(400).send('Tous les champs sont requis pour la mise à jour.');
  }

  const query = 'UPDATE permissions SET name = ?, description = ? WHERE id = ?';
  db.query(query, [name, description, permissionId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la mise à jour de la permission :', err);
      return res.status(500).send('Erreur interne lors de la mise à jour de la permission.');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Permission non trouvée.');
    }

    res.status(200).send('Permission mise à jour avec succès.');
  });
};

// Supprimer une permission
exports.deletePermission = (req, res) => {
  const permissionId = req.params.id;

  const query = 'DELETE FROM permissions WHERE id = ?';
  db.query(query, [permissionId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de la permission :', err);
      return res.status(500).send('Erreur interne lors de la suppression de la permission.');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Permission non trouvée.');
    }

    res.status(200).send('Permission supprimée avec succès.');
  });
};
