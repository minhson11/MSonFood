const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/', foodController.getFoods);
router.get('/:id', foodController.getFood);

// Admin routes (require auth + admin)
router.post('/', authMiddleware, adminMiddleware, foodController.createFood);
router.put('/:id', authMiddleware, adminMiddleware, foodController.updateFood);
router.delete('/:id', authMiddleware, adminMiddleware, foodController.deleteFood);

module.exports = router;
