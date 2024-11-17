// productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const colorController = require('../controllers/colorController');
const sizeController = require('../controllers/sizeController');
const authenticateToken = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const upload = require('../config/uploadConfig'); // Importer le middleware Multer configuré

router.get('/:id', productController.getProductById);

// Récupérer tous les produits
router.get('/', productController.getAllProducts);
router.get('/details', productController.getAllProductsDetails);
router.get('/:id/images', productController.getProductImages);


// Ajouter un produit (accès réservé aux administrateurs)
router.post(
    '/',
    authenticateToken,
    roleMiddleware('admin'),
    upload.array('images', 10), // Gérer l'upload d'image
    productController.addProduct
  );
// Mettre à jour un produit (accès réservé aux administrateurs)
router.put(
  '/:id',
  authenticateToken,
  roleMiddleware('admin'), 
  upload.array('images', 10), 
  productController.updateProduct
);


// Supprimer un produit (accès réservé aux administrateurs)
router.delete('/:id', authenticateToken, roleMiddleware('admin'), productController.deleteProduct);

// Routes for managing colors
router.post('/:id/colors', authenticateToken, roleMiddleware('admin'), upload.array('images', 10), colorController.addColor);
router.get('/:id/colors', colorController.getColorsByProductId);
router.put('/colors/:colorId', authenticateToken, roleMiddleware('admin'),  colorController.updateColor);
router.delete('/colors/:colorId', authenticateToken, roleMiddleware('admin'), colorController.deleteColor);

// Routes for managing sizes
router.post('/:id/sizes', authenticateToken, roleMiddleware('admin'), sizeController.addSize);
router.get('/:id/sizes', sizeController.getSizesByProductId);
router.put('/sizes/:sizeId', authenticateToken, roleMiddleware('admin'), sizeController.updateSize);
router.delete('/sizes/:sizeId', authenticateToken, roleMiddleware('admin'), sizeController.deleteSize);


module.exports = router;
