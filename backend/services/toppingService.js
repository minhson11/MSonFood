const Topping = require('../models/Topping');
const Food = require('../models/Food');

/**
 * Lấy tất cả toppings đang active
 */
const getAllToppings = async () => {
  return Topping.find({ isActive: true }).sort({ name: 1 });
};

/**
 * Tạo topping mới (Admin)
 */
const createTopping = async ({ name, price, description }) => {
  if (!name || !price) {
    const err = new Error('Vui lòng cung cấp tên và giá topping');
    err.statusCode = 400;
    throw err;
  }
  return Topping.create({ name, price, description });
};

/**
 * Cập nhật topping (Admin)
 */
const updateTopping = async (id, data) => {
  const topping = await Topping.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!topping) {
    const err = new Error('Không tìm thấy topping');
    err.statusCode = 404;
    throw err;
  }
  return topping;
};

/**
 * Xóa topping (Admin) — đồng thời xóa khỏi tất cả foods
 */
const deleteTopping = async (id) => {
  const topping = await Topping.findById(id);
  if (!topping) {
    const err = new Error('Không tìm thấy topping');
    err.statusCode = 404;
    throw err;
  }

  await Food.updateMany({ toppings: id }, { $pull: { toppings: id } });
  await topping.deleteOne();
};

/**
 * Áp dụng toppings cho nhiều foods (Admin)
 */
const applyToppingsToFoods = async ({ toppingIds, foodIds }) => {
  if (!toppingIds?.length) {
    const err = new Error('Vui lòng chọn ít nhất một topping');
    err.statusCode = 400;
    throw err;
  }
  if (!foodIds?.length) {
    const err = new Error('Vui lòng chọn ít nhất một món ăn');
    err.statusCode = 400;
    throw err;
  }

  const [toppings, foods] = await Promise.all([
    Topping.find({ _id: { $in: toppingIds } }),
    Food.find({ _id: { $in: foodIds } }),
  ]);

  if (toppings.length !== toppingIds.length) {
    const err = new Error('Một số topping không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  if (foods.length !== foodIds.length) {
    const err = new Error('Một số món ăn không tồn tại');
    err.statusCode = 404;
    throw err;
  }

  await Food.updateMany(
    { _id: { $in: foodIds } },
    { $addToSet: { toppings: { $each: toppingIds } } }
  );

  return { toppingsCount: toppingIds.length, foodsCount: foodIds.length };
};

/**
 * Gỡ toppings khỏi nhiều foods (Admin)
 */
const removeToppingsFromFoods = async ({ toppingIds, foodIds }) => {
  await Food.updateMany(
    { _id: { $in: foodIds } },
    { $pull: { toppings: { $in: toppingIds } } }
  );
};

/**
 * Cập nhật toppings cho 1 food cụ thể (Admin)
 */
const updateFoodToppings = async ({ foodId, toppingIds }) => {
  const food = await Food.findById(foodId);
  if (!food) {
    const err = new Error('Không tìm thấy món ăn');
    err.statusCode = 404;
    throw err;
  }

  if (toppingIds.length > 0) {
    const existing = await Topping.find({ _id: { $in: toppingIds } });
    if (existing.length !== toppingIds.length) {
      const err = new Error('Một số topping không hợp lệ hoặc không tồn tại');
      err.statusCode = 400;
      throw err;
    }
  }

  food.toppings = toppingIds;
  await food.save();
  await food.populate('toppings', 'name price description');
  await food.populate('category', 'name image');
  return food;
};

/**
 * Xóa 1 topping khỏi 1 food (Admin)
 */
const removeSingleToppingFromFood = async ({ foodId, toppingId }) => {
  const food = await Food.findByIdAndUpdate(
    foodId,
    { $pull: { toppings: toppingId } },
    { new: true }
  )
    .populate('toppings', 'name price description')
    .populate('category', 'name image');

  if (!food) {
    const err = new Error('Không tìm thấy món ăn');
    err.statusCode = 404;
    throw err;
  }
  return food;
};

module.exports = {
  getAllToppings,
  createTopping,
  updateTopping,
  deleteTopping,
  applyToppingsToFoods,
  removeToppingsFromFoods,
  updateFoodToppings,
  removeSingleToppingFromFood,
};
