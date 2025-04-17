import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import icons from '@/constants/icons';
import { config, databases } from '@/lib/appwrite';
import { Models } from "react-native-appwrite";
import { searchGoods } from '@/lib/appwrite';
import { Link } from 'expo-router';
import { useShoppingList } from "@/lib/shopping-list-provider";
import images from "@/constants/images";

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
console.log("🔑 Loaded API KEY:", API_KEY);

// Add better API key validation
if (!API_KEY) {
  console.error("❌ No API key found in environment variables");
}

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// System prompt for the AI
const getSystemPrompt = (currentList: ShoppingListItem[]): Message => ({
  role: 'system',
  content: `You are a helpful and friendly shopping assistant at Magnolia store. Your role is to:
1. Help users build and modify their shopping lists
2. Provide information about available goods and suggestions
3. Answer questions about goods availability and location
4. Suggest complementary items

Current Shopping List:
${currentList.map(item => `- ${item.name} ($${item.price})`).join('\n')}

Keep responses conversational and helpful. When adding items:
- Confirm what's being added
- Be aware of what's already in the list
- Suggest related items that aren't already in the list
- Mention any current deals
- Be friendly but concise
- If user mentions removing items, acknowledge that they're no longer in the list

Example responses:
"I've added milk to your list! Would you also need some cereal?"
"I see you've removed the apples. Would you like to try a different fruit instead?"
"Great choice! The bread is really fresh today. I notice you have butter in your list - perfect combination!"
"I see you're getting pasta. Would you like me to add sauce too? Our marinara is on sale!"`,
});

interface Good extends Models.Document {
  name: string;
  category: string;
  imageId: string;
  price: number;
  rating: number;
}

interface ShoppingListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  imageId: string;
  rating: number;
}

