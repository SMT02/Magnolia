import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useGlobalContext } from "@/lib/global-provider";
import icons from "@/constants/icons";
import Search from '@/components/Search';

const MapScreen = () => {
  const [loading, setLoading] = useState(true);
  const { user } = useGlobalContext();

  // Simulate map loading
  setTimeout(() => {
    setLoading(false);
  }, 1000);

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32"
      >
        <View className="px-5">
          <View className="flex flex-row items-center justify-between mt-5">
            <View className="flex flex-row">
              <Image
                source={{ uri: user?.avatar }}
                className="size-12 rounded-full"
              />
              
              <View className="flex flex-col items-start ml-2 justify-center">
                <Text className="text-xs font-rubik text-black-100">
                  Good Morning
                </Text>
                <Text className="text-base font-rubik-medium text-black-300">
                  {user?.name}
                </Text>
              </View>
            </View>
            <Image source={icons.bell} className="size-6" />
          </View>
          
          <Search />
          
          <View className="my-5">
            <View className="flex flex-row items-center justify-between">
              <Text className="text-xl font-rubik-bold text-black-300">
                Store Map
              </Text>
              <TouchableOpacity>
                <Text className="text-base font-rubik-bold text-primary-300">
                  Legend
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Map Container */}
        <View className="flex-1 mx-5 h-96 bg-gray-50 rounded-lg overflow-hidden">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" className="text-primary-300" />
              <Text className="mt-2 font-rubik text-black-100">Loading map...</Text>
            </View>
          ) : (
            <View className="flex-1 justify-center items-center">
              <Text className="font-rubik-medium text-black-300">Store Map will be displayed here</Text>
              <Text className="mt-2 font-rubik text-black-100 text-center px-4">
                This placeholder will be replaced with the actual store map component
              </Text>
            </View>
          )}
        </View>

        {/* Location Categories */}
        <View className="mt-5 px-5">
          <Text className="text-xl font-rubik-bold text-black-300 mb-3">
            Categories
          </Text>
          
          <View className="flex flex-row flex-wrap gap-3">
            {["Groceries", "Electronics", "Clothing", "Home & Garden", "Pharmacy", "Checkout"].map((category) => (
              <TouchableOpacity 
                key={category} 
                className="px-4 py-2 bg-gray-100 rounded-full"
              >
                <Text className="font-rubik-medium text-black-300">{category}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recently Visited */}
        <View className="mt-5 px-5">
          <Text className="text-xl font-rubik-bold text-black-300 mb-3">
            Recently Visited
          </Text>
          
          {[
            { name: "Electronics Department", time: "10 mins ago" },
            { name: "Dairy Section", time: "Yesterday" },
          ].map((item, index) => (
            <TouchableOpacity 
              key={index}
              className="flex flex-row items-center justify-between py-3 border-b border-gray-100"
            >
              <View className="flex flex-row items-center gap-3">
                <Image source={icons.calendar} className="size-5" />
                <Text className="text-base font-rubik-medium text-black-300">
                  {item.name}
                </Text>
              </View>
              <Text className="text-sm font-rubik text-black-100">{item.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation - Optional */}
      <View className="h-16 bg-white border-t border-gray-100 flex-row justify-around items-center px-5 absolute bottom-0 left-0 right-0">
        <TouchableOpacity className="items-center">
          <View className="size-6 bg-primary-300 rounded-full mb-1" />
          <Text className="font-rubik-medium text-xs text-primary-300">Map</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center">
          <View className="size-6 bg-gray-200 rounded-full mb-1" />
          <Text className="font-rubik-medium text-xs text-gray-400">Aisles</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center">
          <View className="size-6 bg-gray-200 rounded-full mb-1" />
          <Text className="font-rubik-medium text-xs text-gray-400">Search</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center">
          <View className="size-6 bg-gray-200 rounded-full mb-1" />
          <Text className="font-rubik-medium text-xs text-gray-400">Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MapScreen;