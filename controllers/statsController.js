const db = require('../config/database');

// Récupérer les statistiques globales
exports.getGlobalStats = (req, res) => {
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM orders) AS totalOrders,
      (SELECT SUM(total_amount) FROM orders) AS totalRevenue,
      (SELECT COUNT(*) FROM products) AS totalProducts
  `;

  db.query(statsQuery, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des statistiques globales :', err);
      return res.status(500).send('Erreur interne lors de la récupération des statistiques.');
    }
    if (results.length === 0) {
      return res.status(404).send('Aucune statistique trouvée.');
    }
    res.status(200).json(results[0]); // Retourner le premier (et unique) résultat
  });
};

// Récupérer les statistiques de commandes mensuelles
exports.getMonthlyOrderStats = (req, res) => {
  const query = `
    SELECT 
      MONTH(order_date) AS month,
      COUNT(*) AS totalOrders,
      SUM(total_amount) AS totalRevenue
    FROM orders
    GROUP BY MONTH(order_date)
    ORDER BY month
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des statistiques mensuelles des commandes :', err);
      return res.status(500).send('Erreur interne lors de la récupération des statistiques mensuelles des commandes.');
    }
    if (results.length === 0) {
      return res.status(404).send('Aucune statistique mensuelle trouvée.');
    }
    res.status(200).json(results);
  });
};

// Récupérer les statistiques des visites
exports.getVisitStats = (req, res) => {
  const query = `
    SELECT 
      date,
      visits
    FROM visits
    ORDER BY date DESC
    LIMIT 30
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Erreur lors de la récupération des statistiques de visites :', err);
      return res.status(500).send('Erreur interne lors de la récupération des statistiques de visites.');
    }
    if (results.length === 0) {
      return res.status(404).send('Aucune donnée de visite trouvée.');
    }
    res.status(200).json(results);
  });
};
