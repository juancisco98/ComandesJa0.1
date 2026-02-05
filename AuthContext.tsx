import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<boolean>;
  register: (email: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check persistencia al cargar
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const loggedUser = authService.login(email);
    if (loggedUser) {
      setUser(loggedUser);
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  };

  const register = async (email: string, name: string, role: UserRole) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser = authService.register(email, name, role);
    authService.login(newUser.email); // Auto login
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Función mágica para desarrollo/demo: Cambia el rol del usuario actual y actualiza localStorage
  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    
    const updatedUser = { ...user, role: newRole };
    // Update state
    setUser(updatedUser);
    
    // Update LocalStorage persistence (hacky but works for demo)
    // 1. Update session
    localStorage.setItem('comandesja_session', JSON.stringify(updatedUser));
    
    // 2. Update "Database"
    const users = JSON.parse(localStorage.getItem('comandesja_users_db') || '[]');
    const updatedUsers = users.map((u: User) => u.id === user.id ? { ...u, role: newRole } : u);
    localStorage.setItem('comandesja_users_db', JSON.stringify(updatedUsers));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, switchRole }}>
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