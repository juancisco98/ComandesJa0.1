
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../services/mockService';

interface DataContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  deleteCategory: (category: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializar estado desde LocalStorage si existe, sino usar MOCK_PRODUCTS
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('comandesja_products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  // Guardar en LocalStorage cada vez que cambien los productos
  useEffect(() => {
    localStorage.setItem('comandesja_products', JSON.stringify(products));
  }, [products]);

  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const deleteCategory = (category: string) => {
      setProducts(prev => prev.filter(p => p.category !== category));
  };

  return (
    <DataContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, deleteCategory }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
