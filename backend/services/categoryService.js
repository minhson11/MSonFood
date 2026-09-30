const Category = require('../models/Category');
const Food = require('../models/Food');

/**
 * Lấy tất cả danh mục kèm số lượng món ăn
 */
const getCategories = async () => {
  const [categories, foodCounts] = await Promise.all([
    Category.find().sort({ createdAt: 1 }),
    Food.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);

  const countMap = {};
  foodCounts.forEach((fc) => { if (fc._id) countMap[fc._id.toString()] = fc.count; });

  return categories.map((cat) => {
    const catObj = cat.toObject();
    catObj.foodCount = countMap[cat._id.toString()] || 0;
    return catObj;
  });
};

/**
 * Lấy 1 danh mục theo ID
 */
const getCategoryById = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error('Không tìm thấy danh mục');
    err.statusCode = 404;
    throw err;
  }
  return category;
};

/**
 * Tạo danh mục mới
 */
const createCategory = async ({ name, description, image }) => {
  if (!name) {
    const err = new Error('Vui lòng cung cấp tên danh mục');
    err.statusCode = 400;
    throw err;
  }

  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    const err = new Error('Danh mục đã tồn tại');
    err.statusCode = 400;
    throw err;
  }

  return Category.create({ name, description: description || '', image: image || '' });
};

/**
 * Cập nhật danh mục
 */
const updateCategory = async (id, { name, description, image }) => {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error('Không tìm thấy danh mục');
    err.statusCode = 404;
    throw err;
  }

  if (name && name !== category.name) {
    const nameExists = await Category.findOne({ name });
    if (nameExists) {
      const err = new Error('Tên danh mục đã tồn tại');
      err.statusCode = 400;
      throw err;
    }
    category.name = name;
  }

  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;

  await category.save();
  return category;
};

/**
 * Xóa danh mục (kiểm tra có món ăn đang dùng không)
 */
const deleteCategory = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error('Không tìm thấy danh mục');
    err.statusCode = 404;
    throw err;
  }

  const foodsCount = await Food.countDocuments({ category: id });
  if (foodsCount > 0) {
    const err = new Error(`Không thể xóa danh mục. ${foodsCount} món ăn đang sử dụng danh mục này.`);
    err.statusCode = 400;
    throw err;
  }

  await category.deleteOne();
};

module.exports = { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory };
