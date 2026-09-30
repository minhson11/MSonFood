/**
 * Geolocation & Reverse/Forward Geocoding Utility for MSon Food
 * Hỗ trợ lấy vị trí GPS thực tế và tìm kiếm/định vị địa chỉ khi người dùng nhập thủ công.
 */

// Danh mục tọa độ các quận/huyện/phường phổ biến tại Hà Nội & Việt Nam để fallback tức thì
const VIETNAM_LOCATION_DICTIONARY = [
  // Hà Nội - Các quận nội thành & ngoại thành
  { name: 'Phú Lương, Hà Đông, Hà Nội', keywords: ['phu luong', 'phú lương'], lat: 20.9324, lng: 105.7725 },
  { name: 'Hà Đông, Hà Nội', keywords: ['ha dong', 'hà đông'], lat: 20.9634, lng: 105.7645 },
  { name: 'Cầu Giấy, Hà Nội', keywords: ['cau giay', 'cầu giấy'], lat: 21.0362, lng: 105.7905 },
  { name: 'Hoàn Kiếm, Hà Nội', keywords: ['hoan kiem', 'hoàn kiếm', 'tràng tiền', 'hồ gươm'], lat: 21.0285, lng: 105.8542 },
  { name: 'Ba Đình, Hà Nội', keywords: ['ba dinh', 'ba đình', 'kim mã', 'lăng bác', 'đội cấn'], lat: 21.0341, lng: 105.8239 },
  { name: 'Đống Đa, Hà Nội', keywords: ['dong da', 'đống đa', 'xã đàn', 'chùa bộc', 'thái hà'], lat: 21.0181, lng: 105.8299 },
  { name: 'Thanh Xuân, Hà Nội', keywords: ['thanh xuan', 'thanh xuân', 'nguyễn trãi', 'khương đình'], lat: 20.9937, lng: 105.8118 },
  { name: 'Hai Bà Trưng, Hà Nội', keywords: ['hai ba trung', 'hai bà trưng', 'bạch mai', 'minh khai', 'times city'], lat: 21.0063, lng: 105.8576 },
  { name: 'Hoàng Mai, Hà Nội', keywords: ['hoang mai', 'hoàng mai', 'linh đàm', 'định công', 'giáp bát'], lat: 20.9744, lng: 105.8544 },
  { name: 'Tây Hồ, Hà Nội', keywords: ['tay ho', 'tây hồ', 'hồ tây', 'xuân diệu', 'lạc long quân'], lat: 21.0664, lng: 105.8194 },
  { name: 'Nam Từ Liêm, Hà Nội', keywords: ['nam tu liem', 'nam từ liêm', 'mỹ đình', 'mễ trì', 'lê đức thọ'], lat: 21.0152, lng: 105.7656 },
  { name: 'Bắc Từ Liêm, Hà Nội', keywords: ['bac tu liem', 'bắc từ liêm', 'cổ nhuế', 'nhổn', 'xuân đỉnh'], lat: 21.0601, lng: 105.7554 },
  { name: 'Long Biên, Hà Nội', keywords: ['long bien', 'long biên', 'nguyễn văn cừ', 'ngọc lâm', 'aeon long biên'], lat: 21.0427, lng: 105.8927 },
  { name: 'Thanh Trì, Hà Nội', keywords: ['thanh tri', 'thanh trì', 'văn điển'], lat: 20.9466, lng: 105.8456 },
  { name: 'Gia Lâm, Hà Nội', keywords: ['gia lam', 'gia lâm', 'ocean park', 'trâu quỳ'], lat: 21.0194, lng: 105.9392 },
  { name: 'Đông Anh, Hà Nội', keywords: ['dong anh', 'đông anh'], lat: 21.1372, lng: 105.8466 },
  { name: 'Hoài Đức, Hà Nội', keywords: ['hoai duc', 'hoài đức', 'an khánh', 'trạm trôi'], lat: 21.0253, lng: 105.7082 },
  { name: 'Thường Tín, Hà Nội', keywords: ['thuong tin', 'thường tín'], lat: 20.8719, lng: 105.8647 },
  { name: 'Sơn Tây, Hà Nội', keywords: ['son tay', 'sơn tây'], lat: 21.1378, lng: 105.5053 },
  // TP. Hồ Chí Minh & Các tỉnh khác
  { name: 'Quận 1, TP. Hồ Chí Minh', keywords: ['quan 1', 'quận 1', 'bến thành', 'sài gòn'], lat: 10.7769, lng: 106.7009 },
  { name: 'Quận 3, TP. Hồ Chí Minh', keywords: ['quan 3', 'quận 3'], lat: 10.7844, lng: 106.6843 },
  { name: 'Quận Bình Thạnh, TP. Hồ Chí Minh', keywords: ['binh thanh', 'bình thạnh'], lat: 10.8106, lng: 106.7091 },
  { name: 'TP. Đà Nẵng', keywords: ['da nang', 'đà nẵng', 'hải châu'], lat: 16.0544, lng: 108.2022 },
];

