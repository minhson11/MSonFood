const Review = require('../models/Review');
const Food = require('../models/Food');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get reviews for a food
// @route   GET /api/reviews/food/:foodId
// @access  Public
exports.getFoodReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ food: req.params.foodId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating: parseFloat(averageRating),
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { food, rating, comment, orderId } = req.body;

    // Validate required fields
    if (!food || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID món ăn và đánh giá'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5'
      });
    }

    // Check if food exists
    const foodItem = await Food.findById(food);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    // Verify the order belongs to this user and is completed
    const orderQuery = {
      user: req.user._id,
      'items.food': food,
      status: 'completed'
    };
    if (orderId) orderQuery._id = orderId;

    const completedOrder = await Order.findOne(orderQuery);
    if (!completedOrder) {
      return res.status(400).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá món ăn từ đơn hàng đã hoàn thành'
      });
    }

    // Check if user has already reviewed this food in this order
    const existingReview = await Review.findOne({
      user: req.user._id,
      food,
      order: completedOrder._id
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá món ăn này trong đơn hàng này rồi.',
        data: existingReview
      });
    }

    // Create review
    const review = await Review.create({
      user: req.user._id,
      food,
      rating,
      comment: comment || '',
      order: completedOrder._id
    });

    // Update food rating
    await updateFoodRating(food);

    // Populate user info
    await review.populate('user', 'name avatar');
    await review.populate('food', 'name image');

    res.status(201).json({
      success: true,
      message: 'Đánh giá của bạn đã được gửi thành công!',
      data: review
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá món ăn này rồi.'
      });
    }
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật đánh giá này'
      });
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5'
      });
    }

    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Update food rating
    await updateFoodRating(review.food);

    // Populate
    await review.populate('user', 'name avatar');
    await review.populate('food', 'name image');

    res.status(200).json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Check ownership (or admin)
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa đánh giá này'
      });
    }

    const foodId = review.food;
    await review.deleteOne();

    // Update food rating
    await updateFoodRating(foodId);

    res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('food', 'name image price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews by user for a specific order
// @route   GET /api/reviews/order/:orderId
// @access  Private
exports.getOrderReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({
      user: req.user._id,
      order: req.params.orderId
    }).populate('food', 'name image');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Get all reviews (Admin)
// @route   GET /api/admin/reviews
// @access  Private/Admin
exports.getAllReviews = async (req, res, next) => {
  try {
    const { rating, foodId, page = 1, limit = 100 } = req.query;

    // Build query
    const query = {};
    if (rating) {
      query.rating = parseInt(rating);
    }
    if (foodId) {
      query.food = foodId;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get reviews
    const reviews = await Review.find(query)
      .populate('user', 'name email avatar')
      .populate('food', 'name image price rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count
    const total = await Review.countDocuments(query);

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      data: reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get review statistics (Admin)
// @route   GET /api/admin/reviews/stats
// @access  Private/Admin
exports.getReviewStats = async (req, res, next) => {
  try {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: '$food',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          hiddenCount: {
            $sum: { $cond: [{ $eq: ['$isHidden', true] }, 1, 0] }
          }
        }
      }
    ]);

    const statsMap = {};
    let totalReviews = 0;
    let totalRatingSum = 0;

    stats.forEach((s) => {
      if (s._id) {
        const avg = parseFloat((s.avgRating || 0).toFixed(1));
        statsMap[s._id.toString()] = {
          count: s.count,
          avgRating: avg,
          hiddenCount: s.hiddenCount || 0
        };
        totalReviews += s.count;
        totalRatingSum += avg * s.count;
      }
    });

    const overallAvgRating = totalReviews > 0 ? parseFloat((totalRatingSum / totalReviews).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        byFood: statsMap,
        totalReviews,
        overallAvgRating
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review (Admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
exports.adminDeleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    const foodId = review.food;
    await review.deleteOne();

    // Update food rating and reviewCount
    await updateFoodRating(foodId);

    res.status(200).json({
      success: true,
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle hide/show review (Admin)
// @route   PUT /api/admin/reviews/:id/toggle-hide
// @access  Private/Admin
exports.adminToggleHideReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    review.isHidden = !review.isHidden;
    await review.save();

    // Update food rating based on visible reviews
    await updateFoodRating(review.food);

    res.status(200).json({
      success: true,
      message: review.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiển thị đánh giá',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a food (Admin) - includes hidden reviews
// @route   GET /api/admin/reviews/food/:foodId
// @access  Private/Admin
exports.adminGetFoodReviews = async (req, res, next) => {
  try {
    const { rating } = req.query;

    const query = { food: req.params.foodId };
    if (rating) {
      query.rating = parseInt(rating);
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email avatar')
      .populate('food', 'name image price rating')
      .sort({ createdAt: -1 });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to update food rating and review count
async function updateFoodRating(foodId) {
  try {
    const visibleReviews = await Review.find({ food: foodId, isHidden: { $ne: true } });
    const allReviews = await Review.find({ food: foodId });

    if (visibleReviews.length === 0) {
      await Food.findByIdAndUpdate(foodId, { rating: 0, reviewCount: allReviews.length });
      return;
    }

    const totalRating = visibleReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = (totalRating / visibleReviews.length).toFixed(1);

    await Food.findByIdAndUpdate(foodId, {
      rating: parseFloat(averageRating),
      reviewCount: allReviews.length
    });
  } catch (error) {
    console.error('Error updating food rating:', error);
  }
}

// Sync all foods with real reviews in DB
exports.syncAllFoodRatings = async () => {
  try {
    const foods = await Food.find({});
    for (const f of foods) {
      await updateFoodRating(f._id);
    }
  } catch (err) {
    console.error('Error syncing food ratings:', err);
  }
};

// Run sync immediately on load to clean up any fake seed ratings
setTimeout(() => {
  exports.syncAllFoodRatings().catch(() => {});
}, 1000);
