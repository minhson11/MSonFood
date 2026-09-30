const mongoose = require('mongoose');
require('dotenv').config();
const Category = require('./models/Category');
const Food = require('./models/Food');

const combosToAdd = [
  {
    name: 'Combo Đột Phá 6 Món Thịnh Soạn',
    price: 249000,
    originalPrice: 350000,
    badge: 'BEST SELLER #1',
    rating: 4.9,
    reviewCount: 1420,
    comboGroup: 'family',
    items: [
      '🍗 4 Miếng Gà Rán Giòn Rụm',
      '🍔 1 Burger Gà 2 Tầng Nướng',
      '🍕 1 Pizza Cỡ Vừa Bò Tiêu Đen',
      '🍟 1 Khoai Lắc Phô Mai',
      '🥤 2 Ly Coca-Cola Tươi'
    ],
    description: '4 Miếng Gà Rán Giòn Rụm, 1 Burger Gà 2 Tầng Nướng, 1 Pizza Cỡ Vừa Bò Tiêu Đen, 1 Khoai Lắc Phô Mai, 2 Ly Coca-Cola Tươi',
    image: '/combos/deal_breakthrough.png',
    stock: 50,
    isAvailable: true
  },
  {
    name: 'Xô Gà Cay Hoàng Kim Siêu Tiết Kiệm',
    price: 199000,
    originalPrice: 289000,
    badge: 'SIÊU CAY BÙNG NỔ',
    rating: 4.8,
    reviewCount: 980,
    comboGroup: '1-2',
    items: [
      '🍗 6 Miếng Gà Giòn Sốt Cay Đậm Đà',
      '🍿 1 Hộp Gà Popcorn Cỡ Lớn',
      '🥤 1 Chai Pepsi Lớn 1.5L',
      '🧈 2 Hũ Sốt Chấm Hoàng Kim'
    ],
    description: '6 Miếng Gà Giòn Sốt Cay Đậm Đà, 1 Hộp Gà Popcorn Cỡ Lớn, 1 Chai Pepsi Lớn 1.5L, 2 Hũ Sốt Chấm Hoàng Kim',
    image: '/combos/deal_golden_bucket.png',
    stock: 50,
    isAvailable: true
  },
  {
    name: 'Combo Đôi Bạn Rộn Ràng',
    price: 129000,
    originalPrice: 175000,
    badge: 'TIẾT KIỆM',
    rating: 4.8,
    reviewCount: 520,
    comboGroup: '1-2',
    items: [
      '2 Burger Gà Giòn Tươi Sốt Phô Mai',
      '1 Khoai Tây Chiên Cỡ Vừa',
      '2 Ly Nước Ngọt Có Ga Tự Chọn'
    ],
    description: '2 Burger Gà Giòn Tươi Sốt Phô Mai, 1 Khoai Tây Chiên Cỡ Vừa, 2 Ly Nước Ngọt Có Ga Tự Chọn',
    image: '/combos/grid_duo_burger.png',
    stock: 50,
    isAvailable: true
  },
  {
    name: 'Combo Gà Giòn & Popcorn',
    price: 109000,
    originalPrice: 145000,
    badge: 'GIÒN TAN',
    rating: 4.7,
    reviewCount: 430,
    comboGroup: '1-2',
    items: [
      '3 Miếng Gà Rán Giòn Tiêu Cay',
      '1 Hộp Gà Popcorn Cỡ Vừa (12 Viên)',
      '1 Ly Trà Đào Cam Sả Tươi Mát'
    ],
    description: '3 Miếng Gà Rán Giòn Tiêu Cay, 1 Hộp Gà Popcorn Cỡ Vừa (12 Viên), 1 Ly Trà Đào Cam Sả Tươi Mát',
    image: '/combos/grid_chicken_popcorn.png',
    stock: 50,
    isAvailable: true
  },
  {
    name: 'Combo Gia Đình Trọn Vẹn',
    price: 265000,
    originalPrice: 380000,
    badge: 'GIA ĐÌNH',
    rating: 4.9,
    reviewCount: 890,
    comboGroup: 'family',
    items: [
      '5 Miếng Gà Rán Giòn (Tự chọn vị)',
      '1 Burger Tôm Tươi Xốt Tartar',
      '1 Khoai Múi Cau & 1 Xúp Rong Biển',
      '4 Ly Nước Ngọt Thượng Hạng'
    ],
    description: '5 Miếng Gà Rán Giòn (Tự chọn vị), 1 Burger Tôm Tươi Xốt Tartar, 1 Khoai Múi Cau & 1 Xúp Rong Biển, 4 Ly Nước Ngọt Thượng Hạng',
    image: '/combos/grid_family_feast.png',
    stock: 50,
    isAvailable: true
  },
  {
    name: 'Party Box Bung Xõa Hết Mình',
    price: 439000,
    originalPrice: 650000,
    badge: 'PARTY BOX',
    rating: 5.0,
    reviewCount: 1100,
    comboGroup: 'party',
    items: [
      '12 Miếng Gà Rán Siêu Cay Tự Hảo',
      '2 Pizza Cỡ Lớn (Hải Sản & Thập Cẩm P1)',
      '2 Phần Khoai Tây Lắc Phô Mai Lớn',
      '3 Chai Coca-Cola 1.5L'
    ],
    description: '12 Miếng Gà Rán Siêu Cay Tự Hảo, 2 Pizza Cỡ Lớn (Hải Sản & Thập Cẩm P1), 2 Phần Khoai Tây Lắc Phô Mai Lớn, 3 Chai Coca-Cola 1.5L',
    image: '/combos/grid_party_box.png',
    stock: 40,
    isAvailable: true
  },
  {
    name: 'Combo Phô Mai Béo Ngậy',
    price: 148000,
    originalPrice: 199000,
    badge: 'PHÔ MAI',
    rating: 4.8,
    reviewCount: 670,
    comboGroup: '1-2',
    items: [
      '2 Burger Bò Nướng Phủ Phô Mai Cheddar',
      '4 Que Phô Mai Mozzarella Kéo Sợi',
      '2 Ly Nước Chanh Tươi Mát Lạnh'
    ],
    description: '2 Burger Bò Nướng Phủ Phô Mai Cheddar, 4 Que Phô Mai Mozzarella Kéo Sợi, 2 Ly Nước Chanh Tươi Mát Lạnh',
    image: '/combos/grid_cheese_burger.png',
    stock: 50,
    isAvailable: true
  },
  {
    name: 'Combo Đội Nhóm Vô Địch',
    price: 590000,
    originalPrice: 850000,
    badge: 'ĐỘI NHÓM',
    rating: 4.9,
    reviewCount: 760,
    comboGroup: 'party',
    items: [
      '16 Miếng Gà Rán Giòn Đa Hương Vị',
      '4 Mì Ý Sốt Bò Nướng Tươi Cay',
      '3 Xúp Khoai Tây Chiên Cực Đại',
      '8 Ly Nước Có Ga Tùy Chọn Hương Vị'
    ],
    description: '16 Miếng Gà Rán Giòn Đa Hương Vị, 4 Mì Ý Sốt Bò Nướng Tươi Cay, 3 Xúp Khoai Tây Chiên Cực Đại, 8 Ly Nước Có Ga Tùy Chọn Hương Vị',
    image: '/combos/grid_team_champion.png',
    stock: 30,
    isAvailable: true
  }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    let comboCat = await Category.findOne({ name: { $regex: /combo/i } });
    if (!comboCat) {
      comboCat = await Category.create({
        name: 'Combo',
        description: 'Value combo meals',
        image: 'https://images.unsplash.com/photo-1585238341710-4a4b89c36110?w=500'
      });
      console.log('Created Combo category:', comboCat._id);
    }

    for (const combo of combosToAdd) {
      const existing = await Food.findOne({ name: combo.name });
      if (existing) {
        Object.assign(existing, {
          ...combo,
          category: comboCat._id
        });
        await existing.save();
        console.log(`Updated combo: ${combo.name}`);
      } else {
        await Food.create({
          ...combo,
          category: comboCat._id
        });
        console.log(`Created new combo: ${combo.name}`);
      }
    }

    console.log('🎉 All 8 combos are ready in MongoDB!');
    process.exit(0);
  } catch (err) {
    console.error('Error running combo script:', err);
    process.exit(1);
  }
}

run();
