import { useState, useEffect } from 'react';
import { adminToppingApi, adminFoodApi, adminCategoryApi } from '../../services/adminApi';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const ManageToppings = () => {
  // Main state
  const [activeTab, setActiveTab] = useState('food-toppings'); // 'food-toppings' or 'toppings-list'
  const [toppings, setToppings] = useState([]);
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters for Food Toppings tab
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('');
  const [foodToppingFilter, setFoodToppingFilter] = useState('all'); // 'all', 'with-toppings', 'without-toppings'

  // Filters for Toppings List tab
  const [toppingSearchQuery, setToppingSearchQuery] = useState('');

  // Topping CRUD Modal (Create / Edit global topping)
  const [showToppingModal, setShowToppingModal] = useState(false);
  const [toppingModalMode, setToppingModalMode] = useState('create');
  const [selectedTopping, setSelectedTopping] = useState(null);
  const [toppingFormData, setToppingFormData] = useState({
    name: '',
    price: '',
    description: ''
  });

  // Food Toppings Edit Modal (Edit toppings for 1 specific dish)
  const [showFoodToppingsModal, setShowFoodToppingsModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [selectedToppingIdsForFood, setSelectedToppingIdsForFood] = useState([]);
  const [modalToppingSearch, setModalToppingSearch] = useState('');
  const [savingFoodToppings, setSavingFoodToppings] = useState(false);

  // Batch Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyData, setApplyData] = useState({
    selectedToppings: [],
    selectedFoods: []
  });
  const [applyFoodSearch, setApplyFoodSearch] = useState('');

  // Batch Remove Modal
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeData, setRemoveData] = useState({
    selectedToppings: [],
    selectedFoods: []
  });
  const [removeFoodSearch, setRemoveFoodSearch] = useState('');

  // Delete Topping Global Confirmation
  const [showDeleteToppingDialog, setShowDeleteToppingDialog] = useState(false);
  const [toppingToDelete, setToppingToDelete] = useState(null);

  // Remove Single Topping from Food Confirmation
  const [showRemoveSingleDialog, setShowRemoveSingleDialog] = useState(false);
  const [singleRemoveTarget, setSingleRemoveTarget] = useState(null); // { food, topping }

  // Clear All Toppings from Food Confirmation
  const [showClearFoodDialog, setShowClearFoodDialog] = useState(false);
  const [clearFoodTarget, setClearFoodTarget] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  // Auto clear success message after 4s
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([fetchToppings(), fetchFoods(), fetchCategories()]);
    } catch (err) {
      setError(err.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const fetchToppings = async () => {
    try {
      const response = await adminToppingApi.getAllToppings();
      setToppings(response.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách topping:', err);
      throw err;
    }
  };

  const fetchFoods = async () => {
    try {
      const response = await adminFoodApi.getAllFoods({ limit: 300 });
      setFoods(response.data || []);
    } catch (err) {
      console.error('Lỗi tải món ăn:', err);
      throw err;
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminCategoryApi.getAllCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  };

  // --- Topping CRUD Handlers ---
  const handleOpenCreateToppingModal = () => {
    setToppingModalMode('create');
    setSelectedTopping(null);
    setToppingFormData({ name: '', price: '', description: '' });
    setShowToppingModal(true);
  };

  const handleOpenEditToppingModal = (topping) => {
    setToppingModalMode('edit');
    setSelectedTopping(topping);
    setToppingFormData({
      name: topping.name,
      price: topping.price,
      description: topping.description || ''
    });
    setShowToppingModal(true);
  };

  const handleSaveTopping = async (e) => {
    e.preventDefault();
    try {
      if (toppingModalMode === 'create') {
        await adminToppingApi.createTopping(toppingFormData);
        setSuccessMessage(`Đã tạo topping "${toppingFormData.name}" thành công!`);
      } else {
        await adminToppingApi.updateTopping(selectedTopping._id, toppingFormData);
        setSuccessMessage(`Đã cập nhật topping "${toppingFormData.name}" thành công!`);
      }
      setShowToppingModal(false);
      await Promise.all([fetchToppings(), fetchFoods()]);
    } catch (err) {
      setError(err.message || 'Không thể lưu topping');
    }
  };

  const handleDeleteToppingConfirm = async () => {
    if (!toppingToDelete) return;
    try {
      await adminToppingApi.deleteTopping(toppingToDelete._id);
      setSuccessMessage(`Đã xóa topping "${toppingToDelete.name}" khỏi hệ thống và các món ăn.`);
      setShowDeleteToppingDialog(false);
      setToppingToDelete(null);
      await Promise.all([fetchToppings(), fetchFoods()]);
    } catch (err) {
      setError(err.message || 'Không thể xóa topping');
    }
  };

  // --- Food Topping Single Edit Modal Handlers ---
  const handleOpenFoodToppingsModal = (food) => {
    setEditingFood(food);
    const currentToppingIds = (food.toppings || []).map(t => typeof t === 'object' ? t._id : t);
    setSelectedToppingIdsForFood(currentToppingIds);
    setModalToppingSearch('');
    setShowFoodToppingsModal(true);
  };

  const handleToggleToppingForFood = (toppingId) => {
    setSelectedToppingIdsForFood(prev =>
      prev.includes(toppingId)
        ? prev.filter(id => id !== toppingId)
        : [...prev, toppingId]
    );
  };

  const handleSelectAllToppingsForFood = () => {
    setSelectedToppingIdsForFood(toppings.map(t => t._id));
  };

  const handleClearAllToppingsForFoodSelection = () => {
    setSelectedToppingIdsForFood([]);
  };

  const handleSaveFoodToppings = async () => {
    if (!editingFood) return;
    try {
      setSavingFoodToppings(true);
      await adminToppingApi.updateFoodToppings(editingFood._id, selectedToppingIdsForFood);
      setSuccessMessage(`Đã cập nhật danh sách topping cho món "${editingFood.name}" thành công!`);
      setShowFoodToppingsModal(false);
      setEditingFood(null);
      await fetchFoods();
    } catch (err) {
      setError(err.message || 'Không thể cập nhật topping cho món ăn');
    } finally {
      setSavingFoodToppings(false);
    }
  };

  // --- Remove Single Topping from Food Inline Handler ---
  const handlePromptRemoveSingleTopping = (food, topping) => {
    setSingleRemoveTarget({ food, topping });
    setShowRemoveSingleDialog(true);
  };

  const handleConfirmRemoveSingleTopping = async () => {
    if (!singleRemoveTarget) return;
    const { food, topping } = singleRemoveTarget;
    try {
      await adminToppingApi.removeToppingFromFood(food._id, topping._id);
      setSuccessMessage(`Đã gỡ topping "${topping.name}" khỏi món "${food.name}".`);
      setShowRemoveSingleDialog(false);
      setSingleRemoveTarget(null);
      await fetchFoods();
    } catch (err) {
      setError(err.message || 'Không thể xóa topping khỏi món');
    }
  };

  // --- Clear All Toppings from Food Handler ---
  const handlePromptClearFoodToppings = (food) => {
    setClearFoodTarget(food);
    setShowClearFoodDialog(true);
  };

  const handleConfirmClearFoodToppings = async () => {
    if (!clearFoodTarget) return;
    try {
      await adminToppingApi.updateFoodToppings(clearFoodTarget._id, []);
      setSuccessMessage(`Đã gỡ tất cả topping khỏi món "${clearFoodTarget.name}".`);
      setShowClearFoodDialog(false);
      setClearFoodTarget(null);
      await fetchFoods();
    } catch (err) {
      setError(err.message || 'Không thể gỡ topping');
    }
  };

  // --- Batch Apply Handlers ---
  const handleBatchApply = async () => {
    try {
      if (applyData.selectedToppings.length === 0 || applyData.selectedFoods.length === 0) {
        setError('Vui lòng chọn ít nhất 1 topping và 1 món ăn để áp dụng');
        return;
      }

      await adminToppingApi.applyToFoods(applyData.selectedToppings, applyData.selectedFoods);
      setShowApplyModal(false);
      setApplyData({ selectedToppings: [], selectedFoods: [] });
      setSuccessMessage(`Đã thêm thành công ${applyData.selectedToppings.length} topping vào ${applyData.selectedFoods.length} món ăn!`);
      await fetchFoods();
    } catch (err) {
      setError(err.message || 'Không thể áp dụng topping');
    }
  };

  // --- Batch Remove Handlers ---
  const handleBatchRemove = async () => {
    try {
      if (removeData.selectedToppings.length === 0 || removeData.selectedFoods.length === 0) {
        setError('Vui lòng chọn ít nhất 1 topping và 1 món ăn để gỡ bỏ');
        return;
      }

      await adminToppingApi.removeFromFoods(removeData.selectedToppings, removeData.selectedFoods);
      setShowRemoveModal(false);
      setRemoveData({ selectedToppings: [], selectedFoods: [] });
      setSuccessMessage(`Đã gỡ ${removeData.selectedToppings.length} loại topping khỏi ${removeData.selectedFoods.length} món ăn đã chọn!`);
      await fetchFoods();
    } catch (err) {
      setError(err.message || 'Không thể gỡ topping khỏi món ăn');
    }
  };

  // Filtered Food list for Tab 1
  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(foodSearchQuery.toLowerCase());
    const matchesCategory = !foodCategoryFilter || (food.category?._id === foodCategoryFilter || food.category === foodCategoryFilter);
    const hasToppings = food.toppings && food.toppings.length > 0;
    
    let matchesToppingFilter = true;
    if (foodToppingFilter === 'with-toppings') matchesToppingFilter = hasToppings;
    if (foodToppingFilter === 'without-toppings') matchesToppingFilter = !hasToppings;

    return matchesSearch && matchesCategory && matchesToppingFilter;
  });

  // Filtered Topping list for Tab 2
  const filteredToppings = toppings.filter((topping) =>
    topping.name.toLowerCase().includes(toppingSearchQuery.toLowerCase()) ||
    (topping.description && topping.description.toLowerCase().includes(toppingSearchQuery.toLowerCase()))
  );

  // Helper: Count foods using a topping
  const getFoodsUsingToppingCount = (toppingId) => {
    return foods.filter(f => f.toppings?.some(t => (t._id || t) === toppingId)).length;
  };

  // Stats calculation
  const totalFoodsCount = foods.length;
  const foodsWithToppingsCount = foods.filter(f => f.toppings && f.toppings.length > 0).length;
  const foodsWithoutToppingsCount = totalFoodsCount - foodsWithToppingsCount;

  if (loading && toppings.length === 0 && foods.length === 0) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý Topping</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Thêm, sửa, xóa topping và phân bổ topping cho từng món ăn
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setApplyData({ selectedToppings: [], selectedFoods: [] });
                setApplyFoodSearch('');
                setShowApplyModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-sm hover:shadow"
              title="Thêm topping vào nhiều món ăn cùng lúc"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Áp dụng hàng loạt
            </button>

            <button
              onClick={() => {
                setRemoveData({ selectedToppings: [], selectedFoods: [] });
                setRemoveFoodSearch('');
                setShowRemoveModal(true);
              }}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition"
              title="Gỡ bỏ topping khỏi nhiều món ăn cùng lúc"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Gỡ hàng loạt
            </button>

            <button
              onClick={handleOpenCreateToppingModal}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition shadow-sm hover:shadow"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tạo Topping Mới
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mt-6 -mb-6">
          <button
            onClick={() => setActiveTab('food-toppings')}
            className={`pb-4 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'food-toppings'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Topping theo món ăn
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'food-toppings' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
              {foods.length} món
            </span>
          </button>

          <button
            onClick={() => setActiveTab('toppings-list')}
            className={`pb-4 px-4 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'toppings-list'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            Danh sách các loại Topping
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'toppings-list' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
              {toppings.length} loại
            </span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <ErrorMessage message={error} onClose={() => setError('')} />
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ================= TAB 1: FOOD TOPPINGS MANAGEMENT ================= */}
      {activeTab === 'food-toppings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Quick Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg">
                🍴
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng số món ăn</p>
                <p className="text-xl font-bold text-gray-900">{totalFoodsCount} món</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                ✅
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Món đã có topping</p>
                <p className="text-xl font-bold text-emerald-600">{foodsWithToppingsCount} món</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg">
                ⚪
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Chưa gắn topping</p>
                <p className="text-xl font-bold text-gray-700">{foodsWithoutToppingsCount} món</p>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-white">
            <div className="relative w-full md:w-80">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                placeholder="Tìm món ăn theo tên..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
              {foodSearchQuery && (
                <button
                  onClick={() => setFoodSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Category Filter */}
              <select
                value={foodCategoryFilter}
                onChange={(e) => setFoodCategoryFilter(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-700"
              >
                <option value="">Tất cả danh mục ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {/* Topping State Filter */}
              <select
                value={foodToppingFilter}
                onChange={(e) => setFoodToppingFilter(e.target.value)}
                className="text-sm bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-700"
              >
                <option value="all">Tất cả trạng thái topping</option>
                <option value="with-toppings">Chỉ món có topping</option>
                <option value="without-toppings">Chỉ món chưa có topping</option>
              </select>
            </div>
          </div>

          {/* Foods & Toppings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 w-72">Món ăn</th>
                  <th className="px-6 py-4 w-36">Danh mục & Giá</th>
                  <th className="px-6 py-4">Topping đang áp dụng ({toppings.length} loại có sẵn)</th>
                  <th className="px-6 py-4 text-right w-44">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredFoods.map((food) => {
                  const foodToppings = food.toppings || [];
                  const hasToppings = foodToppings.length > 0;

                  return (
                    <tr key={food._id} className="hover:bg-orange-50/30 transition-colors">
                      {/* Food Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                            {food.image ? (
                              <img src={food.image} alt={food.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                No img
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{food.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{food.description}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Price */}
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 mb-1">
                          {food.category?.name || 'Chưa phân loại'}
                        </span>
                        <div className="font-bold text-orange-600">
                          {food.price?.toLocaleString()}đ
                        </div>
                      </td>

                      {/* Attached Toppings List with direct 'X' removal */}
                      <td className="px-6 py-4">
                        {hasToppings ? (
                          <div className="flex flex-wrap items-center gap-1.5 max-w-xl">
                            {foodToppings.map((t) => {
                              const toppingId = t._id || t;
                              const toppingName = t.name || toppings.find(top => top._id === toppingId)?.name || 'Topping';
                              const toppingPrice = t.price !== undefined ? t.price : (toppings.find(top => top._id === toppingId)?.price || 0);

                              return (
                                <span
                                  key={toppingId}
                                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-lg text-xs font-medium bg-orange-50 border border-orange-200 text-orange-900 group hover:border-orange-300 hover:bg-orange-100 transition shadow-2xs"
                                >
                                  <span className="font-semibold">{toppingName}</span>
                                  <span className="text-orange-600 font-bold text-[11px]">
                                    +{toppingPrice?.toLocaleString()}đ
                                  </span>
                                  <button
                                    onClick={() => handlePromptRemoveSingleTopping(food, { _id: toppingId, name: toppingName })}
                                    className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition ml-0.5"
                                    title={`Xóa topping "${toppingName}" khỏi món "${food.name}"`}
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Chưa áp dụng topping nào
                          </div>
                        )}
                      </td>

                      {/* Action buttons for this specific food */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenFoodToppingsModal(food)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                            title="Sửa / Chọn danh sách topping cho món này"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {hasToppings ? 'Sửa topping' : 'Thêm topping'}
                          </button>

                          {hasToppings && (
                            <button
                              onClick={() => handlePromptClearFoodToppings(food)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-200 transition"
                              title="Xóa toàn bộ topping khỏi món này"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredFoods.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-3 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">Không tìm thấy món ăn nào phù hợp</p>
                <p className="text-xs text-gray-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc danh mục</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: TOPPINGS DEFINITION LIST ================= */}
      {activeTab === 'toppings-list' && (
        <div className="space-y-4">
          {/* Search bar for toppings */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-80">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={toppingSearchQuery}
                onChange={(e) => setToppingSearchQuery(e.target.value)}
                placeholder="Tìm loại topping..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
              />
              {toppingSearchQuery && (
                <button
                  onClick={() => setToppingSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="text-sm text-gray-500 font-medium">
              Hiển thị <span className="font-bold text-gray-900">{filteredToppings.length}</span> / {toppings.length} loại topping
            </div>
          </div>

          {/* Grid of Toppings */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredToppings.map((topping) => {
              const countUsed = getFoodsUsingToppingCount(topping._id);

              return (
                <div
                  key={topping._id}
                  className="bg-white border-2 border-gray-100 rounded-2xl p-5 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{topping.name}</h3>
                        <p className="text-2xl font-bold text-orange-600 mt-1">
                          +{topping.price?.toLocaleString()}đ
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditToppingModal(topping)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="Chỉnh sửa thông tin topping"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            setToppingToDelete(topping);
                            setShowDeleteToppingDialog(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="Xóa topping này hoàn toàn"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {topping.description ? (
                      <p className="text-sm text-gray-600 line-clamp-2 mt-2">{topping.description}</p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-2">Chưa có mô tả</p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Đang áp dụng:</span>
                    <span className={`font-semibold px-2.5 py-0.5 rounded-full ${
                      countUsed > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {countUsed} món ăn
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredToppings.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-orange-50 rounded-full flex items-center justify-center text-orange-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Chưa có topping nào</h3>
              <p className="text-sm text-gray-500 mb-4">Hãy tạo topping đầu tiên để có thể gán vào các món ăn.</p>
              <button
                onClick={handleOpenCreateToppingModal}
                className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-orange-700 transition"
              >
                Tạo Topping Ngay
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: EDIT TOPPINGS FOR A SPECIFIC FOOD ================= */}
      {showFoodToppingsModal && editingFood && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                  {editingFood.image ? (
                    <img src={editingFood.image} alt={editingFood.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">Món</div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Topping cho món: <span className="text-orange-600">{editingFood.name}</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Chọn các topping được phép thêm khi khách hàng đặt món này
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFoodToppingsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Actions & Search inside Modal */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="relative w-full sm:w-64">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={modalToppingSearch}
                    onChange={(e) => setModalToppingSearch(e.target.value)}
                    placeholder="Lọc topping..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleSelectAllToppingsForFood}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAllToppingsForFoodSelection}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-700 px-2.5 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    Bỏ chọn hết
                  </button>
                </div>
              </div>

              {/* Topping List Selection */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {toppings
                  .filter(t => t.name.toLowerCase().includes(modalToppingSearch.toLowerCase()))
                  .map((topping) => {
                    const isSelected = selectedToppingIdsForFood.includes(topping._id);

                    return (
                      <label
                        key={topping._id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleToppingForFood(topping._id)}
                            className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                          />
                          <div>
                            <div className="font-bold text-sm text-gray-900">{topping.name}</div>
                            {topping.description && (
                              <div className="text-xs text-gray-500 line-clamp-1">{topping.description}</div>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="font-bold text-orange-600 text-sm">
                            +{topping.price?.toLocaleString()}đ
                          </span>
                        </div>
                      </label>
                    );
                  })}
              </div>

              {toppings.length === 0 && (
                <p className="text-center py-6 text-gray-500 text-sm">
                  Chưa có loại topping nào trong hệ thống. Hãy tạo topping trước!
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex items-center justify-between">
              <div className="text-sm font-semibold text-gray-700">
                Đã chọn: <span className="text-orange-600 font-bold">{selectedToppingIdsForFood.length}</span> / {toppings.length} topping
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFoodToppingsModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveFoodToppings}
                  disabled={savingFoodToppings}
                  className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {savingFoodToppings ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT TOPPING DEFINITION ================= */}
      {showToppingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {toppingModalMode === 'create' ? 'Tạo Topping Mới' : 'Sửa Loại Topping'}
              </h2>
              <button
                onClick={() => setShowToppingModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveTopping} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tên Topping <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={toppingFormData.name}
                  onChange={(e) => setToppingFormData({ ...toppingFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm"
                  placeholder="VD: Phô mai kéo sợi, Trân châu đen..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Giá bán thêm (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={toppingFormData.price}
                  onChange={(e) => setToppingFormData({ ...toppingFormData, price: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm"
                  placeholder="VD: 15000"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả topping</label>
                <textarea
                  rows={3}
                  value={toppingFormData.description}
                  onChange={(e) => setToppingFormData({ ...toppingFormData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white text-sm"
                  placeholder="Mô tả về topping (tùy chọn)..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowToppingModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl font-semibold text-sm hover:bg-orange-700 transition shadow-sm"
                >
                  {toppingModalMode === 'create' ? 'Tạo Topping' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: BATCH APPLY TOPPINGS ================= */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Áp dụng Topping cho nhiều món</h2>
                <p className="text-xs text-gray-500 mt-0.5">Chọn danh sách topping và các món muốn gán topping vào</p>
              </div>
              <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Pick Toppings */}
                <div className="border border-gray-200 rounded-xl p-4 flex flex-col bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-900">
                      1. Chọn Topping ({applyData.selectedToppings.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setApplyData({ ...applyData, selectedToppings: toppings.map(t => t._id) })}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyData({ ...applyData, selectedToppings: [] })}
                        className="text-xs text-gray-500 font-semibold hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {toppings.map((topping) => (
                      <label
                        key={topping._id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          applyData.selectedToppings.includes(topping._id)
                            ? 'border-orange-500 bg-orange-50/70 font-semibold'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={applyData.selectedToppings.includes(topping._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setApplyData({ ...applyData, selectedToppings: [...applyData.selectedToppings, topping._id] });
                            } else {
                              setApplyData({ ...applyData, selectedToppings: applyData.selectedToppings.filter(id => id !== topping._id) });
                            }
                          }}
                          className="w-4 h-4 text-orange-600 rounded"
                        />
                        <div className="flex-1 flex justify-between items-center text-sm">
                          <span>{topping.name}</span>
                          <span className="text-orange-600 font-bold text-xs">+{topping.price?.toLocaleString()}đ</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. Pick Foods */}
                <div className="border border-gray-200 rounded-xl p-4 flex flex-col bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-900">
                      2. Chọn Món Ăn ({applyData.selectedFoods.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const matchedIds = foods
                            .filter(f => f.name.toLowerCase().includes(applyFoodSearch.toLowerCase()))
                            .map(f => f._id);
                          setApplyData({ ...applyData, selectedFoods: Array.from(new Set([...applyData.selectedFoods, ...matchedIds])) });
                        }}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setApplyData({ ...applyData, selectedFoods: [] })}
                        className="text-xs text-gray-500 font-semibold hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={applyFoodSearch}
                    onChange={(e) => setApplyFoodSearch(e.target.value)}
                    placeholder="Tìm kiếm món ăn..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {foods
                      .filter(f => f.name.toLowerCase().includes(applyFoodSearch.toLowerCase()))
                      .map((food) => (
                        <label
                          key={food._id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                            applyData.selectedFoods.includes(food._id)
                              ? 'border-orange-500 bg-orange-50/70 font-semibold'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={applyData.selectedFoods.includes(food._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setApplyData({ ...applyData, selectedFoods: [...applyData.selectedFoods, food._id] });
                              } else {
                                setApplyData({ ...applyData, selectedFoods: applyData.selectedFoods.filter(id => id !== food._id) });
                              }
                            }}
                            className="w-4 h-4 text-orange-600 rounded"
                          />
                          <div className="flex-1 text-xs">
                            <div className="font-bold text-gray-900">{food.name}</div>
                            <div className="text-gray-500">{food.category?.name || 'Món ăn'}</div>
                          </div>
                        </label>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleBatchApply}
                disabled={applyData.selectedToppings.length === 0 || applyData.selectedFoods.length === 0}
                className="px-6 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Áp dụng {applyData.selectedToppings.length} Topping cho {applyData.selectedFoods.length} Món
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: BATCH REMOVE TOPPINGS ================= */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-scaleIn">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-red-600">Gỡ Topping hàng loạt khỏi món ăn</h2>
                <p className="text-xs text-gray-500 mt-0.5">Chọn danh sách topping và các món muốn gỡ bỏ topping</p>
              </div>
              <button onClick={() => setShowRemoveModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Pick Toppings to remove */}
                <div className="border border-gray-200 rounded-xl p-4 flex flex-col bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-900">
                      1. Chọn Topping cần gỡ ({removeData.selectedToppings.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setRemoveData({ ...removeData, selectedToppings: toppings.map(t => t._id) })}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoveData({ ...removeData, selectedToppings: [] })}
                        className="text-xs text-gray-500 font-semibold hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {toppings.map((topping) => (
                      <label
                        key={topping._id}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                          removeData.selectedToppings.includes(topping._id)
                            ? 'border-red-500 bg-red-50/70 font-semibold'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={removeData.selectedToppings.includes(topping._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRemoveData({ ...removeData, selectedToppings: [...removeData.selectedToppings, topping._id] });
                            } else {
                              setRemoveData({ ...removeData, selectedToppings: removeData.selectedToppings.filter(id => id !== topping._id) });
                            }
                          }}
                          className="w-4 h-4 text-red-600 rounded"
                        />
                        <div className="flex-1 flex justify-between items-center text-sm">
                          <span>{topping.name}</span>
                          <span className="text-red-600 font-bold text-xs">+{topping.price?.toLocaleString()}đ</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 2. Pick Foods to remove from */}
                <div className="border border-gray-200 rounded-xl p-4 flex flex-col bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-900">
                      2. Chọn Món Ăn cần gỡ ({removeData.selectedFoods.length})
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const matchedIds = foods
                            .filter(f => f.toppings && f.toppings.length > 0)
                            .filter(f => f.name.toLowerCase().includes(removeFoodSearch.toLowerCase()))
                            .map(f => f._id);
                          setRemoveData({ ...removeData, selectedFoods: Array.from(new Set([...removeData.selectedFoods, ...matchedIds])) });
                        }}
                        className="text-xs text-blue-600 font-semibold hover:underline"
                      >
                        Món có topping
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoveData({ ...removeData, selectedFoods: [] })}
                        className="text-xs text-gray-500 font-semibold hover:underline"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={removeFoodSearch}
                    onChange={(e) => setRemoveFoodSearch(e.target.value)}
                    placeholder="Tìm món có topping..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {foods
                      .filter(f => f.name.toLowerCase().includes(removeFoodSearch.toLowerCase()))
                      .map((food) => {
                        const hasTops = food.toppings && food.toppings.length > 0;
                        return (
                          <label
                            key={food._id}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                              removeData.selectedFoods.includes(food._id)
                                ? 'border-red-500 bg-red-50/70 font-semibold'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={removeData.selectedFoods.includes(food._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRemoveData({ ...removeData, selectedFoods: [...removeData.selectedFoods, food._id] });
                                } else {
                                  setRemoveData({ ...removeData, selectedFoods: removeData.selectedFoods.filter(id => id !== food._id) });
                                }
                              }}
                              className="w-4 h-4 text-red-600 rounded"
                            />
                            <div className="flex-1 text-xs">
                              <div className="font-bold text-gray-900">{food.name}</div>
                              <div className="text-gray-500">
                                {hasTops ? `${food.toppings.length} topping hiện tại` : 'Chưa có topping'}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRemoveModal(false)}
                className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleBatchRemove}
                disabled={removeData.selectedToppings.length === 0 || removeData.selectedFoods.length === 0}
                className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                Gỡ {removeData.selectedToppings.length} Topping khỏi {removeData.selectedFoods.length} Món
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CONFIRM DIALOG: DELETE GLOBAL TOPPING ================= */}
      <ConfirmDialog
        isOpen={showDeleteToppingDialog}
        onClose={() => {
          setShowDeleteToppingDialog(false);
          setToppingToDelete(null);
        }}
        onConfirm={handleDeleteToppingConfirm}
        title="Xác nhận xóa Topping"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn topping "${toppingToDelete?.name}"? Hành động này sẽ tự động gỡ topping này khỏi tất cả các món ăn đang sử dụng nó.`}
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy"
        type="danger"
      />

      {/* ================= CONFIRM DIALOG: REMOVE SINGLE TOPPING FROM FOOD ================= */}
      <ConfirmDialog
        isOpen={showRemoveSingleDialog}
        onClose={() => {
          setShowRemoveSingleDialog(false);
          setSingleRemoveTarget(null);
        }}
        onConfirm={handleConfirmRemoveSingleTopping}
        title="Gỡ Topping khỏi món"
        message={`Bạn có chắc muốn gỡ topping "${singleRemoveTarget?.topping?.name}" khỏi món "${singleRemoveTarget?.food?.name}"?`}
        confirmText="Gỡ topping"
        cancelText="Hủy"
        type="danger"
      />

      {/* ================= CONFIRM DIALOG: CLEAR ALL TOPPINGS FROM FOOD ================= */}
      <ConfirmDialog
        isOpen={showClearFoodDialog}
        onClose={() => {
          setShowClearFoodDialog(false);
          setClearFoodTarget(null);
        }}
        onConfirm={handleConfirmClearFoodToppings}
        title="Gỡ toàn bộ Topping"
        message={`Bạn có chắc muốn xóa TẤT CẢ topping đang có khỏi món "${clearFoodTarget?.name}"?`}
        confirmText="Xóa tất cả"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
};

export default ManageToppings;
