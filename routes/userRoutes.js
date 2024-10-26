const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const roleMiddleware = require('../middlewares/roleMiddleware');
const authenticateToken = require('../middlewares/authMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/', authMiddleware, roleMiddleware(['admin']), userController.getAllUsers);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), userController.updateUser);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), userController.deleteUser);


router.get('/me', authenticateToken, userController.getUserDetails);

router.put('/me/password', authenticateToken, userController.updateUserPassword);


module.exports = router;
