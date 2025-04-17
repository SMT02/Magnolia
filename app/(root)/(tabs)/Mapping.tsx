import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text,
  Image, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Modal
} from 'react-native';
import { useGlobalContext } from "@/lib/global-provider";
import { useShoppingList } from "@/lib/shopping-list-provider";
import { databases, config } from "@/lib/appwrite";
import { Query } from "appwrite";
import icons from "@/constants/icons";
import Search from '@/components/Search';
import StoreMap, { STORE_LAYOUT, DepartmentName } from '@/components/StoreMap';
import { categories } from '@/constants/data';

const getGreeting = () => {
  const date = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
  const hour = new Date(date).getHours();

  if (hour >= 5 && hour < 12) return "Good Morning,";
  if (hour >= 12 && hour < 17) return "Good Afternoon,";
  if (hour >= 17 && hour < 21) return "Good Evening,";
  return "Good Night,";
};

const MapScreen = () => {
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentName>();
  const [departmentProducts, setDepartmentProducts] = useState<any[]>([]);
  const [showProducts, setShowProducts] = useState(false);
  const [showTextExplanation, setShowTextExplanation] = useState(false);
  const { user } = useGlobalContext();
  const { shoppingList, addToShoppingList } = useShoppingList();

  // Simulate map loading
  setTimeout(() => {
    setLoading(false);
  }, 1000);

  const handleDepartmentPress = async (department: DepartmentName) => {
    setSelectedDepartment(department);
    try {
      const result = await databases.listDocuments(
        config.databaseId!,
        config.goodsCollectionId!,
        [Query.equal("category", department)]
      );
      setDepartmentProducts(result.documents);
      setShowProducts(true);
    } catch (error) {
      console.error("Error fetching department products:", error);
    }
  };

  const generateTextDirections = () => {
    if (shoppingList.length === 0) {
      return "Your shopping list is empty. Add items to get directions!";
    }

    const departments = [...new Set(shoppingList.map(item => item.category))];
    let directions = "🏪 Welcome to Magnolia! Let's find your items:\n\n";
    directions += "🚶‍♂️ Start at the main entrance.\n\n";
    
    departments.forEach((dept, index) => {
      const items = shoppingList.filter(item => item.category === dept);
      const deptName = dept.replace(/([A-Z])/g, ' $1').trim();
      
      // Get aisle information from store layout
      const departmentLocation = categories.find(cat => cat.category === dept)?.location;

      directions += `${index + 1}. 📍 ${deptName}:\n`;
      if (departmentLocation) {
        directions += `   Located in ${departmentLocation.area} - ${departmentLocation.aisle}\n`;
      }
      switch(dept) {
        case 'FruitsAndVegetables':
          directions += "   • Head to the left side of the store\n   • You'll find the fresh produce section (Aisles A1-A2)\n";
          break;
        case 'Bakery':
          directions += "   • Walk past produce to the bakery corner\n   • Look for the fresh bread displays (Aisle B1)\n";
          break;
        case 'DairyAndEggs':
          directions += "   • Go to the back wall of the store\n   • Find the refrigerated section (Aisle C1)\n";
          break;
        case 'FrozenFoods':
          directions += "   • Located next to dairy\n   • Check the freezer cases (Aisle C2)\n";
          break;
        case 'MeatAndSeafood':
          directions += "   • Head to the back right corner\n   • Look for the meat counter (Aisle D1)\n";
          break;
        case 'PantryStaples':
          directions += "   • Walk through the center aisles\n   • Check Aisle E1 for pantry items\n";
          break;
        case 'SnacksAndSweets':
          directions += "   • Continue through center aisles\n   • Find snacks in Aisle E2\n";
          break;
        case 'Beverages':
          directions += "   • Head to Aisle F1\n   • Look for the beverage section\n";
          break;
      }
      
      directions += "   Items to grab:\n";
      items.forEach(item => {
        directions += `   🛒 ${item.name} - $${item.price.toFixed(2)}\n`;
      });
      
      // Add helpful tips based on department
      switch(dept) {
        case 'FruitsAndVegetables':
          directions += "   💡 Tip: Check for ripeness and freshness\n";
          break;
        case 'Bakery':
          directions += "   💡 Tip: Ask about today's fresh-baked items\n";
          break;
        case 'DairyAndEggs':
          directions += "   💡 Tip: Check expiration dates\n";
          break;
        case 'MeatAndSeafood':
          directions += "   💡 Tip: Ask the butcher for special cuts\n";
          break;
      }
      
      // Add estimated walking time to next department
      if (index < departments.length - 1) {
        directions += "\n   ⏱️ About 30 seconds to next department\n";
      }
      
      directions += "\n";
    });
    
    directions += "✅ Final Steps:\n";
    directions += "1. Head to the checkout area (front of store)\n";
    directions += "2. Look for the shortest line\n";
    directions += "3. Have your payment method ready\n\n";
    
    const totalItems = shoppingList.length;
    const totalPrice = shoppingList.reduce((sum, item) => sum + item.price, 0);
    
    directions += `📋 Summary:\n`;
    directions += `• Total Items: ${totalItems}\n`;
    directions += `• Estimated Total: $${totalPrice.toFixed(2)}\n`;
    directions += `• Estimated Shopping Time: ${Math.max(10, totalItems * 2)} minutes\n`;
    
    return directions;
  };

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
                  {getGreeting()}
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
        <View className="flex-1 mx-5">
          <View className="aspect-[4/3] w-full bg-gray-50 rounded-lg overflow-hidden">
            {loading ? (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" className="text-primary-300" />
                <Text className="mt-2 font-rubik text-black-100">Loading map...</Text>
              </View>
            ) : (
              <View className="flex-1">
                <StoreMap 
                  shoppingList={shoppingList} 
                  selectedDepartment={selectedDepartment}
                  onDepartmentPress={handleDepartmentPress}
                />
              </View>
            )}
          </View>
          
          {/* Text Directions Option */}
          <TouchableOpacity 
            onPress={() => setShowTextExplanation(true)}
            className="flex-row items-center justify-center mt-4"
          >
            <Text className="font-rubik text-black-200">Would you like a </Text>
            <Text className="font-rubik-medium text-primary-300">text explanation</Text>
            <Text className="font-rubik text-black-200"> instead?</Text>
          </TouchableOpacity>
        </View>

        {/* Department Products Modal */}
        <Modal
          visible={showProducts}
          transparent
          animationType="slide"
          onRequestClose={() => setShowProducts(false)}
        >
          <View className="flex-1 bg-black/50">
            <View className="flex-1 mt-32 bg-white rounded-t-3xl">
              <View className="p-5 border-b border-gray-100">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-rubik-bold text-black-300">
                    {selectedDepartment?.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                  <TouchableOpacity onPress={() => setShowProducts(false)}>
                    <Image source={icons.rightArrow} className="size-6 rotate-90" />
                  </TouchableOpacity>
                </View>
                <Text className="text-sm font-rubik text-black-100 mt-1">
                  {departmentProducts.length} items available
                </Text>
              </View>

              <ScrollView className="flex-1 p-5">
                {departmentProducts.map((product) => (
                  <TouchableOpacity 
                    key={product.$id}
                    className="flex-row justify-between items-center py-3 border-b border-gray-100"
                    onPress={() => {
                      addToShoppingList([product.name]);
                      setShowProducts(false);
                    }}
                  >
                    <View>
                      <Text className="text-base font-rubik-medium text-black-300">
                        {product.name}
                      </Text>
                      <Text className="text-sm font-rubik text-black-100">
                        ${product.price.toFixed(2)}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded mr-2">
                        <Image source={icons.star} className="size-3 mr-1" />
                        <Text className="text-xs font-rubik">{product.rating}</Text>
                      </View>
                      <Text className="text-primary-300 font-rubik-medium">Add to List</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Text Explanation Modal */}
        <Modal
          visible={showTextExplanation}
          transparent
          animationType="slide"
          onRequestClose={() => setShowTextExplanation(false)}
        >
          <View className="flex-1 bg-black/50">
            <View className="flex-1 mt-32 bg-white rounded-t-3xl">
              <View className="p-5 border-b border-gray-100">
                <View className="flex-row justify-between items-center">
                  <Text className="text-xl font-rubik-bold text-black-300">
                    Shopping Directions
                  </Text>
                  <TouchableOpacity onPress={() => setShowTextExplanation(false)}>
                    <Image source={icons.rightArrow} className="size-6 rotate-90" />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView className="flex-1 p-5">
                <Text className="text-base font-rubik leading-6 text-black-300">
                  {generateTextDirections()}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Location Categories */}
        <View className="mt-5 px-5">
          <Text className="text-xl font-rubik-bold text-black-300 mb-3">
            Departments
          </Text>
          
          <View className="flex flex-row flex-wrap gap-3">
            {Object.keys(STORE_LAYOUT.departments).map((department) => (
              <TouchableOpacity 
                key={department}
                className={`px-4 py-2 rounded-full ${
                  selectedDepartment === department 
                    ? 'bg-primary-300' 
                    : 'bg-gray-100'
                }`}
                onPress={() => handleDepartmentPress(department as DepartmentName)}
              >
                <Text className={`font-rubik-medium ${
                  selectedDepartment === department 
                    ? 'text-white' 
                    : 'text-black-300'
                }`}>
                  {department.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
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
            { name: "Produce Section", time: "10 mins ago" },
            { name: "Dairy Section", time: "Yesterday" },
          ].map((item, index) => (
            <TouchableOpacity 
              key={index}
              className="flex flex-row items-center justify-between py-3 border-b border-gray-100"
            >
              <View className="flex flex-row items-center gap-3">
                <Image source={icons.location} className="size-5" />
                <Text className="text-base font-rubik-medium text-black-300">
                  {item.name}
                </Text>
              </View>
              <Text className="text-sm font-rubik text-black-100">{item.time}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
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