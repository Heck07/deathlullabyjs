// productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticateToken = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.get('/:id', productController.getProductById);

// Récupérer tous les produits
router.get('/', productController.getAllProducts);

// Ajouter un produit (accès réservé aux administrateurs)
router.post('/', authenticateToken, roleMiddleware('admin'), productController.addProduct);

// Mettre à jour un produit (accès réservé aux administrateurs)
router.put('/:id', authenticateToken, roleMiddleware('admin'), productController.updateProduct);

// Supprimer un produit (accès réservé aux administrateurs)
router.delete('/:id', authenticateToken, roleMiddleware('admin'), productController.deleteProduct);

module.exports = router;
