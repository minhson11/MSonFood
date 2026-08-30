import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import foodApi from '../services/foodApi';
import categoryApi from '../services/categoryApi';
import FoodCard from '../components/FoodCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});

  // Get params from URL
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'createdAt';
  const page = parseInt(searchParams.get('page')) || 1;

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryApi.getAllCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch foods
  useEffect(() => {
    const fetchFoods = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          page,
          limit: 12,
        };
        
        if (search) params.search = search;
        if (category) params.category = category;
        if (sort) params.sort = sort;

        const response = await foodApi.getAllFoods(params);
        setFoods(response.data || []);
        setPagination(response.pagination || {});
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách món ăn');
      } finally {
        setLoading(false);
      }
    };

    fetchFoods();
  }, [search, category, sort, page]);

  // Update URL params
  const updateParams = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filters change
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    updateParams('search', formData.get('search'));
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="container-custom py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Thực Đơn</h1>
        <p className="text-gray-600">Khám phá bộ sưu tập món ăn ngon của chúng tôi</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Tìm kiếm món ăn..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="card sticky top-20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Bộ Lọc</h3>
              {(search || category || sort !== 'createdAt') && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Xóa Tất Cả
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Danh Mục</h4>
              <div className="space-y-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={!category}
                    onChange={() => updateParams('category', '')}
                    className="mr-2"
                  />
                  <span className="text-sm">Tất Cả Danh Mục</span>
                </label>
                {categories.map((cat) => (
                  <label key={cat._id} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={category === cat._id}
                      onChange={() => updateParams('category', cat._id)}
                      className="mr-2"
                    />
                    <span className="text-sm">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <h4 className="font-semibold mb-3">Sắp Xếp Theo</h4>
              <select
                value={sort}
                onChange={(e) => updateParams('sort', e.target.value)}
                className="input-field w-full"
              >
                <option value="createdAt">Mới Nhất</option>
                <option value="price_asc">Giá: Thấp đến Cao</option>
                <option value="price_desc">Giá: Cao đến Thấp</option>
                <option value="rating_desc">Đánh Giá: Cao đến Thấp</option>
                <option value="rating_asc">Đánh Giá: Thấp đến Cao</option>
              </select>
            </div>
          </div>
        </div>

        {/* Foods Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading />
            </div>
          ) : error ? (
            <ErrorMessage message={error} />
          ) : foods.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy món ăn</h3>
              <p className="text-gray-500">Thử điều chỉnh tìm kiếm hoặc bộ lọc của bạn</p>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div className="mb-4 text-sm text-gray-600">
                Hiển thị {foods.length} trong số {pagination.total} kết quả
              </div>

              {/* Foods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {foods.map((food) => (
                  <FoodCard key={food._id} food={food} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <button
                    onClick={() => updateParams('page', page - 1)}
                    disabled={page === 1}
                    className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  <div className="flex gap-1">
                    {[...Array(pagination.totalPages)].map((_, index) => {
                      const pageNum = index + 1;
                      // Show first, last, current, and adjacent pages
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= page - 1 && pageNum <= page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => updateParams('page', pageNum)}
                            className={`px-3 py-1 rounded ${
                              page === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (pageNum === page - 2 || pageNum === page + 2) {
                        return <span key={pageNum} className="px-2">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => updateParams('page', page + 1)}
                    disabled={page === pagination.totalPages}
                    className="btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
