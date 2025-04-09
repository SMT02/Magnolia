import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
console.log("🔑 Loaded API KEY:", API_KEY);

// Add better API key validation
if (!API_KEY) {
  console.error("❌ No API key found in environment variables");
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const Explore = () => {
  const { isLogged, user, loading } = useGlobalContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [optimizedRoute, setOptimizedRoute] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const aisleOrder = [
    'FruitsAndVegetables',
    'Bakery',
    'DairyAndEggs',
    'MeatAndSeafood',
    'PantryStaples',
    'FrozenFoods',
    'SnacksAndSweets',
    'Beverages',
    'HouseholdEssentials',
  ];

  const products = [
    { name: 'Milk', category: 'DairyAndEggs' },
    { name: 'Eggs', category: 'DairyAndEggs' },
    { name: 'Bread', category: 'Bakery' },
    { name: 'Apples', category: 'FruitsAndVegetables' },
    { name: 'Chicken', category: 'MeatAndSeafood' },
    { name: 'Rice', category: 'PantryStaples' },
    { name: 'Chips', category: 'SnacksAndSweets' },
    { name: 'Toilet Paper', category: 'HouseholdEssentials' },
    { name: 'Pepsi', category: 'Beverages' },
  ];

  // Add product database
  const productDatabase = [
    { name: 'Apples', category: 'FruitsAndVegetables', price: '$0.99/each', inStock: true },
    { name: 'Beans', category: 'PantryStaples', price: '$1.20', inStock: true },
    { name: 'Bread', category: 'Bakery', price: '$2.99', inStock: true },
    { name: 'Broccoli', category: 'FruitsAndVegetables', price: '$2.99/lb', inStock: true },
    { name: 'Candy', category: 'SnacksAndSweets', price: '$1.99', inStock: true },
    { name: 'Carrots', category: 'FruitsAndVegetables', price: '$1.49/lb', inStock: true },
    { name: 'Cheddar Cheese', category: 'DairyAndEggs', price: '$4.99', inStock: true },
    { name: 'Chicken Breast', category: 'MeatAndSeafood', price: '$7.99/lb', inStock: true },
    { name: 'Chips', category: 'SnacksAndSweets', price: '$3.49', inStock: true },
    { name: 'Chocolate Bar', category: 'SnacksAndSweets', price: '$1.50', inStock: true },
    { name: 'Coffee', category: 'Beverages', price: '$8.99', inStock: true },
    { name: 'Croissant', category: 'Bakery', price: '$1.99', inStock: true },
    { name: 'Eggs', category: 'DairyAndEggs', price: '$3.99', inStock: true },
    { name: 'Frozen Peas', category: 'FrozenFoods', price: '$2.50', inStock: true },
    { name: 'Frozen Pizza', category: 'FrozenFoods', price: '$6.99', inStock: true },
    { name: 'Ground Beef', category: 'MeatAndSeafood', price: '$5.49/lb', inStock: true },
    { name: 'Ice Cream', category: 'FrozenFoods', price: '$4.99', inStock: true },
    { name: 'Laundry Detergent', category: 'HouseholdEssentials', price: '$12.99', inStock: true },
    { name: 'Milk', category: 'DairyAndEggs', price: '$4.99', inStock: true },
    { name: 'Muffin', category: 'Bakery', price: '$2.20', inStock: true },
    { name: 'Pasta', category: 'PantryStaples', price: '$1.89', inStock: true },
    { name: 'Pepsi', category: 'Beverages', price: '$1.50', inStock: true },
    { name: 'Rice', category: 'PantryStaples', price: '$3.00', inStock: true },
    { name: 'Salmon', category: 'MeatAndSeafood', price: '$9.99/lb', inStock: true },
    { name: 'Toilet Paper', category: 'HouseholdEssentials', price: '$6.99', inStock: true },
    { name: 'Toothpaste', category: 'HouseholdEssentials', price: '$3.25', inStock: true },
    { name: 'Water', category: 'Beverages', price: '$1.00', inStock: true }
  ];

  function optimizeList(list: string[]) {
    return list
      .map((item) => {
        const match = products.find(
          (p) => p.name.toLowerCase() === item.toLowerCase()
        );
        return match || { name: item, category: 'Unknown' };
      })
      .sort((a, b) => {
        const aIndex = aisleOrder.indexOf(a.category);
        const bIndex = aisleOrder.indexOf(b.category);
        return aIndex - bIndex;
      })
      .map((p) => p.name);
  }

  const formatInventoryResponse = (categories: string[]) => {
    // Sort categories alphabetically
    const sortedCategories = categories.sort();
    return sortedCategories.map(cat => {
      const products = productDatabase.filter(p => p.category === cat);
      const categoryName = cat.replace(/([A-Z])/g, ' $1').trim(); // Add spaces between camelCase
      return `📦 ${categoryName}:\n${products.map(p => `• ${p.name} - ${p.price}`).join('\n')}`;
    }).join('\n\n');
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    if (!API_KEY) {
      setError("API key is missing. Please check your environment variables.");
      return;
    }

    setError(null);

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');

    try {
      // Check if the message is asking about inventory
      const isInventoryQuestion = input.toLowerCase().includes('do you have') || 
                                input.toLowerCase().includes('in stock') ||
                                input.toLowerCase().includes('available') ||
                                input.toLowerCase().includes('what items') ||
                                input.toLowerCase().includes("what's in stock") ||
                                input.toLowerCase().includes('what do you have') ||
                                input.toLowerCase().includes('show inventory') ||
                                input.toLowerCase().includes('show products');

      if (isInventoryQuestion) {
        let response: string;
        
        // Check if asking for full inventory
        if (input.toLowerCase().includes('what items') ||
            input.toLowerCase().includes("what's in stock") ||
            input.toLowerCase().includes('what do you have') ||
            input.toLowerCase().includes('show inventory') ||
            input.toLowerCase().includes('show products')) {
          const categories = [...new Set(productDatabase.map(p => p.category))];
          response = `🏪 Our Current Inventory:\n\n${formatInventoryResponse(categories)}\n\n💡 All items are in stock and ready for purchase. Let me know if you'd like to add any items to your shopping list!`;
        } else {
          // Check specific item availability
          const itemToCheck = input.toLowerCase()
            .replace('do you have ', '')
            .replace('is ', '')
            .replace(' in stock', '')
            .replace('available', '')
            .replace('?', '')
            .trim();

          const product = productDatabase.find(p => 
            p.name.toLowerCase().includes(itemToCheck)
          );

          if (product) {
            response = `✅ Yes, ${product.name} is in stock and available for ${product.price}! Would you like me to add it to your shopping list?`;
          } else {
            const categories = [...new Set(productDatabase.map(p => p.category))];
            response = `I'm not sure about that specific item, but here's our full inventory:\n\n${formatInventoryResponse(categories)}`;
          }
        }

        const botMessage: Message = {
          role: 'assistant',
          content: response
        };
        setMessages([...newMessages, botMessage]);
        return;
      }

      const prompt = `
You are a shopping assistant. Extract product names from this sentence and return only a JSON array, like ["milk", "bread"]. 
DO NOT include explanations, formatting, or markdown. Only return raw JSON.

Sentence: "${input}"
`;

      // Add request logging
      console.log("🚀 Sending request to OpenAI...");

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0,
          max_tokens: 100,
        }),
      });

      // Add response status check
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ API Error:", errorData);
        throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log("✅ Response received:", data);

      const rawContent = data.choices?.[0]?.message?.content?.trim() || '';
      console.log('🧠 Full GPT Response:', rawContent);

      // Clean up markdown wrappers if GPT includes them
      let cleaned = rawContent.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();

      if (!cleaned || cleaned.length < 3) {
        throw new Error("Response was empty or too short.");
      }

      let parsed: string[] = [];

      try {
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) throw new Error("Not an array");
      } catch (err) {
        console.error("❌ Could not parse GPT JSON:", cleaned);
        setError('The AI response couldn’t be read. Try saying something simpler like “Add milk and bread.”');
        return;
      }

      const newItems = parsed.map((item: string) => item.trim().toLowerCase());
      const updatedList = [...new Set([...shoppingList, ...newItems])];
      const optimized = optimizeList(updatedList);

      setShoppingList(updatedList);
      setOptimizedRoute(optimized);

      const botMessage: Message = {
        role: 'assistant',
        content: `🛒 Added: ${newItems.join(', ')}\n\n📍 Optimal Route:\n${optimized.join(' → ')}`,
      };

      setMessages([...newMessages, botMessage]);
    } catch (err) {
      console.error("❌ sendMessage error:", err);
      setError(err instanceof Error ? err.message : 'Failed to communicate with AI service');
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView className="h-full bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
        ref={scrollViewRef}
        onScrollBeginDrag={dismissKeyboard}
      >
        <View className="flex flex-row items-center justify-between mt-5">
          <Text className="text-xl font-rubik-bold">Explore</Text>
        </View>

        {loading ? (
          <Text className="text-center text-gray-500 mt-5">Loading user...</Text>
        ) : isLogged && user ? (
          <View className="flex flex-row items-center mt-5">
            <Image
              source={{ uri: user.avatar }}
              className="size-10 rounded-full mr-2"
            />
            <Text className="text-lg font-rubik-medium text-black-300">
              Hello, {user.name}!
            </Text>
          </View>
        ) : (
          <Text className="text-center text-gray-500 mt-5">
            You are not logged in.
          </Text>
        )}

        {error && (
          <Text className="text-center text-red-500 mt-5">{error}</Text>
        )}

        <View className="mt-5">
          {messages.map((item, index) => (
            <View
              key={index}
              className={`p-3 m-1 rounded-lg ${
                item.role === 'user'
                  ? 'bg-blue-100 self-end'
                  : 'bg-gray-100 self-start'
              }`}
            >
              <Text className="text-black-300 font-rubik">{item.content}</Text>
            </View>
          ))}
        </View>

        <View className="mt-5">
          <Text className="text-base font-rubik-bold mb-2 text-black-300">
            🛒 Current List:
          </Text>
          {shoppingList.map((item, i) => (
            <Text key={i} className="text-sm text-black-100 ml-2">• {item}</Text>
          ))}

          <Text className="text-base font-rubik-bold mt-4 mb-2 text-black-300">
            📍 Optimized Route:
          </Text>
          {optimizedRoute.map((item, i) => (
            <Text key={i} className="text-sm text-black-100 ml-2">→ {item}</Text>
          ))}
        </View>
      </ScrollView>

      <View
        className="absolute left-0 right-0 px-7 w-full border-t border-primary-200 bg-white py-4"
        style={{ bottom: 100 }}
      >
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 p-3 border rounded-lg font-rubik text-black-300"
            placeholder={isLogged ? 'Type a message...' : 'Log in to chat'}
            value={input}
            onChangeText={setInput}
            editable={isLogged}
          />
          <TouchableOpacity
            className={`ml-2 p-3 ${isLogged ? 'bg-green-500' : 'bg-gray-400'} rounded-lg`}
            onPress={sendMessage}
            disabled={!isLogged}
          >
            <Text className="text-white font-rubik-bold">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Explore;
