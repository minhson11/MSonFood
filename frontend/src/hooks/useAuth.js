import useAuthStore from '../store/authStore';

const useAuth = () => {
  const { user, token, isAuthenticated, isHydrated, setAuth, logout, updateUser } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return {
    user,
    token,
    isAuthenticated,
    isHydrated,
    isAdmin,
    isCustomer,
    setAuth,
    logout,
    updateUser,
  };
};

export default useAuth;
