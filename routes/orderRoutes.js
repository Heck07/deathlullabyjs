const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Récupérer toutes les commandes
router.get('/', roleMiddleware('admin'), orderController.getAllOrders);

// Créer une nouvelle commande
router.post('/', orderController.createOrder);

// Mettre à jour une commande
router.put('/:id', roleMiddleware('admin'), orderController.updateOrder);

// Supprimer une commande
router.delete('/:id', roleMiddleware('admin'), orderController.deleteOrder);

module.exports = router;
