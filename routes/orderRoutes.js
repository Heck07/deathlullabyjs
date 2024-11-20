const express = require('express');
const router = express.Router();
const authenticateToken = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const orderController = require('../controllers/orderController');

// Créer une nouvelle commande
router.post('/create', orderController.createOrder);

router.post('/create-payment-intent', orderController.createPaymentIntent);

router.get('/orders', authenticateToken, roleMiddleware('admin'), orderController.getAllOrders);

router.get('/orders/:id', authenticateToken, roleMiddleware('admin'), orderController.getOrderDetails);

router.get('/orders/:id/items', authenticateToken, roleMiddleware('admin'), orderController.getOrderItems);

router.get('/userorder', authenticateToken, orderController.getUserOrders);

module.exports = router;
