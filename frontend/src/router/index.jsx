import { createBrowserRouter } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Menu from '../pages/Menu';
import FoodDetail from '../pages/FoodDetail';
import About from '../pages/About';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import OrderSuccess from '../pages/OrderSuccess';
import Profile from '../pages/Profile';

// Admin Pages
import Dashboard from '../pages/admin/Dashboard';
import ManageFoods from '../pages/admin/ManageFoods';
import ManageOrders from '../pages/admin/ManageOrders';
import ManageToppings from '../pages/admin/ManageToppings';
import ManageUsers from '../pages/admin/ManageUsers';
import ManageCategories from '../pages/admin/ManageCategories';

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
      // Add more admin routes here
    ],
  },
]);

export default router;
