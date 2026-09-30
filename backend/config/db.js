const mongoose = require('mongoose');
const dns = require('dns');

// Khắc phục lỗi querySrv ECONNREFUSED do DNS mạng cục bộ không phân giải được SRV record của MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  console.warn('⚠️ Không thể đặt máy chủ DNS tùy chỉnh:', dnsErr.message);
}

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;
    if (!mongoUri) {
      throw new Error('Chưa cấu hình biến môi trường MongoDB (MONGODB_URI hoặc MONGO_URI)');
    }
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
