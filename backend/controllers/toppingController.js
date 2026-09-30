const toppingService = require('../services/toppingService');

// @desc    Get all toppings
// @route   GET /api/toppings
// @access  Public
exports.getAllToppings = async (req, res, next) => {
  try {
    const toppings = await toppingService.getAllToppings();

    res.status(200).json({
      success: true,
      count: toppings.length,
      data: toppings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create topping (Admin)
// @route   POST /api/admin/toppings
// @access  Private/Admin
exports.createTopping = async (req, res, next) => {
  try {
    const topping = await toppingService.createTopping(req.body);

    res.status(201).json({
      success: true,
      message: 'Tạo topping thành công',
      data: topping,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Topping này đã tồn tại' });
    }
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Update topping (Admin)
// @route   PUT /api/admin/toppings/:id
// @access  Private/Admin
exports.updateTopping = async (req, res, next) => {
  try {
    const topping = await toppingService.updateTopping(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Cập nhật topping thành công',
      data: topping,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Delete topping (Admin)
// @route   DELETE /api/admin/toppings/:id
// @access  Private/Admin
exports.deleteTopping = async (req, res, next) => {
  try {
    await toppingService.deleteTopping(req.params.id);
    res.status(200).json({ success: true, message: 'Xóa topping thành công' });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Apply toppings to multiple foods (Admin)
// @route   POST /api/admin/toppings/apply
// @access  Private/Admin
exports.applyToppingsToFoods = async (req, res, next) => {
  try {
    const { toppingIds, foodIds } = req.body;
    const data = await toppingService.applyToppingsToFoods({ toppingIds, foodIds });

    res.status(200).json({
      success: true,
      message: `Đã áp dụng ${data.toppingsCount} topping cho ${data.foodsCount} món ăn`,
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Remove toppings from multiple foods (Admin)
// @route   POST /api/admin/toppings/remove
// @access  Private/Admin
exports.removeToppingsFromFoods = async (req, res, next) => {
  try {
    const { toppingIds, foodIds } = req.body;

    if (!toppingIds || !Array.isArray(toppingIds)) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sách topping' });
    }
    if (!foodIds || !Array.isArray(foodIds)) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp danh sách món ăn' });
    }

    await toppingService.removeToppingsFromFoods({ toppingIds, foodIds });
    res.status(200).json({ success: true, message: 'Đã xóa topping khỏi các món ăn' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update toppings for a specific food (Admin)
// @route   PUT /api/admin/toppings/food/:foodId
// @access  Private/Admin
exports.updateFoodToppings = async (req, res, next) => {
  try {
    const { toppingIds } = req.body;

    if (!Array.isArray(toppingIds)) {
      return res.status(400).json({ success: false, message: 'toppingIds phải là một danh sách' });
    }

    const food = await toppingService.updateFoodToppings({ foodId: req.params.foodId, toppingIds });

    res.status(200).json({
      success: true,
      message: 'Cập nhật topping cho món ăn thành công',
      data: food,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Remove a single topping from a specific food (Admin)
// @route   DELETE /api/admin/toppings/food/:foodId/:toppingId
// @access  Private/Admin
exports.removeSingleToppingFromFood = async (req, res, next) => {
  try {
    const { foodId, toppingId } = req.params;
    const food = await toppingService.removeSingleToppingFromFood({ foodId, toppingId });

    res.status(200).json({
      success: true,
      message: 'Đã xóa topping khỏi món ăn',
      data: food,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};
