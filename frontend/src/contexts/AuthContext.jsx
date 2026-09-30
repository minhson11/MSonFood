/**
 * AuthContext — thin wrapper quanh Zustand authStore.
 *
 * Project đang dùng Zustand (authStore) với persist middleware, hoạt động tốt.
 * Context này export lại cùng interface để các component có thể dùng
 * useContext(AuthContext) nếu muốn, mà không thay đổi source of truth.
 *
 * Source of truth: src/store/authStore.js
 * Hook tiện dụng: src/hooks/useAuth.js
 */
import { createContext, useContext } from 'react';
import useAuthStore from '../store/authStore';

export const AuthContext = createContext(null);

/**
 * AuthProvider — wrap app để cung cấp auth state qua Context.
 * Hiện tại không cần thiết vì Zustand không cần Provider,
 * nhưng cung cấp để tương thích với pattern Context nếu cần sau này.
 */
export const AuthProvider = ({ children }) => {
  const auth = useAuthStore();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

/**
 * useAuthContext — hook để dùng AuthContext.
 * Ưu tiên dùng useAuth() từ hooks/useAuth.js thay vì hook này.
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  // Fallback: nếu không có Provider, lấy trực tiếp từ store
  if (!context) return useAuthStore.getState();
  return context;
};

export default AuthContext;
