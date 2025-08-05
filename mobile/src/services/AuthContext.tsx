import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './ApiService';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isApproved: boolean;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const savedToken = await AsyncStorage.getItem('authToken');
      
      if (savedToken) {
        setToken(savedToken);
        ApiService.setAuthToken(savedToken);
        
        // Verificar se o token ainda é válido fazendo uma requisição para /api/user
        const userData = await ApiService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      // Token inválido ou erro, fazer logout
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await ApiService.login(username, password);
      
      // O backend atual usa sessões via cookies, não JWT
      // Salvamos apenas um flag de autenticação
      const sessionToken = 'session-authenticated';
      
      setUser(response);
      setToken(sessionToken);
      
      await AsyncStorage.setItem('authToken', sessionToken);
      ApiService.setAuthToken(sessionToken);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await ApiService.logout();
    } catch (error) {
      // Continuar com logout local mesmo se a API falhar
    } finally {
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('authToken');
      ApiService.setAuthToken(null);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};