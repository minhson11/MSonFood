import useAuthStore from '../store/authStore';

const useAuth = () => {
  const { user, token, isAuthenticated, setAuth, logout, updateUser } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isCustomer,
    setAuth,
    logout,
    updateUser,
  };
};

export default useAuth;
