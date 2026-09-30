const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// Public Webhook route for SePay
router.post('/webhook', paymentController.handleSePayWebhook);

// Development simulator route (automatically rejected if NODE_ENV === 'production')
router.post('/test/simulate-success', paymentController.simulateSuccessDev);

module.exports = router;
