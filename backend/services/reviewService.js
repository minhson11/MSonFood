const Review = require('../models/Review');
const Food = require('../models/Food');
const Order = require('../models/Order');

/**
 * Cập nhật rating và reviewCount của Food dựa trên visible reviews
 * Helper được dùng chung bởi nhiều operations
 */
const updateFoodRating = async (foodId) => {
  const visibleReviews = await Review.find({ food: foodId, isHidden: { $ne: true } });

  if (visibleReviews.length === 0) {
    await Food.findByIdAndUpdate(foodId, { rating: 0, reviewCount: 0 });
    return;
  }

  const totalRating = visibleReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = parseFloat((totalRating / visibleReviews.length).toFixed(1));

  await Food.findByIdAndUpdate(foodId, {
    rating: averageRating,
    reviewCount: visibleReviews.length,
  });
};

/**
 * Lấy reviews theo foodId (public — chỉ hiện visible)
 */
const getFoodReviews = async (foodId) => {
  const reviews = await Review.find({ food: foodId, isHidden: { $ne: true } })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 });

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : 0;

  return { reviews, averageRating };
};

/**
 * Tạo review
 */
const createReview = async ({ userId, food, rating, comment, orderId }) => {
  const foodItem = await Food.findById(food);
  if (!foodItem) {
    const err = new Error('Không tìm thấy món ăn');
    err.statusCode = 404;
    throw err;
  }

  const orderQuery = { user: userId, 'items.food': food, status: 'completed' };
  if (orderId) orderQuery._id = orderId;

  const completedOrder = await Order.findOne(orderQuery);
  if (!completedOrder) {
    const err = new Error('Bạn chỉ có thể đánh giá món ăn từ đơn hàng đã hoàn thành');
    err.statusCode = 400;
    throw err;
  }

  const existingReview = await Review.findOne({ user: userId, food, order: completedOrder._id });
  if (existingReview) {
    const err = new Error('Bạn đã đánh giá món ăn này trong đơn hàng này rồi.');
    err.statusCode = 400;
    err.data = existingReview;
    throw err;
  }

  const review = await Review.create({
    user: userId,
    food,
    rating,
    comment: comment || '',
    order: completedOrder._id,
  });

  await updateFoodRating(food);
  await review.populate('user', 'name avatar');
  await review.populate('food', 'name image');

  return review;
};

/**
 * Cập nhật review
 */
const updateReview = async ({ reviewId, userId, rating, comment }) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    const err = new Error('Không tìm thấy đánh giá');
    err.statusCode = 404;
    throw err;
  }
  if (review.user.toString() !== userId.toString()) {
    const err = new Error('Bạn không có quyền cập nhật đánh giá này');
    err.statusCode = 403;
    throw err;
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;
  await review.save();

  await updateFoodRating(review.food);
  await review.populate('user', 'name avatar');
  await review.populate('food', 'name image');

  return review;
};

/**
 * Xóa review (user hoặc admin)
 */
const deleteReview = async ({ reviewId, userId, isAdmin }) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    const err = new Error('Không tìm thấy đánh giá');
    err.statusCode = 404;
    throw err;
  }
  if (!isAdmin && review.user.toString() !== userId.toString()) {
    const err = new Error('Bạn không có quyền xóa đánh giá này');
    err.statusCode = 403;
    throw err;
  }

  const foodId = review.food;
  await review.deleteOne();
  await updateFoodRating(foodId);
};

/**
 * Lấy reviews của user hiện tại
 */
const getMyReviews = async (userId) => {
  return Review.find({ user: userId })
    .populate('food', 'name image price')
    .sort({ createdAt: -1 });
};

/**
 * Lấy reviews theo orderId (của user hiện tại)
 */
const getOrderReviews = async ({ userId, orderId }) => {
  return Review.find({ user: userId, order: orderId }).populate('food', 'name image');
};

/**
 * Lấy tất cả reviews (Admin)
 */
const getAllReviews = async ({ rating, foodId, page = 1, limit = 100 }) => {
  const query = {};
  if (rating) query.rating = parseInt(rating);
  if (foodId) query.food = foodId;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    Review.find(query)
      .populate('user', 'name email avatar')
      .populate('food', 'name image price rating')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(query),
  ]);

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : 0;

  return { reviews, averageRating, total, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) } };
};

/**
 * Lấy reviews theo foodId (Admin — bao gồm cả hidden)
 */
const adminGetFoodReviews = async ({ foodId, rating }) => {
  const query = { food: foodId };
  if (rating) query.rating = parseInt(rating);

  const reviews = await Review.find(query)
    .populate('user', 'name email avatar')
    .populate('food', 'name image price rating')
    .sort({ createdAt: -1 });

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? parseFloat((totalRating / reviews.length).toFixed(1)) : 0;

  return { reviews, averageRating };
};

/**
 * Toggle ẩn/hiện review (Admin)
 */
const toggleHideReview = async (reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    const err = new Error('Không tìm thấy đánh giá');
    err.statusCode = 404;
    throw err;
  }

  review.isHidden = !review.isHidden;
  await review.save();
  await updateFoodRating(review.food);

  return review;
};

/**
 * Review statistics (Admin)
 */
const getReviewStats = async () => {
  const stats = await Review.aggregate([
    {
      $group: {
        _id: '$food',
        count: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        hiddenCount: { $sum: { $cond: [{ $eq: ['$isHidden', true] }, 1, 0] } },
      },
    },
  ]);

  const statsMap = {};
  let totalReviews = 0;
  let totalRatingSum = 0;

  stats.forEach((s) => {
    if (s._id) {
      const avg = parseFloat((s.avgRating || 0).toFixed(1));
      statsMap[s._id.toString()] = { count: s.count, avgRating: avg, hiddenCount: s.hiddenCount || 0 };
      totalReviews += s.count;
      totalRatingSum += avg * s.count;
    }
  });

  const overallAvgRating = totalReviews > 0 ? parseFloat((totalRatingSum / totalReviews).toFixed(1)) : 0;
  return { byFood: statsMap, totalReviews, overallAvgRating };
};

/**
 * Đồng bộ rating tất cả foods từ reviews thực tế
 */
const syncAllFoodRatings = async () => {
  const foods = await Food.find({});
  for (const f of foods) {
    await updateFoodRating(f._id);
  }
};

module.exports = {
  getFoodReviews,
  createReview,
  updateReview,
  deleteReview,
  getMyReviews,
  getOrderReviews,
  getAllReviews,
  adminGetFoodReviews,
  toggleHideReview,
  getReviewStats,
  syncAllFoodRatings,
};
