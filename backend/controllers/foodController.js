const Food = require('../models/Food');
const Category = require('../models/Category');
const Topping = require('../models/Topping');

// @desc    Get all foods with filters
// @route   GET /api/foods
// @access  Public
exports.getFoods = async (req, res, next) => {
  try {
    const { search, category, sort, page = 1, limit = 12 } = req.query;

    // Build query
    let query = {};

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Build sort
    let sortOptions = {};
    if (sort === 'price_asc') {
      sortOptions.price = 1;
    } else if (sort === 'price_desc') {
      sortOptions.price = -1;
    } else if (sort === 'rating_desc') {
      sortOptions.rating = -1;
    } else if (sort === 'rating_asc') {
      sortOptions.rating = 1;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const foods = await Food.find(query)
      .populate('category', 'name image')
      .populate('toppings', 'name price description isActive')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Food.countDocuments(query);

    res.status(200).json({
      success: true,
      count: foods.length,
      data: foods,
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

// @desc    Get single food
// @route   GET /api/foods/:id
// @access  Public
exports.getFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id)
      .populate('category', 'name image')
      .populate('toppings', 'name price description isActive');

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    res.status(200).json({
      success: true,
      data: food
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create food
// @route   POST /api/foods
// @access  Private/Admin
exports.createFood = async (req, res, next) => {
  try {
    const { name, description, price, image, category, stock, isAvailable } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên, mô tả, giá và danh mục'
      });
    }

    // Validate price
    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá phải lớn hơn hoặc bằng 0'
      });
    }

    // Validate stock
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho không thể âm'
      });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    const food = await Food.create({
      name,
      description,
      price,
      image: image || '',
      category,
      stock: stock || 0,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    await food.populate('category', 'name image');

    res.status(201).json({
      success: true,
      message: 'Thêm món ăn thành công',
      data: food
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update food
// @route   PUT /api/foods/:id
// @access  Private/Admin
exports.updateFood = async (req, res, next) => {
  try {
    const { name, description, price, image, category, stock, isAvailable } = req.body;

    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    // Validate price
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá phải lớn hơn hoặc bằng 0'
      });
    }

    // Validate stock
    if (stock !== undefined && stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng tồn kho không thể âm'
      });
    }

    // Check if category exists
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy danh mục'
        });
      }
    }

    // Update fields
    if (name) food.name = name;
    if (description) food.description = description;
    if (price !== undefined) food.price = price;
    if (image !== undefined) food.image = image;
    if (category) food.category = category;
    if (stock !== undefined) food.stock = stock;
    if (isAvailable !== undefined) food.isAvailable = isAvailable;

    await food.save();
    await food.populate('category', 'name image');

    res.status(200).json({
      success: true,
      message: 'Cập nhật món ăn thành công',
      data: food
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete food
// @route   DELETE /api/foods/:id
// @access  Private/Admin
exports.deleteFood = async (req, res, next) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    await food.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa món ăn thành công'
    });
  } catch (error) {
    next(error);
  }
};
