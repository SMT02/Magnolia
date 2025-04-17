import React, { createContext, useContext, useState, useEffect } from 'react';
import { searchGoods } from './appwrite';

export interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageId: string;
  rating: number;
  quantity: number;
}

interface ShoppingListContextType {
  shoppingList: ShoppingListItem[];
  addToShoppingList: (items: string[]) => Promise<void>;
  removeFromShoppingList: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

export const ShoppingListProvider = ({ children }: { children: React.ReactNode }) => {
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);

  const addToShoppingList = async (items: string[]) => {
    const newItems = await Promise.all(
      items.map(async (name) => {
        const results = await searchGoods(name);
        if (results.length > 0) {
          const existingItem = shoppingList.find(item => item.id === results[0].$id);
          if (existingItem) {
            // If item exists, update its quantity
            updateQuantity(existingItem.id, existingItem.quantity + 1);
            return null;
          }
          return {
            id: results[0].$id,
            name: results[0].name,
            category: results[0].category,
            price: results[0].price,
            imageId: results[0].imageId,
            rating: results[0].rating,
            quantity: 1,
          };
        }
        return null;
      })
    );

    const validNewItems = newItems.filter((item): item is ShoppingListItem => item !== null);
    if (validNewItems.length > 0) {
      setShoppingList(prev => [...prev, ...validNewItems]);
    }
  };

  const removeFromShoppingList = (id: string) => {
    setShoppingList(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setShoppingList(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  return (
    <ShoppingListContext.Provider value={{ 
      shoppingList, 
      addToShoppingList, 
      removeFromShoppingList,
      updateQuantity,
    }}>
      {children}
    </ShoppingListContext.Provider>
  );
};

export const useShoppingList = () => {
  const context = useContext(ShoppingListContext);
  if (context === undefined) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
}; 