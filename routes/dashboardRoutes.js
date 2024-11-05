const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const dashboardController = require('../controllers/dashboardController');

// Route pour récupérer les statistiques globales
router.get('/stats', authenticateToken, roleMiddleware('admin'), dashboardController.getStats);

// Route pour récupérer les trois dernières commandes
router.get('/orders/recent', authenticateToken, roleMiddleware('admin'), dashboardController.getRecentOrders);

module.exports = router;
