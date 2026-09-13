const Category = require('../models/Category');

// @desc    Get all categories with food count
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const Food = require('../models/Food');
    const categories = await Category.find().sort({ createdAt: 1 });

    // Aggregate food count per category
    const foodCounts = await Food.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    foodCounts.forEach((fc) => {
      if (fc._id) countMap[fc._id.toString()] = fc.count;
    });

    const categoriesWithCount = categories.map((cat) => {
      const catObj = cat.toObject();
      catObj.foodCount = countMap[cat._id.toString()] || 0;
      return catObj;
    });

    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    // Validate
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên danh mục'
      });
    }

    // Check if category exists
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục đã tồn tại'
      });
    }

    const category = await Category.create({
      name,
      description: description || '',
      image: image || ''
    });

    res.status(201).json({
      success: true,
      message: 'Tạo danh mục thành công',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check if new name already exists (excluding current category)
    if (name && name !== category.name) {
      const nameExists = await Category.findOne({ name });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục đã tồn tại'
        });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục'
      });
    }

    // Check if category has foods
    const Food = require('../models/Food');
    const foodsCount = await Food.countDocuments({ category: req.params.id });
    
    if (foodsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục. ${foodsCount} món ăn đang sử dụng danh mục này.`
      });
    }

    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công'
    });
  } catch (error) {
    next(error);
  }
};
