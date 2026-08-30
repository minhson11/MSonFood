const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Dashboard routes
router.get('/dashboard/stats', dashboardController.getDashboardStats);

// User management routes
router.get('/users', userController.getAllUsers);
router.post('/users', userController.createUser);
router.get('/users/:id', userController.getUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);

// Order management routes
router.get('/orders', orderController.getAllOrders);
router.put('/orders/:id/status', orderController.updateOrderStatus);

// Coupon management routes
router.get('/coupons', couponController.getAllCoupons);

// Review management routes
router.get('/reviews', reviewController.getAllReviews);
router.delete('/reviews/:id', reviewController.adminDeleteReview);

module.exports = router;
