const express = require('express');
const router = express.Router();
const paymentMethodsController = require('../controllers/paymentMethodsController');

// Créer un SetupIntent
router.post('/setup-intent', paymentMethodsController.createSetupIntent);

// Sauvegarder une méthode de paiement
router.post('/save', paymentMethodsController.savePaymentMethod);

// Récupérer les méthodes de paiement d'un utilisateur
router.get('/:userId', paymentMethodsController.getPaymentMethods);

// Supprimer une méthode de paiement
router.delete('/:paymentMethodId', paymentMethodsController.deletePaymentMethod);

module.exports = router;
