// authController.js
const db = require('../config/database'); // Importer la connexion à la base de données
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateTokens');

// Inscription d'un utilisateur
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).send('Tous les champs sont requis.');
    }

    // Vérifier si l'email existe déjà
    const [checkUser] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (checkUser.length > 0) {
      return res.status(400).send('Cet email est déjà utilisé.');
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer l'utilisateur dans la base de données
    const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    await db.promise().query(insertQuery, [username, email, hashedPassword]);

    res.status(201).send('Utilisateur créé avec succès.');
  } catch (err) {
    console.error('Erreur lors de la création de l\'utilisateur :', err);
    res.status(500).send('Erreur interne lors de la création de l\'utilisateur.');
  }
};

// Connexion d'un utilisateur
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send('Email et mot de passe sont requis.');
    }

    // Vérifier si l'utilisateur existe
    const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);
    if (results.length === 0) {
      return res.status(404).send('Utilisateur non trouvé.');
    }

    const user = results[0];
    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return res.status(401).send('Mot de passe incorrect.');
    }

    // Générer un token
    const token = generateToken({ id: user.id, role: user.role });

    res.status(200).send({ auth: true, token });
  } catch (err) {
    console.error('Erreur lors de la connexion de l\'utilisateur :', err);
    res.status(500).send('Erreur interne lors de la connexion.');
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id;

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