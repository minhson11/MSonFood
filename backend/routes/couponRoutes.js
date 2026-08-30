const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Public routes
router.get('/', couponController.getCoupons);

// Customer routes (require authentication)
router.post('/apply', authMiddleware, couponController.applyCoupon);

// Admin routes (require auth + admin)
router.get('/:id', authMiddleware, adminMiddleware, couponController.getCoupon);
router.post('/', authMiddleware, adminMiddleware, couponController.createCoupon);
router.put('/:id', authMiddleware, adminMiddleware, couponController.updateCoupon);
router.delete('/:id', authMiddleware, adminMiddleware, couponController.deleteCoupon);

module.exports = router;
