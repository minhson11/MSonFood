const Topping = require('../models/Topping');
const Food = require('../models/Food');

// @desc    Get all toppings
// @route   GET /api/toppings
// @access  Public
exports.getAllToppings = async (req, res, next) => {
  try {
    const toppings = await Topping.find({ isActive: true }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: toppings.length,
      data: toppings
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
    const { name, price, description } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên và giá topping'
      });
    }

    const topping = await Topping.create({
      name,
      price,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Tạo topping thành công',
      data: topping
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Topping này đã tồn tại'
      });
    }
    next(error);
  }
};

// @desc    Update topping (Admin)
// @route   PUT /api/admin/toppings/:id
// @access  Private/Admin
exports.updateTopping = async (req, res, next) => {
  try {
    const topping = await Topping.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!topping) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy topping'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật topping thành công',
      data: topping
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete topping (Admin)
// @route   DELETE /api/admin/toppings/:id
// @access  Private/Admin
exports.deleteTopping = async (req, res, next) => {
  try {
    const topping = await Topping.findById(req.params.id);

    if (!topping) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy topping'
      });
    }

    // Remove topping from all foods
    await Food.updateMany(
      { toppings: req.params.id },
      { $pull: { toppings: req.params.id } }
    );

    await topping.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa topping thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply toppings to multiple foods (Admin)
// @route   POST /api/admin/toppings/apply
// @access  Private/Admin
exports.applyToppingsToFoods = async (req, res, next) => {
  try {
    const { toppingIds, foodIds } = req.body;

    if (!toppingIds || !Array.isArray(toppingIds) || toppingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một topping'
      });
    }

    if (!foodIds || !Array.isArray(foodIds) || foodIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một món ăn'
      });
    }

    // Verify all toppings exist
    const toppings = await Topping.find({ _id: { $in: toppingIds } });
    if (toppings.length !== toppingIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Một số topping không tồn tại'
      });
    }

    // Verify all foods exist
    const foods = await Food.find({ _id: { $in: foodIds } });
    if (foods.length !== foodIds.length) {
      return res.status(404).json({
        success: false,
        message: 'Một số món ăn không tồn tại'
      });
    }

    // Apply toppings to foods (avoid duplicates)
    await Food.updateMany(
      { _id: { $in: foodIds } },
      { $addToSet: { toppings: { $each: toppingIds } } }
    );

    res.status(200).json({
      success: true,
      message: `Đã áp dụng ${toppingIds.length} topping cho ${foodIds.length} món ăn`,
      data: {
        toppingsCount: toppingIds.length,
        foodsCount: foodIds.length
      }
    });
  } catch (error) {
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
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách topping'
      });
    }

    if (!foodIds || !Array.isArray(foodIds)) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh sách món ăn'
      });
    }

    await Food.updateMany(
      { _id: { $in: foodIds } },
      { $pull: { toppings: { $in: toppingIds } } }
    );

    res.status(200).json({
      success: true,
      message: 'Đã xóa topping khỏi các món ăn'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update toppings for a specific food (Admin)
// @route   PUT /api/admin/toppings/food/:foodId
// @access  Private/Admin
exports.updateFoodToppings = async (req, res, next) => {
  try {
    const { foodId } = req.params;
    const { toppingIds } = req.body;

    if (!Array.isArray(toppingIds)) {
      return res.status(400).json({
        success: false,
        message: 'toppingIds phải là một danh sách'
      });
    }

    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    if (toppingIds.length > 0) {
      const existingToppings = await Topping.find({ _id: { $in: toppingIds } });
      if (existingToppings.length !== toppingIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Một số topping không hợp lệ hoặc không tồn tại'
        });
      }
    }

    food.toppings = toppingIds;
    await food.save();
    await food.populate('toppings', 'name price description');
    await food.populate('category', 'name image');

    res.status(200).json({
      success: true,
      message: 'Cập nhật topping cho món ăn thành công',
      data: food
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a single topping from a specific food (Admin)
// @route   DELETE /api/admin/toppings/food/:foodId/:toppingId
// @access  Private/Admin
exports.removeSingleToppingFromFood = async (req, res, next) => {
  try {
    const { foodId, toppingId } = req.params;

    const food = await Food.findByIdAndUpdate(
      foodId,
      { $pull: { toppings: toppingId } },
      { new: true }
    ).populate('toppings', 'name price description').populate('category', 'name image');

    if (!food) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy món ăn'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Đã xóa topping khỏi món ăn',
      data: food
    });
  } catch (error) {
    next(error);
  }
};

