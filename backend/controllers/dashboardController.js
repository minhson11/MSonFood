const Order = require('../models/Order');
const User = require('../models/User');
const Food = require('../models/Food');
const Category = require('../models/Category');

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();
    const totalFoods = await Food.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Get revenue statistics
    const revenueStats = await Order.aggregate([
      {
        $match: {
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          avgOrderValue: { $avg: '$totalPrice' }
        }
      }
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const avgOrderValue = revenueStats[0]?.avgOrderValue || 0;

    // Get order status counts
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format order status counts
    const orderStats = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      shipping: 0,
      completed: 0,
      cancelled: 0
    };

    ordersByStatus.forEach(item => {
      orderStats[item._id] = item.count;
    });

    // Get recent orders (last 10)
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .populate('items.food', 'name image')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id user totalPrice status createdAt items');

    // Get top selling foods
    const topFoods = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.food',
          totalSold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'foods',
          localField: '_id',
          foreignField: '_id',
          as: 'foodDetails'
        }
      },
      { $unwind: '$foodDetails' },
      {
        $project: {
          _id: 1,
          name: '$foodDetails.name',
          image: '$foodDetails.image',
          totalSold: 1,
          revenue: 1
        }
      }
    ]);

    // Get monthly revenue (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalPrice' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });

    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Get low stock foods
    const lowStockFoods = await Food.find({ stock: { $lt: 10 }, isAvailable: true })
      .select('name stock image')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrders,
          totalFoods,
          totalCategories,
          totalRevenue,
          avgOrderValue: Math.round(avgOrderValue),
          todayOrders,
          todayRevenue: todayRevenue[0]?.total || 0
        },
        orderStats,
        recentOrders,
        topFoods,
        monthlyRevenue,
        lowStockFoods
      }
    });
  } catch (error) {
    next(error);
  }
};
