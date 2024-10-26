const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionsController');
const roleMiddleware = require('../middlewares/roleMiddleware');

// Récupérer toutes les permissions
router.get('/', roleMiddleware('admin'), permissionController.getAllPermissions);

// Ajouter une permission
router.post('/', roleMiddleware('admin'), permissionController.addPermission);

// Mettre à jour une permission
router.put('/:id', roleMiddleware('admin'), permissionController.updatePermission);

// Supprimer une permission
router.delete('/:id', roleMiddleware('admin'), permissionController.deletePermission);

module.exports = router;
