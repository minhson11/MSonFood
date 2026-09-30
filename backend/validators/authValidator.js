/**
 * Validators cho các route authentication
 * Trả về { isValid, message } để controller / service xử lý tiếp
 */

const validateRegister = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return { isValid: false, message: 'Vui lòng cung cấp đầy đủ họ tên, email và mật khẩu' };
  }
  if (password.length < 6) {
    return { isValid: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Email không hợp lệ' };
  }
  return { isValid: true };
};

const validateLogin = ({ email, password }) => {
  if (!email || !password) {
    return { isValid: false, message: 'Vui lòng nhập email và mật khẩu' };
  }
  return { isValid: true };
};

const validateForgotPassword = ({ email }) => {
  if (!email) {
    return { isValid: false, message: 'Vui lòng nhập email' };
  }
  return { isValid: true };
};

const validateResetPassword = ({ token, newPassword }) => {
  if (!token || !newPassword) {
    return { isValid: false, message: 'Token và mật khẩu mới là bắt buộc' };
  }
  if (newPassword.length < 6) {
    return { isValid: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }
  return { isValid: true };
};

const validateChangePassword = ({ currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    return { isValid: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' };
  }
  if (newPassword.length < 6) {
    return { isValid: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
  }
  return { isValid: true };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
};
