const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Créer une nouvelle commande
router.post('/create', orderController.createOrder);

module.exports = router;
