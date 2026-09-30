import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages - Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Pages - Public
import Home from '../pages/public/Home';
import Menu from '../pages/public/Menu';
import FoodDetail from '../pages/public/FoodDetail';
import About from '../pages/public/About';
import ComboHot from '../pages/public/ComboHot';
import Contact from '../pages/public/Contact';

// Pages - User
import Cart from '../pages/user/Cart';
import Checkout from '../pages/user/Checkout';
import Orders from '../pages/user/Orders';
import OrderDetail from '../pages/user/OrderDetail';
import OrderSuccess from '../pages/user/OrderSuccess';
import PaymentGateway from '../pages/user/PaymentGateway';
import Profile from '../pages/user/Profile';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import ManageFoods from '../pages/admin/ManageFoods';
import ManageOrders from '../pages/admin/ManageOrders';
import ManageToppings from '../pages/admin/ManageToppings';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageCategories from '../pages/admin/ManageCategories';
import ReviewsManager from '../pages/admin/ReviewsManager';
import ManageCoupons from '../pages/admin/ManageCoupons';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'menu',
        element: <Menu />,
      },
      {
        path: 'about',
        element: <About />,
      },
      {
        path: 'combo-hot',
        element: <ComboHot />,
      },
      {
        path: 'contact',
        element: <Contact />,
      },
      {
        path: 'food/:id',
        element: <FoodDetail />,
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute requireAuth>
            <Checkout />
          </ProtectedRoute>
        ),
      },
      {
        path: 'payment/:id',
        element: (
          <ProtectedRoute requireAuth>
            <PaymentGateway />
          </ProtectedRoute>
        ),
      },
      {
        path: 'order-success/:id',
        element: (
          <ProtectedRoute requireAuth>
            <OrderSuccess />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id/success',
        element: (
          <ProtectedRoute requireAuth>
            <OrderSuccess />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders',
        element: (
          <ProtectedRoute requireAuth>
            <Orders />
          </ProtectedRoute>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <ProtectedRoute requireAuth>
            <OrderDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPassword />,
      },
      {
        path: 'reset-password',
        element: <ResetPassword />,
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute requireAuth>
            <Profile />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAuth requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'foods',
        element: <ManageFoods />,
      },
      {
        path: 'orders',
        element: <ManageOrders />,
      },
      {
        path: 'toppings',
        element: <ManageToppings />,
      },
      {
        path: 'users',
        element: <ManageUsers />,
      },
      {
        path: 'categories',
        element: <ManageCategories />,
      },
      {
        path: 'reviews',
        element: <ReviewsManager />,
      },
      {
        path: 'coupons',
        element: <ManageCoupons />,
      },
      // Add more admin routes here
    ],
  },
]);

export default router;
