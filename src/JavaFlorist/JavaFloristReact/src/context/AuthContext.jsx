import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { 
    login as loginAPI, 
    register as registerAPI, 
    logout as logoutAPI, 
    setupAxiosInterceptors 
} from '../api/auth';
import { decodeToken, getTokenExpiresIn } from '../utils/tokenUtils';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// --- HÀM HELPER TÁCH RIÊNG (Để dùng được ở mọi nơi) ---
function getRolesFromDecodedToken(decoded) {
    if (!decoded) return [];
    
    let userRoles = [];
    const roleClaimType = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

    // 1. Chuẩn ASP.NET Identity
    if (decoded[roleClaimType]) {
        const roleValue = decoded[roleClaimType];
        userRoles = Array.isArray(roleValue) ? roleValue : [roleValue];
    }
    // 2. Chuẩn ngắn gọn 'role'
    else if (decoded.role) {
        const roleValue = decoded.role;
        userRoles = Array.isArray(roleValue) ? roleValue : [roleValue];
    }
    // 3. Chuẩn 'roles'
    else if (decoded.roles) {
        const roleValue = decoded.roles;
        userRoles = Array.isArray(roleValue) ? roleValue : [roleValue];
    }
    
    return [...new Set(userRoles)];
}
// -------------------------------------------------------

export function AuthProvider({ children }) {
  // 1. KHỞI TẠO STATE TRỰC TIẾP TỪ LOCAL STORAGE (Fix lỗi F5 bị mất quyền)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || null);
  
  // Giải mã ngay lập tức để có state ban đầu đúng
  const initialDecoded = token ? decodeToken(token) : null;
  const [user, setUser] = useState(initialDecoded);
  const [roles, setRoles] = useState(() => getRolesFromDecodedToken(initialDecoded));
  const [tokenExpiry, setTokenExpiry] = useState(() => token ? getTokenExpiresIn(token) : null);

  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  // Vẫn giữ useEffect để đồng bộ nếu token thay đổi từ nơi khác (optional)
  // Update user and roles when token changes
  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      console.log("Decoded Token:", decoded); // <--- QUAN TRỌNG: Xem log này để biết key tên gì

      setUser(decoded);
      const expiresIn = getTokenExpiresIn(token);
      setTokenExpiry(expiresIn);
      
      // --- LOGIC TRÍCH XUẤT ROLE MỚI (MẠNH MẼ HƠN) ---
      let userRoles = [];
      
      // 1. Thử chuẩn dài của Microsoft
      const microsoftRoleKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
      
      // 2. Kiểm tra tất cả các key có thể
      if (decoded[microsoftRoleKey]) {
          const val = decoded[microsoftRoleKey];
          userRoles = Array.isArray(val) ? val : [val];
      } 
      else if (decoded['role']) {
          const val = decoded['role'];
          userRoles = Array.isArray(val) ? val : [val];
      }
      else if (decoded['roles']) {
          const val = decoded['roles'];
          userRoles = Array.isArray(val) ? val : [val];
      }
      // 3. Fallback: Tìm bất kỳ key nào có chữ 'role' (không phân biệt hoa thường)
      else {
          const roleKey = Object.keys(decoded).find(key => key.toLowerCase().includes('role'));
          if (roleKey) {
              const val = decoded[roleKey];
              userRoles = Array.isArray(val) ? val : [val];
          }
      }
      
      console.log("Extracted Roles:", userRoles); // Xem roles lấy được chưa
      setRoles(userRoles);
      // -----------------------------------------------

    } else {
      setUser(null);
      setRoles([]);
      setTokenExpiry(null);
    }
  }, [token]);

  const logout = useCallback(async () => {
    if (refreshToken) {
      try {
        await logoutAPI(refreshToken);
      } catch (error) {
        console.error("Logout API failed", error);
      }
    }
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setRoles([]);
    setTokenExpiry(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }, [refreshToken]);

  // Auto-logout timer
  useEffect(() => {
    if (!token) return;
    const expiresIn = getTokenExpiresIn(token);
    if (expiresIn <= 0) {
      logout();
      return;
    }
    const timeoutMs = (expiresIn - 300) * 1000; 
    if (timeoutMs > 0) {
      const timer = setTimeout(() => {
        logout();
        alert('Your session has expired. Please login again.');
      }, timeoutMs);
      return () => clearTimeout(timer);
    }
  }, [token, logout]);

  const login = async (email, password) => {
    try {
      const response = await loginAPI(email, password);
      if (response && response.accessToken) {
        const newToken = response.accessToken;
        const newRefreshToken = response.refreshToken;
        
        // 1. Lưu Storage
        localStorage.setItem('token', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // 2. Giải mã & Cập nhật State NGAY LẬP TỨC (Fix lỗi Race Condition)
        const decoded = decodeToken(newToken);
        const newRoles = getRolesFromDecodedToken(decoded);
        
        setToken(newToken);
        setRefreshToken(newRefreshToken);
        setUser(decoded);
        setRoles(newRoles); // <--- QUAN TRỌNG: Roles có ngay lập tức
        setTokenExpiry(getTokenExpiresIn(newToken));

        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  };

  const register = async (registerData) => {
    try {
      const response = await registerAPI(registerData); 
      if (response && response.message) {
        return true;
      }
      return false;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    token,
    refreshToken,
    roles,
    tokenExpiry,
    login,
    logout,
    register,
    isAuthenticated: !!token,
    hasRole: (role) => roles.includes(role)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}