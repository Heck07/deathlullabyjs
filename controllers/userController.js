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

exports.getTempUserEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const [rows] = await db.promise().query('SELECT email FROM temp_users WHERE signupToken = ?', [token]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Token invalide ou expiré.' });
    }

    const email = rows[0].email;
    res.status(200).json({ email });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email:', error);
    res.status(500).json({ message: 'Erreur interne lors de la récupération de l\'email.' });
  }
};


// Obtenir les adresses d'un utilisateur
exports.getUserAddresses = async (req, res) => {
  const userId = req.user.id; // Supposant que l'authMiddleware ajoute `req.user`

  try {
    const [addresses] = await db.promise().query(
      `SELECT id, address_type, first_name, last_name, street, postal_code, city, country 
       FROM user_addresses 
       WHERE user_id = ?`,
      [userId]
    );

    res.status(200).json(addresses);
  } catch (error) {
    console.error('Erreur lors de la récupération des adresses utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne.' });
  }
};

// Ajouter ou mettre à jour une adresse d'utilisateur
exports.saveUserAddress = async (req, res) => {
  const userId = req.user.id; // Supposant que l'authMiddleware ajoute `req.user`
  const { address_type, first_name, last_name, street, postal_code, city, country } = req.body;

  if (!address_type || !first_name || !last_name || !street || !postal_code || !city || !country) {
    return res.status(400).json({ message: 'Tous les champs sont requis.' });
  }

  const payload = {
    address_type: addressType,
    street: address.rue,
    postal_code: address.codePostal,
    city: address.ville,
    country: address.pays || "France", // Exemple, si le champ `pays` est manquant
    first_name: address.nom,
    last_name: address.prenom,
  };

  console.log("Payload envoyé :", payload);
  
  try {
    // Vérifiez si une adresse du même type existe déjà
    const [existingAddress] = await db.promise().query(
      `SELECT id FROM user_addresses WHERE user_id = ? AND address_type = ?`,
      [userId, address_type]
    );

    if (existingAddress.length > 0) {
      // Mettre à jour l'adresse existante
      await db.promise().query(
        `UPDATE user_addresses 
         SET first_name = ?, last_name = ?, street = ?, postal_code = ?, city = ?, country = ?
         WHERE user_id = ? AND address_type = ?`,
        [first_name, last_name, street, postal_code, city, country, userId, address_type]
      );

      return res.status(200).json({ message: 'Adresse mise à jour avec succès.' });
    }

    // Ajouter une nouvelle adresse
    await db.promise().query(
      `INSERT INTO user_addresses (user_id, address_type, first_name, last_name, street, postal_code, city, country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, address_type, first_name, last_name, street, postal_code, city, country]
    );

    res.status(201).json({ message: 'Adresse ajoutée avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'adresse utilisateur:', error);
    res.status(500).json({ message: 'Erreur interne.' });
  }
};