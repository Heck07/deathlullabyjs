// roleMiddleware.js
const db = require('../config/database');

// Middleware pour vérifier le rôle de l'utilisateur
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).send('Accès refusé : utilisateur non authentifié.');
    }

    const userId = req.user.id;

    // Récupérer le rôle de l'utilisateur à partir de la base de données
    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Erreur lors de la vérification du rôle de l\'utilisateur :', err);
        return res.status(500).send('Erreur interne du serveur.');
      }

      if (results.length === 0) {
        return res.status(404).send('Utilisateur non trouvé.');
      }

      const userRole = results[0].role;

      // Vérifier si le rôle de l'utilisateur est autorisé à accéder à la route
      if (allowedRoles.includes(userRole)) {
        next(); // Autoriser l'accès
      } else {
        res.status(403).send('Accès refusé : vous n\'avez pas les permissions nécessaires.');
      }
    });
  };
};

module.exports = roleMiddleware;
