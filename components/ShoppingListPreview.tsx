import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Image } from 'react-native';
import { Link } from 'expo-router';
import icons from '@/constants/icons';
import { useShoppingList } from '@/lib/shopping-list-provider';

interface ShoppingListPreviewProps {
  isFloating?: boolean;
}

const ShoppingListPreview = ({ isFloating = true }: ShoppingListPreviewProps) => {
  const { shoppingList } = useShoppingList();
  const [isModalVisible, setIsModalVisible] = useState(false);

  if (shoppingList.length === 0) {
    return null;
  }

  const totalPrice = shoppingList.reduce((sum, item) => sum + item.price, 0).toFixed(2);
  const itemCount = shoppingList.length;

  return (
    <>
      {/* Floating button or inline preview */}
      {isFloating ? (
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={{
            position: 'absolute',
            top: 70,
            right: 20,
            backgroundColor: '#32a852',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 5,
            zIndex: 1000,
          }}
        >
          <Image
            source={icons.list}
            style={{ width: 18, height: 18, tintColor: 'white', marginRight: 5 }}
          />
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
            {itemCount} item{itemCount !== 1 ? 's' : ''} (${totalPrice})
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg mb-3"
        >
          <View className="flex-row items-center">
            <Image
              source={icons.list}
              style={{ width: 18, height: 18, tintColor: '#32a852', marginRight: 8 }}
            />
            <Text className="text-base font-rubik-medium text-black-300">
              Shopping List ({itemCount})
            </Text>
          </View>
          <Text className="text-sm font-rubik-bold text-primary-300">${totalPrice}</Text>
        </TouchableOpacity>
      )}

      {/* Modal for detailed list */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          justifyContent: 'flex-end'
        }}>
          <View style={{ 
            backgroundColor: 'white', 
            borderTopLeftRadius: 20, 
            borderTopRightRadius: 20,
            paddingBottom: 25,
            maxHeight: '80%',
          }}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
              padding: 15
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                Your Shopping List
              </Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={{ fontSize: 28, fontWeight: '200', marginTop: -5 }}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ maxHeight: '70%' }}>
              <View style={{ padding: 15 }}>
                {shoppingList.map((item, i) => (
                  <Link
                    key={i}
                    href={`/product/${item.id}`}
                    asChild
                  >
                    <TouchableOpacity 
                      style={{ 
                        marginBottom: 15, 
                        flexDirection: 'row', 
                        justifyContent: 'space-between',
                        borderBottomWidth: 1,
                        borderBottomColor: '#f0f0f0',
                        paddingBottom: 10
                      }}
                    >
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: '500' }}>
                          {item.name}
                        </Text>
                        <Text style={{ fontSize: 14, color: '#666', marginTop: 2 }}>
                          {item.category.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>
                        ${item.price.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  </Link>
                ))}
              </View>
            </ScrollView>
            
            <View style={{ 
              borderTopWidth: 1, 
              borderTopColor: '#f0f0f0',
              padding: 15,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <View>
                <Text style={{ fontSize: 14, color: '#666' }}>Total</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>${totalPrice}</Text>
              </View>
              
              <Link href="/list" asChild>
                <TouchableOpacity 
                  style={{ 
                    backgroundColor: '#32a852', 
                    paddingHorizontal: 20, 
                    paddingVertical: 10, 
                    borderRadius: 10 
                  }}
                  onPress={() => setIsModalVisible(false)}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>View Full List</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ShoppingListPreview; 