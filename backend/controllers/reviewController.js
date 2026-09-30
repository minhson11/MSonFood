const reviewService = require('../services/reviewService');

// @desc    Get reviews for a food
// @route   GET /api/reviews/food/:foodId
// @access  Public
exports.getFoodReviews = async (req, res, next) => {
  try {
    const { reviews, averageRating } = await reviewService.getFoodReviews(req.params.foodId);

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      data: reviews,
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

    if (!food || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID món ăn và đánh giá',
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5',
      });
    }

    const review = await reviewService.createReview({
      userId: req.user._id,
      food,
      rating,
      comment,
      orderId,
    });

    res.status(201).json({
      success: true,
      message: 'Đánh giá của bạn đã được gửi thành công!',
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá món ăn này rồi.' });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        ...(error.data && { data: error.data }),
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

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5' });
    }

    const review = await reviewService.updateReview({
      reviewId: req.params.id,
      userId: req.user._id,
      rating,
      comment,
    });

    res.status(200).json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: review,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview({
      reviewId: req.params.id,
      userId: req.user._id,
      isAdmin: req.user.role === 'admin',
    });

    res.status(200).json({ success: true, message: 'Xóa đánh giá thành công' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get my reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getMyReviews(req.user._id);

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
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
    const reviews = await reviewService.getOrderReviews({
      userId: req.user._id,
      orderId: req.params.orderId,
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
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
    const { rating, foodId, page, limit } = req.query;
    const { reviews, averageRating, total, pagination } = await reviewService.getAllReviews({
      rating,
      foodId,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      data: reviews,
      pagination,
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
    const data = await reviewService.getReviewStats();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a food (Admin) — includes hidden
// @route   GET /api/admin/reviews/food/:foodId
// @access  Private/Admin
exports.adminGetFoodReviews = async (req, res, next) => {
  try {
    const { rating } = req.query;
    const { reviews, averageRating } = await reviewService.adminGetFoodReviews({
      foodId: req.params.foodId,
      rating,
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      data: reviews,
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
    const review = await reviewService.toggleHideReview(req.params.id);

    res.status(200).json({
      success: true,
      message: review.isHidden ? 'Đã ẩn đánh giá' : 'Đã hiển thị đánh giá',
      data: review,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete review (Admin)
// @route   DELETE /api/admin/reviews/:id
// @access  Private/Admin
exports.adminDeleteReview = async (req, res, next) => {
  try {
    await reviewService.deleteReview({
      reviewId: req.params.id,
      userId: req.user._id,
      isAdmin: true,
    });

    res.status(200).json({ success: true, message: 'Xóa đánh giá thành công' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// Sync all food ratings on module load
exports.syncAllFoodRatings = reviewService.syncAllFoodRatings;

setTimeout(() => {
  reviewService.syncAllFoodRatings().catch(() => {});
}, 1000);
