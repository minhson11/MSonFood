const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Tổng quan</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <p className="text-gray-600 text-sm">Tổng doanh thu</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">0đ</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Tổng đơn hàng</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Tổng người dùng</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
        </div>
        <div className="card">
          <p className="text-gray-600 text-sm">Tổng món ăn</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">0</p>
        </div>
      </div>
      <p className="text-gray-600">Trang tổng quan - sẽ kết nối API sau</p>
    </div>
  );
};

export default Dashboard;
