const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Customer routes (require authentication)
router.post('/', authMiddleware, orderController.createOrder);
router.get('/my-orders', authMiddleware, orderController.getMyOrders);
router.get('/:id', authMiddleware, orderController.getOrder);
router.put('/:id/cancel', authMiddleware, orderController.cancelOrder);
router.put('/:id/payment', authMiddleware, orderController.payOrder);
router.get('/:id/payment-status', authMiddleware, orderController.getPaymentStatus);

module.exports = router;
