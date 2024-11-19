const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const roleMiddleware = require('../middlewares/roleMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/', authMiddleware, roleMiddleware(['admin']), userController.getAllUsers);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), userController.updateUser);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);

router.get('/temp-users', userController.getTempUserEmail);

// Obtenir toutes les adresses d'un utilisateur
router.get('/address', authenticateToken, userController.getUserAddresses);
// Ajouter ou mettre à jour une adresse
router.post('/address', authenticateToken, userController.saveUserAddress);

router.get('/me', authenticateToken, userController.getUserDetails);

router.put('/me/password', authenticateToken, userController.updateUserPassword);


module.exports = router;
