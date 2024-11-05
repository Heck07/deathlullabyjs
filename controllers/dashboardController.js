const db = require('../config/database');

// Fonction pour récupérer les statistiques globales
exports.getStats = async (req, res) => {
  try {
    // Récupérer le nombre de visites (hypothèse d'une table `visits` pour les visites)
    // Récupérer le nombre total de commandes
    const [orders] = await db.promise().query('SELECT COUNT(*) AS ordersCount FROM orders');

    // Récupérer le chiffre d'affaires total
    const [revenue] = await db.promise().query('SELECT SUM(order_total) AS totalRevenue FROM orders');

    res.status(200).json({
      ordersCount: orders[0].ordersCount || 0,
      totalRevenue: revenue[0].totalRevenue || 0
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
  }
};

// Fonction pour récupérer les trois dernières commandes
exports.getRecentOrders = async (req, res) => {
  try {
    // Récupérer les trois dernières commandes triées par date de création
    const [recentOrders] = await db.promise().query(`
      SELECT id, email, created_at, order_total 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 3
    `);

    res.status(200).json({ orders: recentOrders });
  } catch (error) {
    console.error("Erreur lors de la récupération des dernières commandes :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des dernières commandes" });
  }
};
