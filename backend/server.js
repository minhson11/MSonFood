const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
connectDB();

const app = express();

// Middleware
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://msonfood.vercel.app'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`), false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MSon Food API is running'
  });
});

// Public Stats route (for About page & public overview)
app.get('/api/stats', async (req, res) => {
  try {
    const Order = require('./models/Order');
    const User = require('./models/User');
    const Food = require('./models/Food');
    const Review = require('./models/Review');

    const [totalOrders, totalUsers, totalFoods, reviewStats] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Food.countDocuments(),
      Review.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
    ]);

    const avgRating = reviewStats.length > 0 && reviewStats[0].avgRating
      ? Number(reviewStats[0].avgRating.toFixed(1))
      : 4.9;

    const totalReviews = reviewStats.length > 0 ? reviewStats[0].totalReviews : 0;

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalUsers,
        totalFoods,
        avgRating,
        totalReviews
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to MSon Food API'
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/foods', require('./routes/foodRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api', require('./routes/toppingRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy tuyến đường'
  });
});

// Error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
