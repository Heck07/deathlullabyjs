const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Créer une nouvelle commande
router.post('/create', orderController.createOrder);

router.post('/create-payment-intent', orderController.createPaymentIntent);



module.exports = router;
