const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Category = require('./models/Category');
const Food = require('./models/Food');
const Coupon = require('./models/Coupon');
const Topping = require('./models/Topping');

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing data
    await User.deleteMany();
    await Category.deleteMany();
    await Food.deleteMany();
    await Coupon.deleteMany();
    await Topping.deleteMany();
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin MSon Food',
      email: 'admin@msonfood.com',
      password: 'Admin@123',
      phone: '0900000000',
      role: 'admin'
    });
    console.log('👤 Admin created:', admin.email);

    // Create customer users
    const customer1 = await User.create({
      name: 'Nguyen Van A',
      email: 'vana@example.com',
      password: '123456',
      phone: '0901111111'
    });

    const customer2 = await User.create({
      name: 'Tran Thi B',
      email: 'thib@example.com',
      password: '123456',
      phone: '0902222222'
    });

    console.log('👥 Customers created:', customer1.email, customer2.email);

    // Create categories
    const categoryBurger = await Category.create({
      name: 'Burger',
      description: 'Juicy burgers with fresh ingredients',
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500'
    });

    const categoryChicken = await Category.create({
      name: 'Chicken',
      description: 'Crispy fried chicken',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500'
    });

    const categoryPizza = await Category.create({
      name: 'Pizza',
      description: 'Delicious pizzas with various toppings',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500'
    });

    const categoryFries = await Category.create({
      name: 'French Fries',
      description: 'Crispy golden fries',
      image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500'
    });

    const categoryDrinks = await Category.create({
      name: 'Drinks',
      description: 'Refreshing beverages',
      image: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=500'
    });

    const categoryCombo = await Category.create({
      name: 'Combo',
      description: 'Value combo meals',
      image: 'https://images.unsplash.com/photo-1585238341710-4a4b89c36110?w=500'
    });

    console.log('📂 Categories created: 6');

    // Create toppings
    const toppingCheese = await Topping.create({
      name: 'Thêm phô mai',
      price: 10000,
      description: 'Phô mai Cheddar béo ngậy tan chảy',
      isActive: true
    });

    const toppingBacon = await Topping.create({
      name: 'Thêm bacon',
      price: 15000,
      description: 'Thịt xông khói áp chảo giòn thơm',
      isActive: true
    });

    const toppingEgg = await Topping.create({
      name: 'Thêm trứng',
      price: 8000,
      description: 'Trứng ốp la lòng đào béo ngậy',
      isActive: true
    });

    const toppingMushroom = await Topping.create({
      name: 'Thêm nấm sốt BBQ',
      price: 12000,
      description: 'Nấm xào sốt BBQ đậm đà',
      isActive: true
    });

    const toppingSausage = await Topping.create({
      name: 'Thêm xúc xích hun khói',
      price: 15000,
      description: 'Xúc xích bò hun khói cao cấp',
      isActive: true
    });

    const toppingOutStock = await Topping.create({
      name: 'Phô mai que Mozzarella (Tạm hết)',
      price: 20000,
      description: 'Phô mai kéo sợi thơm lừng',
      isActive: false
    });

    console.log('🧀 Toppings created: 6');

    // Standard burger variants
    const burgerVariants = [
      { name: 'Burger đơn', price: 0, isAvailable: true, isDefault: true },
      { name: 'Burger + Khoai tây chiên', price: 20000, isAvailable: true },
      { name: 'Burger + Khoai + Coca', price: 30000, isAvailable: true }
    ];

    // Standard pizza sizes
    const pizzaSizes = [
      { name: 'Size S (20cm)', price: 0, isAvailable: true },
      { name: 'Size M (25cm)', price: 35000, isAvailable: true },
      { name: 'Size L (30cm)', price: 65000, isAvailable: true }
    ];

    // Standard chicken pieces
    const chickenVariants = [
      { name: '2 miếng', price: 0, isAvailable: true, isDefault: true },
      { name: '4 miếng', price: 40000, isAvailable: true },
      { name: '6 miếng', price: 75000, isAvailable: true }
    ];

    // Standard drink sizes
    const drinkSizes = [
      { name: 'Size S (Nhỏ)', price: 0, isAvailable: true },
      { name: 'Size M (Vừa)', price: 5000, isAvailable: true },
      { name: 'Size L (Lớn)', price: 10000, isAvailable: true }
    ];

    // Create foods
    const foods = await Food.create([
      // Burgers
      {
        name: 'Classic Beef Burger',
        description: 'Bò nướng than hoa mềm mọng kết hợp xà lách tươi, cà chua, hành tây và sốt đặc biệt',
        price: 59000,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
        category: categoryBurger._id,
        stock: 50,
        rating: 4.9,
        isAvailable: true,
        variants: burgerVariants,
        toppings: [toppingCheese._id, toppingBacon._id, toppingEgg._id, toppingOutStock._id]
      },
      {
        name: 'Chicken Burger',
        description: 'Phi lê gà giòn rụm với sốt mayonnaise tỏi ớt béo ngậy và xà lách giòn',
        price: 55000,
        image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=500',
        category: categoryBurger._id,
        stock: 45,
        rating: 4.6,
        isAvailable: true,
        variants: burgerVariants,
        toppings: [toppingCheese._id, toppingBacon._id, toppingEgg._id]
      },
      {
        name: 'Cheese Burger',
        description: 'Nhân đôi bò Úc thượng hạng phủ phô mai Cheddar tan chảy thơm lừng',
        price: 69000,
        image: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500',
        category: categoryBurger._id,
        stock: 40,
        rating: 4.9,
        isAvailable: true,
        variants: burgerVariants,
        toppings: [toppingCheese._id, toppingBacon._id, toppingEgg._id, toppingMushroom._id]
      },
      {
        name: 'Bacon Burger',
        description: 'Thịt bò kết hợp dải thịt xông khói chiên giòn và sốt BBQ đậm vị',
        price: 75000,
        image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500',
        category: categoryBurger._id,
        stock: 35,
        rating: 4.7,
        isAvailable: true,
        variants: burgerVariants,
        toppings: [toppingCheese._id, toppingBacon._id, toppingEgg._id]
      },
      // Chicken
      {
        name: 'Gà Rán Giòn Cay',
        description: 'Gà rán da giòn tan với công thức 11 loại gia vị bí truyền đậm đà',
        price: 45000,
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500',
        category: categoryChicken._id,
        stock: 60,
        rating: 4.8,
        isAvailable: true,
        variants: chickenVariants,
        toppings: [toppingCheese._id]
      },
      {
        name: 'Cánh Gà Sốt Chua Cay',
        description: 'Cánh gà chiên giòn quyện đẫm sốt chua cay Buffalo cay nồng',
        price: 65000,
        image: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500',
        category: categoryChicken._id,
        stock: 50,
        rating: 4.5,
        isAvailable: true,
        variants: chickenVariants
      },
      {
        name: 'Gà Không Xương Tenders',
        description: 'Ức gà phi lê tẩm bột chiên vàng kèm sốt mật ong mù tạt',
        price: 55000,
        image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500',
        category: categoryChicken._id,
        stock: 45,
        rating: 4.6,
        isAvailable: true,
        variants: [
          { name: '3 miếng', price: 0, isAvailable: true, isDefault: true },
          { name: '5 miếng', price: 30000, isAvailable: true },
          { name: '8 miếng', price: 65000, isAvailable: true }
        ]
      },
      // Pizza
      {
        name: 'Pizza Pepperoni',
        description: 'Xúc xích Pepperoni Ý hảo hạng phủ ngập phô mai Mozzarella kéo sợi',
        price: 99000,
        image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500',
        category: categoryPizza._id,
        stock: 30,
        rating: 4.9,
        isAvailable: true,
        sizes: pizzaSizes,
        toppings: [toppingCheese._id, toppingSausage._id, toppingMushroom._id]
      },
      {
        name: 'Pizza Hawaiian',
        description: 'Thịt dăm bông cao cấp kết hợp dứa nhiệt đới thơm ngọt và phô mai',
        price: 95000,
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500',
        category: categoryPizza._id,
        stock: 28,
        rating: 4.5,
        isAvailable: true,
        sizes: pizzaSizes,
        toppings: [toppingCheese._id, toppingSausage._id]
      },
      {
        name: 'Pizza Rau Củ Nấm',
        description: 'Ớt chuông đỏ, nấm tươi, ô liu đen và hành tây sốt cà chua thảo mộc',
        price: 89000,
        image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=500',
        category: categoryPizza._id,
        stock: 25,
        rating: 4.4,
        isAvailable: true,
        sizes: pizzaSizes,
        toppings: [toppingCheese._id, toppingMushroom._id]
      },
      {
        name: 'Pizza Gà Sốt BBQ',
        description: 'Gà nướng xé nhỏ cùng sốt BBQ khói, phô mai và hành tây caramel',
        price: 105000,
        image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500',
        category: categoryPizza._id,
        stock: 22,
        rating: 4.8,
        isAvailable: true,
        sizes: pizzaSizes,
        toppings: [toppingCheese._id, toppingBacon._id, toppingMushroom._id]
      },
      // French Fries
      {
        name: 'Khoai Tây Chiên Truyền Thống',
        description: 'Khoai tây cắt que chiên giòn rụm rắc muối tiêu nhẹ',
        price: 25000,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
        category: categoryFries._id,
        stock: 100,
        rating: 4.5,
        isAvailable: true,
        sizes: [
          { name: 'Phần vừa', price: 0, isAvailable: true },
          { name: 'Phần lớn', price: 15000, isAvailable: true }
        ],
        toppings: [toppingCheese._id, toppingBacon._id]
      },
      {
        name: 'Khoai Tây Lắc Phô Mai',
        description: 'Khoai tây nóng hổi lắc đẫm bột phô mai béo ngậy thơm lừng',
        price: 35000,
        image: 'https://images.unsplash.com/photo-1630431341973-02e1f6fe75ca?w=500',
        category: categoryFries._id,
        stock: 80,
        rating: 4.7,
        isAvailable: true,
        sizes: [
          { name: 'Phần vừa', price: 0, isAvailable: true },
          { name: 'Phần lớn', price: 15000, isAvailable: true }
        ]
      },
      // Drinks
      {
        name: 'Coca Cola Mát Lạnh',
        description: 'Nước ngọt có gas sảng khoái đánh tan cơn khát',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=500',
        category: categoryDrinks._id,
        stock: 200,
        rating: 4.8,
        isAvailable: true,
        sizes: drinkSizes
      },
      {
        name: 'Pepsi Không Calo',
        description: 'Nước ngọt Pepsi Zero sảng khoái vị thơm ngon',
        price: 15000,
        image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=500',
        category: categoryDrinks._id,
        stock: 200,
        rating: 4.7,
        isAvailable: true,
        sizes: drinkSizes
      },
      {
        name: 'Nước Cam Ép Nguyên Chất',
        description: 'Nước cam tươi 100% vắt trong ngày dồi dào Vitamin C',
        price: 25000,
        image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500',
        category: categoryDrinks._id,
        stock: 150,
        rating: 4.6,
        isAvailable: true,
        sizes: drinkSizes
      },
      // Combos
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
        category: categoryCombo._id,
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
        category: categoryCombo._id,
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
        category: categoryCombo._id,
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
        category: categoryCombo._id,
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
        category: categoryCombo._id,
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
        category: categoryCombo._id,
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
        category: categoryCombo._id,
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
        category: categoryCombo._id,
        stock: 30,
        isAvailable: true
      },
      {
        name: 'Burger Combo Tiết Kiệm',
        description: 'Gồm 1 Classic Beef Burger + 1 Khoai tây chiên giòn + 1 Coca Cola mát lạnh',
        price: 89000,
        image: 'https://images.unsplash.com/photo-1585238341710-4a4b89c36110?w=500',
        category: categoryCombo._id,
        stock: 40,
        rating: 4.9,
        isAvailable: true,
        toppings: [toppingCheese._id, toppingBacon._id, toppingEgg._id]
      },
      {
        name: 'Family Combo Đầy Đặn',
        description: '4 miếng Gà rán giòn + 2 Burger bò + 2 Khoai chiên + 4 Ly nước ngọt',
        price: 259000,
        image: 'https://images.unsplash.com/photo-1619221882004-2a42d7ea5e5b?w=500',
        category: categoryCombo._id,
        stock: 20,
        rating: 5.0,
        isAvailable: true
      }
    ]);

    console.log('🍔 Foods created: 20');

    console.log('\n✅ Seed data completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Users: 3 (1 admin, 2 customers)');
    console.log('- Categories: 6');
    console.log('- Foods: 20');
    console.log('\n📝 Test Accounts:');
    console.log('Admin: admin@msonfood.com / Admin@123');
    console.log('Customer 1: vana@example.com / 123456');
    console.log('Customer 2: thib@example.com / 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
