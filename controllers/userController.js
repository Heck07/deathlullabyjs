const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Récupérer tous les utilisateurs
exports.getAllUsers = (req, res) => {
  const query = 'SELECT * FROM users';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des utilisateurs :', err);
      return res.status(500).send('Erreur interne lors de la récupération des utilisateurs.');
    }
    if (results.length === 0) {
      return res.status(404).send('Aucun utilisateur trouvé.');
    }
    res.status(200).json(results);
  });
};

// Mettre à jour les informations d'un utilisateur
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { role } = req.body;

    // Vérifiez si le rôle est fourni et est une valeur valide
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).send('Rôle invalide.');
    }

    // Mettre à jour l'utilisateur
    const [result] = await db.promise().query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).send('Utilisateur non trouvé.');
    }

    res.status(200).send('Utilisateur mis à jour avec succès.');
  } catch (err) {
    console.error("Erreur lors de la mise à jour de l'utilisateur :", err);
    res.status(500).send('Erreur interne lors de la mise à jour de l\'utilisateur.');
  }
};

// Supprimer un utilisateur
exports.deleteUser = (req, res) => {
  const userId = req.params.id;

  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error('Erreur lors de la suppression de l\'utilisateur :', err);
      return res.status(500).send('Erreur interne lors de la suppression de l\'utilisateur.');
    }
    if (result.affectedRows === 0) {
      return res.status(404).send('Utilisateur non trouvé.');
    }
    res.status(200).send('Utilisateur supprimé avec succès.');
  });
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id; // Utiliser l'ID stocké par le middleware `authenticateToken`

    const [results] = await db.promise().query('SELECT * FROM users WHERE id = ?', [userId]);

    if (results.length === 0) {
      return res.status(404).send('Utilisateur non trouvé.');
    }

    const user = results[0];
    delete user.password; // Supprimer le mot de passe avant de renvoyer les données

    res.status(200).json(user);
  } catch (err) {
    console.error('Erreur lors de la récupération des informations utilisateur :', err);
    res.status(500).send('Erreur interne lors de la récupération des informations utilisateur.');
  }
};


// Mise à jour du mot de passe de l'utilisateur
exports.updateUserPassword = async (req, res) => {
  try {
    const userId = req.user.id; // L'utilisateur est extrait du token JWT
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).send('Le nouveau mot de passe est requis.');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe dans la base de données
    const updateQuery = 'UPDATE users SET password = ? WHERE id = ?';
    await db.promise().query(updateQuery, [hashedPassword, userId]);

    res.status(200).send('Mot de passe mis à jour avec succès.');
  } catch (err) {
    console.error('Erreur lors de la mise à jour du mot de passe :', err);
    res.status(500).send('Erreur interne lors de la mise à jour du mot de passe.');
  }
};

