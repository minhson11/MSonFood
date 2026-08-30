# MSon Food - Fullstack Food Ordering Website

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-brightgreen.svg)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)

A modern, fullstack food ordering platform built with MERN stack (MongoDB, Express.js, React, Node.js). Features include user authentication, menu browsing with advanced filters, shopping cart, order management, and comprehensive admin dashboard.

## 🎯 Project Status

**Current Phase**: PHASE 11 ✅ COMPLETE

**Latest Updates** (Phase 11):
- ✅ Shopping cart with Zustand + localStorage
- ✅ Add/Remove/Increase/Decrease cart items
- ✅ Checkout page with form validation
- ✅ Order creation with backend price calculation
- ✅ Order history page
- ✅ Order detail with status tracking
- ✅ Cancel order functionality
- ✅ Admin order management
- ✅ Coupon system integration
- ✅ Stock management (deduct/restore)
- ✅ Security-first implementation

**Previous Phases**:
- ✅ Complete authentication system (Login, Register, Password Reset)
- ✅ Menu page with search, filter, sort, and pagination
- ✅ Food detail page with cart integration
- ✅ Protected routes with role-based access
- ✅ Full API integration (no mock data)
- ✅ JWT authentication flow
- ✅ Responsive design

## 📚 Documentation

### Phase 11 Documentation (Latest)
- **[PHASE 11 Complete](PHASE_11_COMPLETE.md)** - Complete feature documentation for Cart, Checkout & Orders
- **[PHASE 11 Quick Start](PHASE_11_QUICK_START.md)** - Step-by-step testing guide
- **[PHASE 11 Flow Diagrams](PHASE_11_FLOW_DIAGRAM.md)** - Architecture & flow diagrams

### General Documentation
- **[Project Specification](PROJECT_SPEC_MSon_Food.md)** - Complete project requirements and architecture
- **[PHASE 10 Summary](PHASE_10_SUMMARY.md)** - Feature overview for Phase 10

## ✨ Features

### Customer Features
- 🔐 **Authentication**: Register, Login, Logout, Password Reset
- 🍕 **Menu Browsing**: View all food items with beautiful cards
- 🔍 **Advanced Search**: Search by name or description
- 🏷️ **Category Filter**: Filter foods by category
- 📊 **Sort Options**: Sort by price, rating, or newest
- 📄 **Pagination**: Navigate through items (12 per page)
- 📱 **Food Details**: Detailed product pages with images
- 🛒 **Shopping Cart**: Add items, adjust quantities, persistent cart
- 💳 **Checkout**: Complete checkout with address and payment method
- 🎟️ **Coupons**: Apply discount coupons at checkout
- 📦 **Order History**: View all past orders with status
- 🔍 **Order Tracking**: Visual status timeline for orders
- ❌ **Cancel Orders**: Cancel pending/confirmed orders
- 👤 **Profile Management**: Update info, change password

### Admin Features
- 📦 **Order Management**: View all orders, update status
- 🍔 **Food Management**: CRUD operations (coming soon - UI)
- 📁 **Category Management**: CRUD operations (coming soon - UI)
- 🎟️ **Coupon Management**: CRUD operations (coming soon - UI)
- 📊 **Dashboard**: Statistics & analytics (coming soon)
- 👥 **User Management**: User administration (coming soon)

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool & dev server
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Zustand** - State management
- **React Toastify** - Notifications (planned)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Nodemailer** - Email service
- **cors** - Cross-origin support

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- MongoDB installed and running
- Git installed

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Web-Food
```

2. **Setup Backend**
```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://localhost:27017/mson-food
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
```

3. **Setup Frontend**
```bash
cd ../frontend
npm install
```

Create `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

4. **Seed Database** (Optional)
```bash
cd ../backend
node seed.js
```

5. **Run Application**

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

6. **Access Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

### Default Admin Account (after seeding)
- Email: admin@msonfood.com
- Password: admin123

## 📁 Project Structure

```
Web-Food/
├── backend/              # Node.js backend
│   ├── config/          # Database & email config
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & error middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── .env             # Environment variables
│   ├── seed.js          # Database seeder
│   └── server.js        # Entry point
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── assets/     # Static files
│   │   ├── components/ # Reusable components
│   │   ├── hooks/      # Custom hooks
│   │   ├── layouts/    # Layout components
│   │   ├── pages/      # Page components
│   │   ├── router/     # Route configuration
│   │   ├── services/   # API calls
│   │   ├── store/      # State management
│   │   ├── App.jsx     # Root component
│   │   └── main.jsx    # Entry point
│   └── .env            # Environment variables
│
└── docs/                # Documentation files
    ├── PHASE_10_*.md   # Phase 10 documentation
    └── PROJECT_SPEC*.md # Project specification
```

## 🔑 Key Features Implemented

### Authentication System ✅
- User registration with validation
- JWT-based login
- Password reset via email
- Protected routes
- Role-based access control (customer/admin)
- Profile management
- Password change

### Menu System ✅
- **Search**: Real-time search in name/description
- **Filter**: Filter by category with radio buttons
- **Sort**: Multiple sort options (price, rating, newest)
- **Pagination**: 12 items per page with smart page display
- **URL State**: All filters reflected in URL for sharing
- **Responsive**: Mobile-first design

### Food Detail ✅
- Large product images
- Detailed information
- Quantity selector
- Add to cart functionality
- Buy now (quick checkout)
- Category navigation
- Stock status display

### Shopping Cart ✅ (Phase 11)
- **Zustand Store**: State management with localStorage persistence
- **Add/Remove**: Manage cart items
- **Quantity Control**: Increase/decrease with +/- buttons
- **Cart Counter**: Real-time counter in navbar
- **Subtotal Calculation**: Automatic price calculation
- **Empty State**: Beautiful empty cart UI
- **Responsive**: Works on all devices

