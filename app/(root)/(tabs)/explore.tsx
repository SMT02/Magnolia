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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Query } from "appwrite";

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
console.log("🔑 Loaded API KEY:", API_KEY);

// Add better API key validation
if (!API_KEY) {
  console.error("❌ No API key found in environment variables");
}

const ASSISTANT_ID = "asst_nbZZGs77RJ9gBufyJVrnMEE1";

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

// System prompt for the AI
const getSystemPrompt = (currentList: ShoppingListItem[]): Message => ({
  role: 'system',
  content: `# Magnolia AI Shopping Assistant

You are Magnolia's AI shopping assistant, designed to help customers with their shopping experience in a friendly, conversational way.

Current Shopping List:
${currentList.map(item => `- ${item.name} ($${item.price})`).join('\n')}

CORE RESPONSIBILITIES:
1. Shopping List Management
- Help users build and modify their shopping lists
- Suggest complementary items based on what's already in their list
- Remember items mentioned throughout the conversation
- Confirm additions/removals naturally and conversationally

2. Product Knowledge
- Provide detailed information about products (price, location, availability)
- Suggest related items and mention current deals
- If unsure about a product, ask for clarification

3. Navigation & Route Optimization
- Help users locate items in store
- Group items by department or aisle

CONVERSATION STYLE:
- Friendly and casual, but professional
- Use natural, human language
- Keep responses concise but helpful
- Use emojis sparingly
- Address users by name when available

RESPONSE EXAMPLES:
✅ "I'll add that milk to your list! Since you're in dairy, would you also need some eggs?"
✅ "You're picking up pasta—would you like some marinara sauce too? It's on sale!"
✅ "You'll find the bread in our Bakery section near the front. By the way, our croissants are freshly baked this morning!"

CRITICAL RULES:
1. NEVER show or mention the [P1], [P2] product codes to users
2. Only suggest products that exist in our inventory
3. If a product isn't in our inventory, say "I apologize, but I don't see that product in our current inventory. Would you like to see what similar products we have available?"
4. Keep track of the shopping list and suggest complementary items
5. Mention relevant deals and promotions
6. Group items by department when possible
7. Be helpful and friendly, but don't make assumptions about product availability

PRIVACY & SECURITY:
- Do not share personal customer data
- Do not promise item availability without verification
- Do not discuss internal policies or logistics`,
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

// Function to get all available products
const getAllProducts = async () => {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      config.goodsCollectionId!,
      [Query.orderAsc("$createdAt"), Query.limit(100)]
    );
    return result.documents.map(doc => ({
      name: doc.name,
      category: doc.category,
      price: doc.price,
      id: doc.$id
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Function to format product list with codes
const formatProductList = (products: any[]) => {
  return products.map((p, index) => {
    const code = `[P${index + 1}]`;
    return {
      ...p,
      code,
      display: `${code} ${p.name} (${p.category}) - $${p.price}`
    };
  });
};

// Extract product codes from response
const extractProductCodes = (response: string): string[] => {
  const codeRegex = /\[P\d+\]/g;
  const matches = response.match(codeRegex) || [];
  return matches;
};

// Function to refresh thread
const refreshThread = async (apiKey: string) => {
  try {
    // Delete old thread if it exists
    const oldThreadId = await AsyncStorage.getItem('thread_id');
    if (oldThreadId) {
      await AsyncStorage.removeItem('thread_id');
    }
    return null;
  } catch (error) {
    console.error("Error refreshing thread:", error);
    return null;
  }
};

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
      // Get all available products first
      const availableProducts = await getAllProducts();
      console.log("Available products loaded:", availableProducts.length);
      
      // Format products with codes
      const formattedProducts = formatProductList(availableProducts);
      const productCodeMap = Object.fromEntries(
        formattedProducts.map(p => [p.code, p])
      );

      // Refresh thread every 10 messages to ensure fresh context
      const messageCount = messages.length;
      if (messageCount > 0 && messageCount % 10 === 0) {
        await refreshThread(API_KEY);
      }

      // First create a thread if we don't have one
      let threadId = await AsyncStorage.getItem('thread_id');
      
      if (!threadId) {
        console.log("Creating new thread...");
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({})
        });
        
        if (!threadResponse.ok) {
          const errorData = await threadResponse.json();
          console.error("Thread creation error:", errorData);
          throw new Error(`Failed to create thread: ${errorData.error?.message || 'Unknown error'}`);
        }

        const threadData = await threadResponse.json();
        console.log("Thread created:", threadData);
        threadId = threadData.id as string;
        await AsyncStorage.setItem('thread_id', threadId);

        // Send initial context about available products
        const contextMessage = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'OpenAI-Beta': 'assistants=v2'
          },
          body: JSON.stringify({
            role: 'user',
            content: `IMPORTANT: This is a new conversation. Here is your product inventory:

${formattedProducts.map(p => p.display).join('\n')}

CRITICAL RULES:
1. You MUST use product codes [P1], [P2], etc. internally for tracking
2. NEVER show these codes to users in your responses
3. Only suggest products from this list
4. If a product isn't in this list, politely inform the user it's not in stock
5. Keep your responses natural and conversational
6. Use the exact product names as listed
7. Maintain accurate pricing in your responses

Example correct responses:
✅ "I'll add the milk to your list! Would you like some eggs too?"
✅ "I've found our fresh bread in stock. Would you like me to add it to your list?"
✅ "I'm sorry, but I don't see that item in our current inventory. Would you like to see some similar products we have available?"

Remember: While you must use the [P_] codes internally for tracking, never show them to users in your responses.`
          })
        });

        if (!contextMessage.ok) {
          console.error("Failed to send product context");
        }
      }

      console.log("Using thread:", threadId);

      // Add the user's message
      const messageResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: input
        })
      });

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        console.error("Message creation error:", errorData);
        throw new Error(`Failed to add message: ${errorData.error?.message || 'Unknown error'}`);
      }

      // Run the assistant
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: ASSISTANT_ID
        })
      });

      if (!runResponse.ok) {
        const errorData = await runResponse.json();
        console.error("Run creation error:", errorData);
        throw new Error(`Failed to run assistant: ${errorData.error?.message || 'Unknown error'}`);
      }

      const runData = await runResponse.json();
      console.log("Run created:", runData);

      // Poll for completion
      let runStatus = await checkRunStatus(threadId, runData.id, API_KEY);
      while (runStatus === 'in_progress' || runStatus === 'queued') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await checkRunStatus(threadId, runData.id, API_KEY);
      }

      // Get the messages
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!messagesResponse.ok) {
        const errorData = await messagesResponse.json();
        console.error("Messages retrieval error:", errorData);
        throw new Error(`Failed to get messages: ${errorData.error?.message || 'Unknown error'}`);
      }

      const messagesData = await messagesResponse.json();
      const lastMessage = messagesData.data[0];
      const messageContent = lastMessage.content[0].text.value;

      // Extract product codes and validate them
      const productCodes = extractProductCodes(messageContent);
      const validProducts = productCodes
        .filter(code => productCodeMap[code])
        .map(code => productCodeMap[code].name);

      if (validProducts.length > 0) {
        await addToShoppingList(validProducts);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: messageContent,
      };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error("Error in sendMessage:", err);
      setError(err instanceof Error ? err.message : 'Failed to communicate with AI service');
    } finally {
      setIsTyping(false);
    }
  };

  // Helper function to check run status
  const checkRunStatus = async (threadId: string, runId: string, apiKey: string) => {
    const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });
    if (!response.ok) throw new Error('Failed to check run status');
    const data = await response.json();
    return data.status;
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