// Hàm bỏ dấu tiếng Việt để tìm kiếm mờ (fuzzy search)
const removeVietnameseTones = (str) => {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

// 1. Lấy vị trí thực tế qua GPS của thiết bị
export const getRealLocation = async () => {
  if (!navigator.geolocation) {
    throw new Error('Trình duyệt của bạn không hỗ trợ định vị GPS.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // 1. Ưu tiên BigDataCloud Reverse Geocoding API (rất nhanh, miễn phí, không bị chặn DNS tại VN)
        try {
          const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=vi`;
          const bdcRes = await fetch(bdcUrl);
          if (bdcRes.ok) {
            const bdcData = await bdcRes.json();
            const parts = [
              bdcData.locality,
              bdcData.city,
              bdcData.principalSubdivision,
            ].filter(Boolean);

            if (parts.length > 0) {
              resolve({
                lat: latitude,
                lng: longitude,
                accuracy,
                formattedAddress: parts.join(', '),
                city: bdcData.city || bdcData.principalSubdivision || '',
                district: bdcData.locality || '',
                ward: '',
                displayName: parts.join(', '),
              });
              return;
            }
          }
        } catch {
          // Tự động chuyển tiếp sang phương án dự phòng
        }

        // 2. Dự phòng: Thử OpenStreetMap Nominatim
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
          const response = await fetch(nominatimUrl, {
            headers: {
              'Accept-Language': 'vi, en',
            },
          });

          if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};

            const parts = [];
            const streetNumber = addr.house_number || '';
            const road = addr.road || addr.street || addr.pedestrian || addr.suburb || '';
            if (streetNumber && road) {
              parts.push(`${streetNumber} ${road}`);
            } else if (road) {
              parts.push(road);
            }

            const ward = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || addr.ward || '';
            if (ward && !parts.includes(ward)) {
              parts.push(ward.startsWith('Phường') || ward.startsWith('Xã') ? ward : `Phường/Xã ${ward}`);
            }

            const district = addr.city_district || addr.district || addr.county || addr.town || '';
            if (district && !parts.includes(district)) {
              parts.push(district.startsWith('Quận') || district.startsWith('Huyện') ? district : `Quận/Huyện ${district}`);
            }

            const city = addr.city || addr.state || addr.province || '';
            if (city && !parts.includes(city)) {
              parts.push(city);
            }

            const formattedAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || `Vị trí (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);

            resolve({
              lat: latitude,
              lng: longitude,
              accuracy,
              formattedAddress,
              city,
              district,
              ward,
              displayName: data.display_name,
            });
            return;
          }
        } catch {
          // Lỗi DNS hoặc chặn mạng được bắt êm để không làm đỏ console
        }

        resolve({
          lat: latitude,
          lng: longitude,
          accuracy,
          formattedAddress: `Tọa độ GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          city: '',
          district: '',
        });
      },
      (error) => {
        let msg = 'Không thể truy cập vị trí hiện tại.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Bạn đã từ chối quyền truy cập vị trí. Vui lòng cho phép quyền định vị trong trình duyệt.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Thông tin vị trí không khả dụng.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Hết thời gian yêu cầu vị trí GPS.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
};

// 2. Tìm kiếm gợi ý địa chỉ khi người dùng nhập tay (Multi-source Forward Geocoding)
export const searchAddressSuggestions = async (query) => {
  if (!query || query.trim().length < 2) return [];
  const cleanQuery = query.trim();
  const normalizedQuery = removeVietnameseTones(cleanQuery);

  const results = [];

  // A. Kiểm tra từ điển địa danh Việt Nam (khớp nhanh chính xác tức thì)
  const dictMatches = VIETNAM_LOCATION_DICTIONARY.filter((item) =>
    item.keywords.some((kw) => normalizedQuery.includes(kw) || kw.includes(normalizedQuery))
  );

  dictMatches.forEach((match, idx) => {
    results.push({
      id: `dict-${idx}-${match.lat}`,
      name: match.name,
      formattedAddress: match.name,
      displayName: match.name,
      lat: match.lat,
      lng: match.lng,
    });
  });

  // B. Tìm kiếm qua Photon Komoot API (Nhanh, CORS mở, hỗ trợ OSM toàn cầu)
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery + ' Việt Nam')}&lat=21.0285&lon=105.8542&limit=5`;
    const photonRes = await fetch(photonUrl);
    if (photonRes.ok) {
      const photonData = await photonRes.json();
      if (photonData.features && photonData.features.length > 0) {
        photonData.features.forEach((feat, idx) => {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [];
          if (coords.length >= 2) {
            const lng = coords[0];
            const lat = coords[1];
            const parts = [
              props.name || props.street,
              props.district || props.suburb || props.locality,
              props.city || props.state,
              props.country || 'Việt Nam',
            ].filter(Boolean);

            const formatted = parts.length > 0 ? parts.join(', ') : cleanQuery;
            // Tránh trùng lặp
            if (!results.some((r) => Math.abs(r.lat - lat) < 0.005 && Math.abs(r.lng - lng) < 0.005)) {
              results.push({
                id: `photon-${idx}-${props.osm_id || idx}`,
                name: props.name || cleanQuery,
                formattedAddress: formatted,
                displayName: formatted,
                lat,
                lng,
              });
            }
          }
        });
      }
    }
  } catch (err) {
    console.warn('Photon geocoding error:', err);
  }

  // C. Tìm kiếm qua OpenStreetMap Nominatim
  try {
    const nominatimQuery = cleanQuery.toLowerCase().includes('việt nam') || cleanQuery.toLowerCase().includes('hà nội')
      ? cleanQuery
      : `${cleanQuery}, Hà Nội, Việt Nam`;
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(nominatimQuery)}&countrycodes=vn&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'vi, en',
      },
    });

    if (response.ok) {
      const data = await response.json();
      data.forEach((item) => {
        const addr = item.address || {};
        const parts = [];

        const streetNumber = addr.house_number || '';
        const road = addr.road || addr.street || addr.pedestrian || addr.suburb || '';
        if (streetNumber && road) {
          parts.push(`${streetNumber} ${road}`);
        } else if (road) {
          parts.push(road);
        }

        const ward = addr.quarter || addr.suburb || addr.neighbourhood || addr.village || addr.ward || '';
        if (ward && !parts.includes(ward)) parts.push(ward);

        const district = addr.city_district || addr.district || addr.county || addr.town || '';
        if (district && !parts.includes(district)) parts.push(district);

        const city = addr.city || addr.state || addr.province || '';
        if (city && !parts.includes(city)) parts.push(city);

        const formatted = parts.length > 0 ? parts.join(', ') : item.display_name;
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (!results.some((r) => Math.abs(r.lat - lat) < 0.005 && Math.abs(r.lng - lng) < 0.005)) {
          results.push({
            id: `nom-${item.place_id}`,
            name: item.name || road || cleanQuery,
            formattedAddress: formatted,
            displayName: item.display_name,
            lat,
            lng,
          });
        }
      });
    }
  } catch {
    // Bỏ qua nếu DNS Nominatim không phản hồi
  }

  return results.slice(0, 6);
};

// 3. Geocode trực tiếp một chuỗi địa chỉ sang tọa độ { lat, lng, formattedAddress }
export const geocodeAddress = async (addressText) => {
  if (!addressText || !addressText.trim()) return null;

  try {
    const results = await searchAddressSuggestions(addressText);
    if (results && results.length > 0) {
      return results[0];
    }
  } catch (error) {
    console.warn('Geocode single address error:', error);
  }

  // Nếu không tìm được kết quả trực tuyến, kiểm tra từ điển offline
  const normalized = removeVietnameseTones(addressText);
  const found = VIETNAM_LOCATION_DICTIONARY.find((item) =>
    item.keywords.some((kw) => normalized.includes(kw))
  );

  if (found) {
    return {
      name: found.name,
      formattedAddress: addressText,
      lat: found.lat,
      lng: found.lng,
    };
  }

  // Mặc định fallback Hà Nội trung tâm
  return {
    name: addressText,
    formattedAddress: addressText,
    lat: 21.0285,
    lng: 105.8542,
  };
};
