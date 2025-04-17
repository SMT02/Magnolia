import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases, config, storage } from '@/lib/appwrite';
import { useShoppingList } from '@/lib/shopping-list-provider';
import icons from '@/constants/icons';

// ✅ Use getFileView instead of getFilePreview (avoids image transformation error)
const getImageUrl = (fileId?: string) => {
  if (!fileId) return null;
  return storage.getFileView("67bac197000f761b18ca", fileId).href;
};

const Product = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { shoppingList, addToShoppingList, removeFromShoppingList } = useShoppingList();
  const [good, setGood] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isInList = good ? shoppingList.some(item => item.id === good.$id) : false;

  useEffect(() => {
    const loadGood = async () => {
      try {
        console.log('Loading good with ID:', id);
        const doc = await databases.getDocument(
          config.databaseId!,
          config.goodsCollectionId!,
          id as string
        );
        console.log('Loaded good:', doc);
        setGood(doc);
      } catch (error) {
        console.error('Error loading good:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadGood();
    }
  }, [id]);

  const handleToggleList = async () => {
    if (!good) return;
    
    if (isInList) {
      removeFromShoppingList(good.$id);
    } else {
      await addToShoppingList([good.name]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-black-300 font-rubik">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!good) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <Text className="text-black-300 font-rubik">Product not found</Text>
          <TouchableOpacity 
            className="mt-4 bg-primary-300 px-4 py-2 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-rubik">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView>
        {/* Header with back button */}
        <View className="px-5 py-3 flex-row items-center justify-between border-b border-gray-100">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={() => router.back()}>
              <Image 
                source={icons.backArrow}
                className="w-6 h-6"
                style={{ tintColor: '#000' }}
              />
            </TouchableOpacity>
            <Text className="text-xl font-rubik-bold text-black-300 ml-3 flex-1">
              {good.name}
            </Text>
          </View>
          <TouchableOpacity onPress={handleToggleList}>
            <Image 
              source={isInList ? icons.heart : icons.list}
              className="w-6 h-6"
              style={{ tintColor: isInList ? '#ff4444' : '#32a852' }}
            />
          </TouchableOpacity>
        </View>

        {/* Product Image - Now taller */}
        {good && (
          <View className="w-full h-96 bg-gray-100">
            {good.imageId && (
              <Image
                source={{ uri: getImageUrl(good.imageId) || undefined }}
                className="w-full h-full"
                resizeMode="cover"
              />
            )}
          </View>
        )}

        {/* Product Details - Now with more spacing */}
        <View className="flex-1 p-5">
          {/* Price and Rating */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-3xl font-rubik-bold text-black-300">
              ${good.price}
            </Text>
            <View className="flex-row items-center bg-gray-50 px-4 py-2 rounded-full">
              <Image 
                source={icons.star} 
                className="w-6 h-6 mr-2"
                style={{ tintColor: '#FFD700' }}
              />
              <Text className="font-rubik-medium text-lg">{good.rating}</Text>
            </View>
          </View>

          {/* Category */}
          <View className="flex-row items-center mb-6">
            <Image 
              source={icons.filter}
              className="w-6 h-6 mr-3"
              style={{ tintColor: '#666876' }}
            />
            <Text className="text-lg font-rubik text-black-200">
              {good.category.replace(/([A-Z])/g, ' $1').trim()}
            </Text>
          </View>

          {/* Spacer to push buttons to bottom */}
          <View className="flex-1 min-h-[200px]" />

          {/* Action Buttons - Now at the bottom */}
          <View className="mt-auto">
            {/* Add/Remove from List Button */}
            <TouchableOpacity 
              className={`py-4 rounded-xl ${isInList ? 'bg-danger' : 'bg-primary-300'}`}
              onPress={handleToggleList}
            >
              <Text className="text-white font-rubik-medium text-center text-lg">
                {isInList ? 'Remove from List' : 'Add to List'}
              </Text>
            </TouchableOpacity>

            {/* Back to List Button */}
            <TouchableOpacity 
              className="mt-3 py-4 rounded-xl border border-gray-200"
              onPress={() => router.back()}
            >
              <Text className="text-black-300 font-rubik-medium text-center text-lg">
                Back to List
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Product; 