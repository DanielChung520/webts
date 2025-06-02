import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface UserInfo {
  id: string;
  username: string;
  nickname?: string;
  role: string;  // 添加 role 字段
}

interface AuthContextType {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    // 檢查本地存儲的認證信息
    const token = localStorage.getItem('token');
    const storedUserInfo = localStorage.getItem('userInfo');
    if (token && storedUserInfo) {
      setIsAuthenticated(true);
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.get('/api/users/login', {
        params: {
          username,
          password
        }
      });

      console.log('Login response:', response.data); // 調試用

      // 假設後端返回 { success: true, data: { token, user } } 格式
      if (response.data.success || response.status === 200) {
        // 存儲認證信息
        const token = response.data.token || 'default-token';
        localStorage.setItem('token', token);
        
        // 存儲用戶信息
        const userInfo = {
          username,
          nickname: response.data.nickname,
          userId: response.data.userId,
          ...response.data.user, // 如果後端返回了其他用戶信息
          role: response.data.role
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        setIsAuthenticated(true);
        setUserInfo(userInfo);
      } else {
        console.error('Login failed:', response.data);
        throw new Error(response.data.message || '登入失敗');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error instanceof Error ? error.message : '登入失敗，請檢查用戶名和密碼');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    setIsAuthenticated(false);
    setUserInfo(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 