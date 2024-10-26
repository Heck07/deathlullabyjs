// generateTokens.js
const jwt = require('jsonwebtoken');

// Fonction pour générer un token JWT
function generateToken(payload) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET n'est pas défini. Veuillez le configurer dans vos variables d'environnement.");
  }

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h' // Le token expire après 24 heures
  });
}

module.exports = generateToken;
