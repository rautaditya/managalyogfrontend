// import React, { createContext, useContext, useState, useEffect } from 'react';
// import { authAPI } from '../api';

// const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [admin, setAdmin] = useState(() => {
//     try {
//       const saved = localStorage.getItem('admin');
//       return saved ? JSON.parse(saved) : null;
//     } catch {
//       return null;
//     }
//   });
//   const [loading, setLoading] = useState(false);

//   const login = async (email, password) => {
//     setLoading(true);
//     try {
//       const res = await authAPI.login({ email, password });
//       const { token, ...adminData } = res.data;
//       localStorage.setItem('token', token);
//       localStorage.setItem('admin', JSON.stringify(adminData));
//       setAdmin(adminData);
//       return { success: true };
//     } catch (err) {
//       return { success: false, message: err.response?.data?.message || 'Login failed' };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = () => {
//     localStorage.removeItem('token');
//     localStorage.removeItem('admin');
//     setAdmin(null);
//   };

//   return (
//     <AuthContext.Provider value={{ admin, loading, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// };
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);
const SESSION_LIMIT = 7 * 60 * 60 * 1000; // 7 hours

export const AuthProvider = ({ children }) => {
  const logoutTimerRef = useRef(null);

  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem('admin');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const logout = () => {
    clearLogoutTimer();
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('loginTime');
    setAdmin(null);
  };

  const startLogoutTimer = (loginTime) => {
    clearLogoutTimer();

    const elapsed = Date.now() - Number(loginTime);
    const remainingTime = SESSION_LIMIT - elapsed;

    if (remainingTime <= 0) {
      logout();
      window.location.href = '/login';
      return;
    }

    logoutTimerRef.current = setTimeout(() => {
      logout();
      window.location.href = '/login';
    }, remainingTime);
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const { token, ...adminData } = res.data;

      const now = Date.now();

      localStorage.setItem('token', token);
      localStorage.setItem('admin', JSON.stringify(adminData));
      localStorage.setItem('loginTime', now.toString());

      setAdmin(adminData);
      startLogoutTimer(now);

      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const loginTime = localStorage.getItem('loginTime');

    if (!token || !loginTime) return;

    const elapsed = Date.now() - Number(loginTime);

    if (elapsed >= SESSION_LIMIT) {
      logout();
      window.location.href = '/login';
      return;
    }

    startLogoutTimer(loginTime);

    return () => clearLogoutTimer();
  }, []);

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};