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
    // Ensure we're not adding duplicates in a single batch
    const uniqueItems = [...new Set(items)];
    console.log(`🔍 Processing ${uniqueItems.length} unique items to add`);
    
    const newItems = await Promise.all(
      uniqueItems.map(async (name) => {
        // Log each product being searched to help with debugging
        console.log(`🔍 Searching for product: "${name}"`);
        
        try {
          const results = await searchGoods(name);
          console.log(`📊 Found ${results.length} potential matches for "${name}"`);
          
          if (results.length > 0) {
            // Check for exact match first (highest priority)
            const exactMatch = results.find(
              item => item.name.toLowerCase() === name.toLowerCase()
            );
            
            // Next best: check if any result contains the full query as a word
            const containsFullQuery = !exactMatch ? 
              results.find(item => {
                const regex = new RegExp(`\\b${name.toLowerCase()}\\b`, 'i');
                return regex.test(item.name.toLowerCase());
              }) : null;
            
            // Use the best match available
            const bestMatch = exactMatch || containsFullQuery || results[0];
            
            if (exactMatch) {
              console.log(`✅ EXACT match found for "${name}": "${bestMatch.name}"`);
            } else if (containsFullQuery) {
              console.log(`✅ Contains full query match for "${name}": "${bestMatch.name}"`);
            } else {
              console.log(`✅ Best available match for "${name}": "${bestMatch.name}"`);
            }
            
            // Check if this item already exists in the shopping list
            const existingItem = shoppingList.find(item => item.id === bestMatch.$id);
            if (existingItem) {
              // If item exists, update its quantity
              console.log(`🔄 "${bestMatch.name}" already in list, updating quantity`);
              updateQuantity(existingItem.id, existingItem.quantity + 1);
              return null;
            }
            
            // Create the shopping list item
            return {
              id: bestMatch.$id,
              name: bestMatch.name,
              category: bestMatch.category,
              price: bestMatch.price,
              imageId: bestMatch.imageId,
              rating: bestMatch.rating,
              quantity: 1,
            };
          } else {
            console.log(`❌ No matches found for "${name}"`);
          }
        } catch (error) {
          console.error(`❌ Error searching for "${name}":`, error);
        }
        
        return null;
      })
    );

    const validNewItems = newItems.filter((item): item is ShoppingListItem => item !== null);
    if (validNewItems.length > 0) {
      console.log(`🛒 Adding ${validNewItems.length} new items to shopping list:`);
      validNewItems.forEach(item => {
        console.log(`  • ${item.name} (${item.category}) - $${item.price}`);
      });
      
      setShoppingList(prev => [...prev, ...validNewItems]);
    } else {
      console.log(`ℹ️ No new items to add to shopping list`);
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