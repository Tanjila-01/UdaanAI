import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  loginApi, 
  registerApi, 
  getCurrentUserApi, 
  getMyProfileApi, 
  logoutApi 
} from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token') || null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSessionData = async (currentToken) => {
    try {
      const userData = await getCurrentUserApi();
      setUser(userData);
      try {
        const profileData = await getMyProfileApi();
        setProfile(profileData);
      } catch (err) {
        setProfile(null);
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSessionData(token);
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await loginApi({ email, password });
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    setToken(data.access_token);
    setUser(data.user);
    try {
      const profileData = await getMyProfileApi();
      setProfile(profileData);
    } catch (err) {
      setProfile(null);
    }
    return data;
  };

  const register = async (full_name, email, password, confirm_password) => {
    const data = await registerApi({ full_name, email, password, confirm_password });
    return data;
  };

  const logout = () => {
    logoutApi();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    try {
      const profileData = await getMyProfileApi();
      setProfile(profileData);
    } catch (err) {
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        profile,
        loading,
        login,
        register,
        logout,
        refreshProfile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
