import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginStart, loginSuccess, loginFailure, logOut } from "../redux/userRedux";
import { userRequest } from "../requestMethods";

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONTEXT + HOOK
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROVIDER
// ─────────────────────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.user.currentUser);
  const isFetching = useSelector((state) => state.user.isFetching);

  // State quản lý quá trình khởi tạo auth (verify token lần đầu)
  const [isInitializing, setIsInitializing] = useState(true);

  // ── Derived state ─────────────────────────────────────────────────────────
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.role === 1;

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await userRequest.get("/auth/logout");
    } catch {
      // Bỏ qua lỗi logout phía server (cookie đã xóa bên client)
    }
    dispatch(logOut());
  }, [dispatch]);

  // ── Login thường ──────────────────────────────────────────────────────────
  const login = useCallback(
    async (credentials) => {
      dispatch(loginStart());
      try {
        const res = await userRequest.post("/auth/login", credentials);
        dispatch(loginSuccess(res.data));
        return res.data;
      } catch (error) {
        dispatch(loginFailure());
        throw error;
      }
    },
    [dispatch]
  );

  // ── Login Google ──────────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(
    async (idToken) => {
      dispatch(loginStart());
      try {
        const res = await userRequest.post("/auth/google", { idToken });
        dispatch(loginSuccess(res.data));
        return res.data;
      } catch (error) {
        dispatch(loginFailure());
        throw error;
      }
    },
    [dispatch]
  );

  // ── Verify token khi app mount ────────────────────────────────────────────
  useEffect(() => {
    const verifyAuth = async () => {
      // Nếu không có user trong Redux → không cần verify
      if (!currentUser) {
        setIsInitializing(false);
        return;
      }

      try {
        // Gọi một endpoint nhẹ để kiểm tra cookie/token còn hợp lệ
        await userRequest.get("/auth/verify");
      } catch (error) {
        // Token hết hạn hoặc không hợp lệ → tự động logout
        if (error.response?.status === 401 || error.response?.status === 403) {
          dispatch(logOut());
        }
      } finally {
        setIsInitializing(false);
      }
    };

    verifyAuth();
    // Chỉ chạy 1 lần khi mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Axios Interceptor: tự động logout khi nhận 401 ────────────────────────
  useEffect(() => {
    const interceptorId = userRequest.interceptors.response.use(
      (response) => response,
      (error) => {
        // Nếu bất kỳ request nào trả về 401 → auto logout
        if (error.response?.status === 401) {
          dispatch(logOut());
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor khi unmount
    return () => {
      userRequest.interceptors.response.eject(interceptorId);
    };
  }, [dispatch]);

  // ── Context value ─────────────────────────────────────────────────────────
  const value = {
    currentUser,
    isAuthenticated,
    isAdmin,
    isFetching,
    isInitializing,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
