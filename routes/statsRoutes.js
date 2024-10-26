const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Récupérer toutes les catégories
router.get('/', categoryController.getAllCategories);

// Ajouter une catégorie
router.post('/', roleMiddleware('admin'), categoryController.addCategory);

// Mettre à jour une catégorie
router.put('/:id', roleMiddleware('admin'), categoryController.updateCategory);

// Supprimer une catégorie
router.delete('/:id', roleMiddleware('admin'), categoryController.deleteCategory);

module.exports = router;
