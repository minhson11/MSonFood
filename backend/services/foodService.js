const Food = require('../models/Food');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Order = require('../models/Order');

/**
 * Lấy danh sách món ăn với filter/sort/pagination
 */
const getFoods = async ({ search, category, sort, page = 1, limit = 12 }) => {
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  if (category) query.category = category;

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating_desc: { rating: -1 },
    rating_asc: { rating: 1 },
    popular: { soldCount: -1, rating: -1 },
    sold_desc: { soldCount: -1, rating: -1 },
  };
  const sortOptions = sortMap[sort] || { createdAt: -1 };

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [foods, total] = await Promise.all([
    Food.find(query)
      .populate('category', 'name image')
      .populate('toppings', 'name price description isActive')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
    Food.countDocuments(query),
  ]);

  return {
    foods,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

/**
 * Lấy 1 món ăn theo ID
 */
const getFoodById = async (id) => {
  const food = await Food.findById(id)
    .populate('category', 'name image')
    .populate('toppings', 'name price description isActive');

  if (!food) {
    const err = new Error('Không tìm thấy món ăn');
    err.statusCode = 404;
    throw err;
  }
  return food;
};

/**
 * Tạo món ăn mới
 */
const createFood = async ({ name, description, price, image, category, stock, isAvailable, ...rest }) => {
  const categoryExists = await Category.findById(category);
  if (!categoryExists) {
    const err = new Error('Không tìm thấy danh mục');
    err.statusCode = 404;
    throw err;
  }

  const food = await Food.create({
    name,
    description,
    price,
    image: image || '',
    category,
    stock: stock || 0,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    ...rest,
  });

  await food.populate('category', 'name image');
  return food;
};

/**
 * Cập nhật món ăn
 */
const updateFood = async (id, { name, description, price, image, category, stock, isAvailable, ...rest }) => {
  const food = await Food.findById(id);
  if (!food) {
    const err = new Error('Không tìm thấy món ăn');
    err.statusCode = 404;
    throw err;
  }

  if (category) {
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      const err = new Error('Không tìm thấy danh mục');
      err.statusCode = 404;
      throw err;
    }
    food.category = category;
  }

  if (name) food.name = name;
  if (description) food.description = description;
  if (price !== undefined) food.price = price;
  if (image !== undefined) food.image = image;
  if (stock !== undefined) food.stock = stock;
  if (isAvailable !== undefined) food.isAvailable = isAvailable;

  // Merge extra fields (variants, sizes, etc.)
  Object.keys(rest).forEach((key) => {
    if (rest[key] !== undefined) food[key] = rest[key];
  });

  await food.save();
  await food.populate('category', 'name image');
  return food;
};

/**
 * Xóa món ăn và reviews liên quan
 */
const deleteFood = async (id) => {
  const food = await Food.findById(id);
  if (!food) {
    const err = new Error('Không tìm thấy món ăn');
    err.statusCode = 404;
    throw err;
  }

  await Review.deleteMany({ food: food._id });
  await food.deleteOne();
};

/**
 * Lấy món ăn nổi bật (theo soldCount)
 */
const getFeaturedFoods = async (limit = 4) => {
  return Food.find({ isAvailable: true })
    .populate('category', 'name image')
    .populate('toppings', 'name price description isActive')
    .sort({ soldCount: -1, rating: -1, createdAt: -1 })
    .limit(parseInt(limit));
};

/**
 * Đồng bộ soldCount từ orders thực tế
 */
const syncAllFoodSales = async () => {
  const sales = await Order.aggregate([
    { $match: { status: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    { $group: { _id: '$items.food', totalSold: { $sum: '$items.quantity' } } },
  ]);

  const salesMap = {};
  sales.forEach((s) => { if (s._id) salesMap[s._id.toString()] = s.totalSold; });

  const allFoods = await Food.find({});
  for (const food of allFoods) {
    const realSold = salesMap[food._id.toString()] || 0;
    if (food.soldCount !== realSold) {
      food.soldCount = realSold;
      await food.save();
    }
  }
  console.log('✅ Synchronized soldCount for all foods from orders');
};

module.exports = { getFoods, getFoodById, createFood, updateFood, deleteFood, getFeaturedFoods, syncAllFoodSales };