const Explore = () => {
  const { isLogged, user, loading } = useGlobalContext();
  const { shoppingList, addToShoppingList } = useShoppingList();
  const [messages, setMessages] = useState<Message[]>([
    getSystemPrompt([]),
    {
      role: 'assistant',
      content: "Hi! I'm your Magnolia shopping assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
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

  function optimizeList(items: ShoppingListItem[]) {
    return items
      .sort((a, b) => {
        const aIndex = aisleOrder.indexOf(a.category);
        const bIndex = aisleOrder.indexOf(b.category);
        return aIndex - bIndex;
      })
      .map((item) => item.name);
  }

  const formatInventoryResponse = (categories: string[]) => {
    // Sort categories alphabetically
    const sortedCategories = [...categories].sort();
    return sortedCategories.map((cat: string) => {
      const goods = shoppingList.filter((item) => item.category === cat);
      const categoryName = cat.replace(/([A-Z])/g, ' $1').trim(); // Add spaces between camelCase
      return `📦 ${categoryName}:\n${goods.map((item) => `• ${item.name} - $${item.price}`).join('\n')}`;
    }).join('\n\n');
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Update system prompt when shopping list changes
  useEffect(() => {
    setMessages(prev => [
      getSystemPrompt(shoppingList),
      ...prev.slice(1)
    ]);
  }, [shoppingList]);

  // Extract items from AI response
  const extractItemsFromResponse = (response: string): string[] => {
    const itemRegex = /add(?:ed|ing)?\s+([^.!?]+)(?:to your list|to the list)?/i;
    const match = response.match(itemRegex);
    if (match) {
      return match[1].split(/,|\sand\s/).map(item => item.trim());
    }
    return [];
  };

  const findGood = async (name: string): Promise<Good | null> => {
    try {
      // We can use the existing searchGoods function from appwrite.ts
      const results = await searchGoods(name);
      if (results.length > 0) {
        const doc = results[0];
        if (
          'name' in doc &&
          'category' in doc &&
          'imageId' in doc &&
          'price' in doc &&
          'rating' in doc
        ) {
          return doc as Good;
        }
      }
      return null;
    } catch (error) {
      console.error('Error searching for good:', error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!API_KEY) {
      setError("API key is missing. Please check your environment variables.");
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      // Include current shopping list state in the conversation
      const currentMessages = [
        getSystemPrompt(shoppingList),
        ...messages.slice(1),
        userMessage
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: currentMessages,
          temperature: 0.7,
          max_tokens: 150,
          presence_penalty: 0.6,
          frequency_penalty: 0.2,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get response');
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || '';
      
      // Extract any items mentioned in the response
      const newItems = extractItemsFromResponse(aiResponse);
      if (newItems.length > 0) {
        await addToShoppingList(newItems);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: aiResponse,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error("Error in sendMessage:", err);
      setError(err instanceof Error ? err.message : 'Failed to communicate with AI service');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View className="flex-1">
          {/* Header */}
          <View className="px-5 py-3 border-b border-gray-100">
            <Text className="text-xl font-rubik-bold text-black-300">Magnolia</Text>
            {isLogged && user && (
              <View className="flex-row items-center mt-2">
                <Image
                  source={{ uri: user.avatar }}
                  className="w-6 h-6 rounded-full"
                />
                <Text className="ml-2 text-sm font-rubik text-black-200">
                  Shopping as {user.name}
                </Text>
              </View>
            )}
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-5"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 90 : 0 }}
          >
            {messages.slice(1).map((msg, index) => (
              <View
                key={index}
                className={`my-2 max-w-[85%] ${
                  msg.role === 'user' ? 'self-end ml-auto' : 'self-start'
                }`}
              >
                <View className="flex-row items-end">
                  {msg.role === 'assistant' && (
                    <Image 
                      source={images.icon}
                      className="w-6 h-6 rounded-full mr-2 mb-1"
                    />
                  )}
                  <View
                    className={`rounded-2xl p-3 ${
                      msg.role === 'user'
                        ? 'bg-primary-300'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`text-sm font-rubik ${
                        msg.role === 'user' ? 'text-white' : 'text-black-300'
                      }`}
                    >
                      {msg.content}
                    </Text>
                  </View>
                  {msg.role === 'user' && (
                    <Image 
                      source={{ uri: user?.avatar }}
                      className="w-6 h-6 rounded-full ml-2 mb-1"
                    />
                  )}
                </View>
              </View>
            ))}

            {isTyping && (
              <View className="self-start my-2">
                <View className="flex-row items-end">
                  <Image 
                    source={images.icon}
                    className="w-6 h-6 rounded-full mr-2 mb-1"
                  />
                  <View className="bg-gray-100 rounded-2xl p-3">
                    <ActivityIndicator size="small" color="#32a852" />
                  </View>
                </View>
              </View>
            )}

            {/* Shopping List Display */}
            {shoppingList.length > 0 && (
              <View className="my-4 p-4 bg-gray-50 rounded-lg">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-base font-rubik-bold text-black-300">
                    🛒 Shopping List:
                  </Text>
                  <Link href="/list" asChild>
                    <TouchableOpacity>
                      <Text className="text-sm font-rubik text-primary-300">
                        View Full List →
                      </Text>
                    </TouchableOpacity>
                  </Link>
                </View>
                {shoppingList.map((item, i) => (
                  <Link
                    key={i}
                    href={`/product/${item.id}`}
                    asChild
                  >
                    <TouchableOpacity className="mb-2">
                      <Text className="text-sm text-black-200 font-rubik">
                        • {item.name} - ${item.price} ({item.category})
                      </Text>
                    </TouchableOpacity>
                  </Link>
                ))}
                <Text className="text-sm font-rubik-bold text-black-300 mt-2">
                  Total: ${shoppingList.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                </Text>
              </View>
            )}

            {error && (
              <View className="my-2 p-3 bg-red-100 rounded-lg">
                <Text className="text-sm text-red-600">{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <View className="absolute bottom-0 left-0 right-0 px-4 pb-4 border-t border-gray-100 bg-white">
            <View className="flex-row items-center bg-gray-50 rounded-full px-4 mt-2">
              <TextInput
                className="flex-1 py-3 text-base font-rubik text-black-300"
                placeholder={isLogged ? "Type your message..." : "Log in to chat"}
                value={input}
                onChangeText={setInput}
                editable={isLogged}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!isLogged || !input.trim()}
                className={`ml-2 p-2 rounded-full ${
                  !isLogged || !input.trim() ? 'opacity-50' : ''
                }`}
              >
                <Image 
                  source={icons.send} 
                  className="w-6 h-6"
                  style={{ tintColor: '#32a852' }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Explore;
