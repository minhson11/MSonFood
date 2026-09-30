const foodService = require('../services/foodService');
const { validateCreateFood, validateUpdateFood } = require('../validators/foodValidator');

// @desc    Get all foods with filters
// @route   GET /api/foods
// @access  Public
exports.getFoods = async (req, res, next) => {
  try {
    const { search, category, sort, page, limit } = req.query;
    const { foods, pagination } = await foodService.getFoods({ search, category, sort, page, limit });

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single food
// @route   GET /api/foods/:id
// @access  Public
exports.getFood = async (req, res, next) => {
  try {
    const food = await foodService.getFoodById(req.params.id);
    res.status(200).json({ success: true, data: food });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Create food
// @route   POST /api/foods
// @access  Private/Admin
exports.createFood = async (req, res, next) => {
  try {
    const validation = validateCreateFood(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const food = await foodService.createFood(req.body);

    res.status(201).json({
      success: true,
      message: 'Thêm món ăn thành công',
      data: food,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update food
// @route   PUT /api/foods/:id
// @access  Private/Admin
exports.updateFood = async (req, res, next) => {
  try {
    const validation = validateUpdateFood(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const food = await foodService.updateFood(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Cập nhật món ăn thành công',
      data: food,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete food
// @route   DELETE /api/foods/:id
// @access  Private/Admin
exports.deleteFood = async (req, res, next) => {
  try {
    await foodService.deleteFood(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa món ăn thành công' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Get featured foods
// @route   GET /api/foods/featured
// @access  Public
exports.getFeaturedFoods = async (req, res, next) => {
  try {
    const foods = await foodService.getFeaturedFoods(req.query.limit);

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods,
    });
  } catch (error) {
    next(error);
  }
};

// Sync soldCount — called on module load
exports.syncAllFoodSales = foodService.syncAllFoodSales;

// Auto sync on load
setTimeout(() => {
  foodService.syncAllFoodSales().catch(() => {});
}, 1200);
