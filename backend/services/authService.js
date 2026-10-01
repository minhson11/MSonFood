const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateResetToken = require('../utils/generateResetToken');
const { sendPasswordResetEmail } = require('./emailService');

/** Format user object để trả về client (bỏ các field nhạy cảm) */
const formatUserResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  address: user.address,
  gender: user.gender,
  birthday: user.birthday,
  location: user.location,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * Đăng ký user mới
 */
const register = async ({ name, email, password, phone }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    const err = new Error('Email đã được đăng ký');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.create({ name, email, password, phone: phone || '' });
  const token = generateToken(user._id);

  return { user: formatUserResponse(user), token };
};

/**
 * Đăng nhập
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Email hoặc mật khẩu không chính xác');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Email hoặc mật khẩu không chính xác');
    err.statusCode = 401;
    throw err;
  }

  const token = generateToken(user._id);
  return { user: formatUserResponse(user), token };
};

/**
 * Lấy thông tin user hiện tại
 */
const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('Không tìm thấy người dùng');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

/**
 * Cập nhật profile
 */
const updateProfile = async (userId, { name, phone, address, avatar, gender, birthday, location }) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('Không tìm thấy người dùng');
    err.statusCode = 404;
    throw err;
  }

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (avatar !== undefined) user.avatar = avatar;
  if (gender !== undefined) user.gender = gender;
  if (birthday !== undefined) user.birthday = birthday;
  if (location !== undefined) user.location = location;

  await user.save();
  return formatUserResponse(user);
};

/**
 * Đổi mật khẩu
 */
const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const err = new Error('Mật khẩu hiện tại không đúng');
    err.statusCode = 401;
    throw err;
  }

  user.password = newPassword;
  await user.save();
};

/**
 * Quên mật khẩu — tạo token và gửi email
 */
const forgotPassword = async (email, clientUrl) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Không tiết lộ email có tồn tại hay không (security best practice)
  if (!user) return;

  const { resetToken, resetTokenHash } = generateResetToken();

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
  await user.save();

  const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  } catch (error) {
    // Nếu gửi email thất bại, xóa token để tránh token orphan
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    const err = new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
    err.statusCode = 500;
    throw err;
  }
};

/**
 * Đặt lại mật khẩu bằng token
 */
const resetPassword = async ({ token, newPassword }) => {
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: resetTokenHash,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    const err = new Error('Mã xác thực không hợp lệ hoặc đã hết hạn');
    err.statusCode = 400;
    throw err;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
};

module.exports = { register, login, getMe, updateProfile, changePassword, forgotPassword, resetPassword };
