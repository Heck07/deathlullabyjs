const express = require('express');
const router = express.Router();
const purchasedController = require('../controllers/purchasedController');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Récupérer tous les achats
router.get('/', roleMiddleware('admin'), purchasedController.getAllPurchases);

// Ajouter un achat
router.post('/', roleMiddleware('admin'), purchasedController.addPurchase);

// Mettre à jour un achat
router.put('/:id', roleMiddleware('admin'), purchasedController.updatePurchase);

// Supprimer un achat
router.delete('/:id', roleMiddleware('admin'), purchasedController.deletePurchase);

module.exports = router;
