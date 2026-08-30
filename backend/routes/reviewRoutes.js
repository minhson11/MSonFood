const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/food/:foodId', reviewController.getFoodReviews);

// Customer routes (require authentication)
router.post('/', authMiddleware, reviewController.createReview);
router.get('/my-reviews', authMiddleware, reviewController.getMyReviews);
router.get('/order/:orderId', authMiddleware, reviewController.getOrderReviews);
router.put('/:id', authMiddleware, reviewController.updateReview);
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;
