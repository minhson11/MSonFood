const sendEmail = require('../config/email');

/**
 * Gửi email đặt lại mật khẩu
 * Logic chiết xuất từ authController.forgotPassword
 */
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #ff6b35; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; padding: 12px 30px; background-color: #ff6b35; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 10px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🍔 MSon Food</h1>
        </div>
        <div class="content">
          <h2>Đặt Lại Mật Khẩu</h2>
          <p>Xin chào ${name},</p>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấp vào nút bên dưới để đặt lại:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Đặt Lại Mật Khẩu</a>
          </p>
          <p>Hoặc sao chép và dán liên kết này vào trình duyệt của bạn:</p>
          <p style="word-break: break-all; background-color: #fff; padding: 10px; border: 1px solid #ddd;">
            ${resetUrl}
          </p>
          <div class="warning">
            <strong>⚠️ Quan trọng:</strong>
            <ul>
              <li>Liên kết này sẽ hết hạn sau <strong>15 phút</strong></li>
              <li>Liên kết này chỉ có thể sử dụng <strong>một lần</strong></li>
              <li>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này</li>
            </ul>
          </div>
          <p>Vì lý do bảo mật, chúng tôi sẽ không bao giờ yêu cầu mật khẩu của bạn qua email.</p>
        </div>
        <div class="footer">
          <p>© 2026 MSon Food. Bảo lưu mọi quyền.</p>
          <p>Đây là email tự động, vui lòng không trả lời.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to,
    subject: 'Yêu Cầu Đặt Lại Mật Khẩu - MSon Food',
    html,
  });
};

module.exports = { sendPasswordResetEmail };