### Checkout System ✅ (Phase 11)
- **Contact Form**: Name, phone, address, note
- **Payment Methods**: COD (VNPay, MoMo coming soon)
- **Coupon System**: Apply and validate discount coupons
- **Order Summary**: Real-time price breakdown
- **Validation**: Form validation with error messages
- **Security**: Frontend only sends IDs, backend calculates prices

### Order Management ✅ (Phase 11)
- **Order Creation**: Backend calculates all prices from database
- **Order History**: List all user orders with status
- **Order Detail**: Complete order information with timeline
- **Status Tracking**: Visual progress bar (pending → confirmed → preparing → shipping → completed)
- **Cancel Orders**: Users can cancel pending/confirmed orders
- **Stock Management**: Automatic stock deduction and restoration
- **Coupon Tracking**: Track coupon usage and restore on cancel
- **Admin Controls**: Admin can view all orders and update status

### API Integration ✅
- Axios instance with interceptors
- Auto JWT token attachment
- Error handling with auto-logout
- Service layer architecture
- No mock data - all from API
- Security-first approach (backend validates everything)

## 🧪 Testing

See [Testing Guide](PHASE_10_TESTING_GUIDE.md) for comprehensive test cases.

**Quick Test**:
1. Register a new user
2. Browse menu and search for items
3. Filter by category
4. Sort by price
5. View food details
6. Add items to cart
7. Check cart counter updates
8. Update profile
9. Logout and login again

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
GET    /api/auth/me             - Get current user
PUT    /api/auth/profile        - Update profile
PUT    /api/auth/change-password - Change password
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password
```

### Foods
```
GET    /api/foods               - Get all foods (with filters)
GET    /api/foods/:id           - Get single food
POST   /api/foods               - Create food (admin)
PUT    /api/foods/:id           - Update food (admin)
DELETE /api/foods/:id           - Delete food (admin)
```

### Categories
```
GET    /api/categories          - Get all categories
GET    /api/categories/:id      - Get single category
POST   /api/categories          - Create category (admin)
PUT    /api/categories/:id      - Update category (admin)
DELETE /api/categories/:id      - Delete category (admin)
```

### Orders (Phase 11)
```
POST   /api/orders              - Create new order
GET    /api/orders/my-orders    - Get my orders
GET    /api/orders/:id          - Get order detail
PUT    /api/orders/:id/cancel   - Cancel order
```

### Admin Orders (Phase 11)
```
GET    /api/admin/orders              - Get all orders (with filters)
PUT    /api/admin/orders/:id/status   - Update order status
```

### Coupons
```
GET    /api/coupons             - Get all coupons
GET    /api/coupons/:code       - Get coupon by code
POST   /api/coupons             - Create coupon (admin)
PUT    /api/coupons/:id         - Update coupon (admin)
DELETE /api/coupons/:id         - Delete coupon (admin)
```

See [PHASE_11_COMPLETE.md](PHASE_11_COMPLETE.md) for complete API documentation.

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Protected routes
- ✅ Role-based access control
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variables for secrets
- ✅ Auto-logout on token expiry
- ✅ Secure password reset flow
- ✅ **Backend price calculation** (NEVER trust frontend prices)
- ✅ **Stock management** (prevent overselling)
- ✅ **Coupon validation** (prevent abuse)
- ✅ **Authorization checks** (users only access own data)
- ✅ **Order validation** (food exists, available, sufficient stock)

## 🎨 UI/UX Features

- ✅ Responsive design (mobile-first)
- ✅ Loading states
- ✅ Error handling with user-friendly messages
- ✅ Empty states
- ✅ Success feedback
- ✅ Smooth transitions
- ✅ Intuitive navigation
- ✅ Cart counter badge
- ✅ User dropdown menu

## 📱 Responsive Breakpoints

- Mobile: < 640px (1 column)
- Tablet: 768px (2 columns)
- Desktop: 1024px (3 columns with sidebar)
- Large: 1280px+ (wider containers)

## 🚧 Roadmap

### ✅ Completed (Phase 11)
- Authentication system
- Menu with search/filter/sort/pagination
- Food details
- Protected routes
- API integration
- **Shopping cart with persistence**
- **Checkout with coupon support**
- **Order management system**
- **Order status tracking**
- **Admin order management**
- **Stock management**

### 🔄 In Progress (Phase 12)
- [ ] Admin dashboard UI
- [ ] Food management UI
- [ ] Category management UI
- [ ] Order management UI for admin

### 📅 Upcoming
- [ ] Admin dashboard
- [ ] Food management UI
- [ ] Category management UI
- [ ] Order management
- [ ] Review system
- [ ] Coupon system
- [ ] Payment integration
- [ ] Real-time notifications
- [ ] Order tracking

## 🤝 Contributing

This is a learning project. Follow the development phases outlined in [PROJECT_SPEC_MSon_Food.md](PROJECT_SPEC_MSon_Food.md).

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- Backend API fully functional
- Comprehensive project specification
- Detailed documentation for each phase
- Test data seeder included

## 📞 Support

For issues or questions:
1. Check the [Testing Guide](PHASE_10_TESTING_GUIDE.md)
2. Review [API Documentation](PHASE_10_API_ENDPOINTS.md)
3. Read [Feature Details](PHASE_10_FEATURES.md)
4. Check console errors (both frontend and backend)

## 🎓 Learning Outcomes

This project demonstrates:
- Full-stack development with MERN
- RESTful API design
- JWT authentication
- State management with Zustand
- React hooks and modern patterns
- Responsive design with Tailwind
- Git workflow
- API integration patterns
- Error handling best practices
- Security best practices

---

**Happy Coding! 🚀**

Built with ❤️ using MERN Stack
