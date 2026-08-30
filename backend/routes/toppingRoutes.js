const express = require('express');
const router = express.Router();
const {
  getAllToppings,
  createTopping,
  updateTopping,
  deleteTopping,
  applyToppingsToFoods,
  removeToppingsFromFoods,
  updateFoodToppings,
  removeSingleToppingFromFood
} = require('../controllers/toppingController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/toppings', getAllToppings);

// Admin routes
router.post('/admin/toppings', authMiddleware, adminMiddleware, createTopping);
router.put('/admin/toppings/:id', authMiddleware, adminMiddleware, updateTopping);
router.delete('/admin/toppings/:id', authMiddleware, adminMiddleware, deleteTopping);
router.post('/admin/toppings/apply', authMiddleware, adminMiddleware, applyToppingsToFoods);
router.post('/admin/toppings/remove', authMiddleware, adminMiddleware, removeToppingsFromFoods);
router.put('/admin/toppings/food/:foodId', authMiddleware, adminMiddleware, updateFoodToppings);
router.delete('/admin/toppings/food/:foodId/:toppingId', authMiddleware, adminMiddleware, removeSingleToppingFromFood);

module.exports = router;

