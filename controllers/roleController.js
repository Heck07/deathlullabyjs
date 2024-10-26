const db = require('../config/database');

// Récupérer tous les rôles
exports.getAllRoles = (req, res) => {
  const query = 'SELECT * FROM roles';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des rôles :', err);
      return res.status(500).send('Erreur interne lors de la récupération des rôles.');
    }
    res.status(200).json(results);
  });
};

// Créer un nouveau rôle
exports.createRole = (req, res) => {
  const { role_name } = req.body;
  
  if (!role_name) {
    return res.status(400).send('Le nom du rôle est requis');
  }

  const query = 'INSERT INTO roles (role_name) VALUES (?)';
  db.query(query, [role_name], (err) => {
    if (err) {
      console.error('Erreur lors de la création du rôle :', err);
      return res.status(500).send('Erreur interne lors de la création du rôle.');
    }
    res.status(201).send('Rôle créé avec succès.');
  });
};

// Mettre à jour un rôle existant
exports.updateRole = (req, res) => {
  const roleId = req.params.id;
  const { role_name } = req.body;

  const query = 'UPDATE roles SET role_name = ? WHERE id = ?';
  db.query(query, [role_name, roleId], (err) => {
    if (err) {
      console.error('Erreur lors de la mise à jour du rôle :', err);
      return res.status(500).send('Erreur interne lors de la mise à jour du rôle.');
    }
    res.status(200).send('Rôle mis à jour avec succès.');
  });
};

// Supprimer un rôle
exports.deleteRole = (req, res) => {
  const roleId = req.params.id;

  const query = 'DELETE FROM roles WHERE id = ?';
  db.query(query, [roleId], (err) => {
    if (err) {
      console.error('Erreur lors de la suppression du rôle :', err);
      return res.status(500).send('Erreur interne lors de la suppression du rôle.');
    }
    res.status(200).send('Rôle supprimé avec succès.');
  });
};
