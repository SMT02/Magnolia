import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from "@/lib/global-provider";
import { useShoppingList } from "@/lib/shopping-list-provider";
import icons from '@/constants/icons';

const ShoppingList = () => {
  const { user } = useGlobalContext();
  const { shoppingList, removeFromShoppingList, updateQuantity } = useShoppingList();

  const getTotalPrice = () => {
    return shoppingList.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2);
  };

  const handleQuantityChange = (id: string, change: number) => {
    const item = shoppingList.find(item => item.id === id);
    if (!item) return;

    const newQuantity = (item.quantity || 1) + change;
    if (newQuantity < 1) {
      removeFromShoppingList(id);
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-5 py-3 flex-row items-center border-b border-gray-100">
          <Image 
            source={{ uri: user?.avatar }}
            className="size-10 rounded-full"
          />
          <View className="ml-3">
            <Text className="text-xs font-rubik text-black-100">My</Text>
            <Text className="text-xl font-rubik-bold text-black-300">
              Shopping List
            </Text>
          </View>
        </View>

        {shoppingList.length === 0 ? (
          // Empty State
          <View className="flex-1 justify-center items-center mt-10 px-5">
            <Image 
              source={icons.list} 
              className="size-16 mb-4"
              style={{ tintColor: '#32a852' }}
            />
            <Text className="text-xl font-rubik-bold text-black-300 text-center">
              Your Shopping List is Empty
            </Text>
            <Text className="text-base font-rubik text-black-200 text-center mt-2">
              Add items from the store to your shopping list
            </Text>
          </View>
        ) : (
          // Shopping List Items
          <View className="p-5">
            {shoppingList.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between py-3 border-b border-gray-100">
                <Link href={`/product/${item.id}`} asChild>
                  <TouchableOpacity className="flex-1 flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-base font-rubik-medium text-black-300">
                        {item.name}
                      </Text>
                      <Text className="text-sm font-rubik text-black-200">
                        {item.category.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-base font-rubik-medium text-black-300 mr-2">
                        ${(item.price * (item.quantity || 1)).toFixed(2)}
                      </Text>
                      <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded">
                        <Image 
                          source={icons.star} 
                          className="w-4 h-4 mr-1"
                          style={{ tintColor: '#FFD700' }}
                        />
                        <Text className="text-sm font-rubik">{item.rating}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </Link>
                <View className="ml-4 flex-row items-center">
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => handleQuantityChange(item.id, -1)}
                  >
                    <Text className="text-xl font-rubik-bold text-primary-300">-</Text>
                  </TouchableOpacity>
                  <Text className="text-base font-rubik-medium text-black-300 mx-2">
                    {item.quantity || 1}
                  </Text>
                  <TouchableOpacity 
                    className="p-2"
                    onPress={() => handleQuantityChange(item.id, 1)}
                  >
                    <Text className="text-xl font-rubik-bold text-primary-300">+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    className="ml-4 p-2"
                    onPress={() => removeFromShoppingList(item.id)}
                  >
                    <Text className="text-danger font-rubik">Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Total Price */}
            <View className="mt-5 p-4 bg-gray-50 rounded-lg">
              <View className="flex-row justify-between items-center">
                <Text className="text-base font-rubik text-black-200">Total</Text>
                <Text className="text-xl font-rubik-bold text-black-300">
                  ${getTotalPrice()}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShoppingList;
