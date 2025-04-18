import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import { config, databases } from '@/lib/appwrite';
import { Models } from "react-native-appwrite";
import { Link } from 'expo-router';
import { useShoppingList } from "@/lib/shopping-list-provider";
import images from "@/constants/images";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Query } from "appwrite";
import ChatMessage from '@/components/ChatMessage';
import MessageInput from '@/components/MessageInput';
import MessageIdeas from '@/components/MessageIdeas';
import ShoppingListPreview from '@/components/ShoppingListPreview';

const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';
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
- CRUCIAL: When adding items to the list, ALWAYS INCLUDE the product code [P#] - this is REQUIRED for the system to work

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
✅ "I'll add that milk [P12] to your list! Since you're in dairy, would you also need some eggs [P24]?"
✅ "You're picking up pasta [P45]—would you like some marinara sauce [P52] too? It's on sale!"
✅ "You'll find the bread [P31] in our Bakery section near the front. By the way, our croissants [P33] are freshly baked this morning!"

PRODUCT MENTION GUIDELINES:
- When referring to products, ALWAYS use the EXACT name as it appears in our inventory
- For example, say "Frozen Pizza" not just "pizza" if the product name is "Frozen Pizza"
- Be precise with product names to ensure the system correctly identifies what to add
- Use the FULL product name consistently throughout the conversation
- Example: Use "Frozen Pizza [P18]" not just "pizza" if the product is called "Frozen Pizza"

HOW TO USE PRODUCT CODES:
1. For every product you want to add to the list, include the [P#] code ONCE in your message
2. The code should appear right after the first mention of the product
3. Example: "I've added Frozen Pizza [P18] to your list, it's in the Frozen Foods section."
4. After using the code once, you can refer to the product without the code
5. Format: ProductName [P#] - with no space between P and the number

CRITICAL RULES:
1. When adding products to the list, YOU MUST INCLUDE THE PRODUCT CODE [P#] SOMEWHERE in your message
2. The [P#] codes should NOT be visible to users in your displayed response
3. Only suggest products that exist in our inventory
4. If a product isn't in our inventory, say "I apologize, but I don't see that product in our current inventory. Would you like to see what similar products we have available?"
5. Keep track of the shopping list and suggest complementary items
6. Mention relevant deals and promotions
7. Group items by department when possible
8. Be helpful and friendly, but don't make assumptions about product availability
9. Always use COMPLETE product names as they appear in our system

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

// Function to handle product extraction and addition to shopping list
const handleProductsInResponse = async (messageContent: string, productCodeMap: Record<string, any>, addToShoppingList: (products: string[]) => Promise<void>) => {
  console.log("⏳ Analyzing message for products...");
  console.log("📝 Message content length:", messageContent.length);
  console.log("📝 First 100 chars:", messageContent.substring(0, 100));
  console.log("📝 Last 100 chars:", messageContent.substring(messageContent.length - 100));
  
  // Track products that have been added in this conversation turn
  // to prevent duplicate additions from the AI response
  const addedProducts = new Set<string>();
  
  try {
    // Try different regex patterns to find product codes
    const patterns = [
      /\[P(\d+)\]/g,  // Standard [P123] format
      /\[P\s*(\d+)\]/g,  // With possible space [P 123]
      /P(\d+)/g,  // Without brackets P123
      /Product\s*(\d+)/ig,  // With "Product" prefix
    ];
    
    let productIds: string[] = [];
    
    // Try each pattern
    for (const pattern of patterns) {
      let match;
      const currentIds: string[] = [];
      
      // Create a copy of the string for this regex
      const contentCopy = messageContent.slice();
      
      // Extract all product codes using regex
      while ((match = pattern.exec(contentCopy)) !== null) {
        const productId = match[1]; // Get the number inside pattern
        currentIds.push(productId);
      }
      
      if (currentIds.length > 0) {
        console.log(`🔍 Found ${currentIds.length} product IDs with pattern ${pattern}:`, currentIds);
        productIds = [...productIds, ...currentIds];
      }
    }
    
    // Deduplicate product IDs
    productIds = [...new Set(productIds)];
    console.log("🔍 Total unique product IDs found:", productIds);
    
    if (productIds.length > 0) {
      // Map product IDs to product codes [P#]
      const productCodes = productIds.map(id => `[P${id}]`);
      console.log("🏷️ Product codes to check:", productCodes);
      
      // Log all available product codes for debugging
      console.log("🗂️ Available product codes:", Object.keys(productCodeMap).length);
      console.log("🗂️ Sample available codes:", Object.keys(productCodeMap).slice(0, 5));
      
      // Filter valid products and get their names
      const validProducts = productCodes
        .filter(code => {
          const hasProduct = !!productCodeMap[code];
          if (!hasProduct) {
            console.log(`⚠️ Product code ${code} not found in product map`);
          }
          return hasProduct;
        })
        .map(code => {
          console.log(`✅ Found product ${code}:`, productCodeMap[code].name);
          return productCodeMap[code].name;
        });
      
      console.log("🛒 Products to add:", validProducts);
      
      if (validProducts.length > 0) {
        // Track added products to prevent duplications
        validProducts.forEach(product => addedProducts.add(product.toLowerCase()));
        
        try {
          await addToShoppingList(validProducts);
          console.log("✅ Successfully added products to shopping list");
        } catch (error) {
          console.error("❌ Error adding products to shopping list:", error);
        }
      } else {
        console.log("⚠️ No valid products found from extracted codes");
      }
    } else {
      console.log("ℹ️ No product codes found in message");
      
      // IMPROVED PRODUCT NAME DETECTION
      // Extract potential product mentions using a more sophisticated approach
      console.log("🔍 Using improved product name detection...");
      
      // 1. Extract all words and phrases from the message that might be products
      const lowerCaseContent = messageContent.toLowerCase();
      const productsByRelevance: Array<{name: string, score: number}> = [];
      
      // 2. For each product in our inventory, calculate a relevance score
      for (const product of Object.values(productCodeMap)) {
        const productName = product.name;
        const lowerCaseName = productName.toLowerCase();
        
        // Skip very short product names (less than 3 chars) to avoid false positives
        if (lowerCaseName.length < 3) continue;
        
        // Check for exact match first (highest priority)
        if (lowerCaseContent.includes(lowerCaseName)) {
          // Calculate how specific the match is (longer names = more specific)
          // and how many times it appears in the message
          const occurrences = (lowerCaseContent.match(new RegExp(`\\b${lowerCaseName}\\b`, 'gi')) || []).length;
          const score = lowerCaseName.length * 10 + (occurrences * 5);
          
          console.log(`🎯 Exact match for "${productName}" with score ${score}`);
          productsByRelevance.push({name: productName, score});
          continue;
        }
        
        // For multi-word product names, check if all words are present
        // For example, "Frozen Pizza" should match if both "frozen" and "pizza" are present
        const words: string[] = lowerCaseName.split(' ');
        if (words.length > 1) {
          const allWordsPresent = words.every(word => {
            // Skip very short words
            if (word.length < 3) return true;
            return lowerCaseContent.includes(word);
          });
          
          if (allWordsPresent) {
            // Calculate score based on how close the words are in the message
            const score = lowerCaseName.length * 5;
            console.log(`✅ All words present for "${productName}" with score ${score}`);
            productsByRelevance.push({name: productName, score});
            continue;
          }
        }
        
        // Check for partial matches (lower priority)
        // Only consider if the product name is longer than 4 characters
        // to avoid matches like "a" or "the"
        if (lowerCaseName.length > 4) {
          // For product names like "Frozen Pizza", check if "pizza" is mentioned
          for (const word of words) {
            if (word.length > 3 && lowerCaseContent.includes(word)) {
              // Calculate a more sophisticated score for partial matches
              let score = word.length * 2;
              
              // If this is a key product word (like "pizza" in "Frozen Pizza"),
              // it should get a higher score than generic words
              const isKeyWord = word.length > 4 && !['with', 'and', 'the'].includes(word);
              if (isKeyWord) {
                // Word boundary matches are much stronger signals
                const wordBoundaryRegex = new RegExp(`\\b${word}\\b`, 'i');
                if (wordBoundaryRegex.test(lowerCaseContent)) {
                  score += 15; // Significant boost for exact word matches
                  
                  // Check if the user specifically requested this product
                  // Using patterns like "add X" or "I want X" or "X please"
                  const requestPatterns = [
                    new RegExp(`add\\s+.*?\\b${word}\\b`, 'i'),
                    new RegExp(`want\\s+.*?\\b${word}\\b`, 'i'),
                    new RegExp(`\\b${word}\\b.*?please`, 'i'),
                    new RegExp(`some\\s+.*?\\b${word}\\b`, 'i'),
                  ];
                  
                  if (requestPatterns.some(pattern => pattern.test(lowerCaseContent))) {
                    score += 20; // Extra boost for explicit requests
                    console.log(`🎯 User seems to be specifically requesting "${word}" in "${productName}"`);
                  }
                }
              }
              
              // If the word appears multiple times, it's more likely to be relevant
              const wordOccurrences = (lowerCaseContent.match(new RegExp(word, 'gi')) || []).length;
              if (wordOccurrences > 1) {
                score += wordOccurrences * 3;
              }
              
              console.log(`🔍 Partial match on word "${word}" for "${productName}" with score ${score}`);
              productsByRelevance.push({name: productName, score});
              break;
            }
          }
        }
      }
      
      // Sort by relevance score (highest first)
      productsByRelevance.sort((a, b) => b.score - a.score);
      
      // Log top matches
      console.log("🏆 Top matching products by relevance:");
      productsByRelevance.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i+1}. ${p.name} (score: ${p.score})`);
      });
      
      // Extract the product name from the HIGHEST-scoring match only
      // Only take the top product instead of multiple products
      let productToAdd: string | null = null;
      
      if (productsByRelevance.length > 0) {
        const topProduct = productsByRelevance[0];
        // Only consider if score is high enough
        if (topProduct.score > 15) {
          productToAdd = topProduct.name;
          console.log(`🥇 Selected top product: "${productToAdd}" with score ${topProduct.score}`);
          
          // Check if there's a second product with a very close score
          // If so, prefer products that match the first word of user's query
          if (productsByRelevance.length > 1) {
            const secondProduct = productsByRelevance[1];
            console.log(`🥈 Second best product: "${secondProduct.name}" with score ${secondProduct.score}`);
            
            // If the scores are very close (within 20%), check if one is a better match for the user's query
            if (secondProduct.score > topProduct.score * 0.8) {
              console.log(`⚖️ Scores are very close, refining selection...`);
              
              // Get the first few words of the user message to compare against
              const userMessage = messageContent.toLowerCase().split(/[^\w]+/).filter(w => w.length > 2).slice(0, 3);
              console.log(`🗣️ User message starting words: ${userMessage.join(', ')}`);
              
              // Check if either product name contains any of these words
              const topProductWords = topProduct.name.toLowerCase().split(/\s+/);
              const secondProductWords = secondProduct.name.toLowerCase().split(/\s+/);
              
              const topMatchesUserStart = userMessage.some(word => 
                topProductWords.some(prodWord => prodWord.includes(word) || word.includes(prodWord))
              );
              
              const secondMatchesUserStart = userMessage.some(word => 
                secondProductWords.some(prodWord => prodWord.includes(word) || word.includes(prodWord))
              );
              
              // If the second product matches the user query better, choose it instead
              if (secondMatchesUserStart && !topMatchesUserStart) {
                productToAdd = secondProduct.name;
                console.log(`🔄 Changed selection to: "${productToAdd}" - better match for user query`);
              }
            }
          }
        }
      }
      
      if (productToAdd) {
        console.log(`🛒 Product found by intelligent name matching: "${productToAdd}"`);
        
        // Skip if we've already added this product in this conversation turn
        if (addedProducts.has(productToAdd.toLowerCase())) {
          console.log(`⚠️ Skipping "${productToAdd}" as it was already added in this conversation turn`);
          return;
        }
        
        // Check for request words/phrases in the message that indicate user intent to add products
        const additionIndicators = ['add', 'want', 'need', 'put', 'include', 'get me', 'give me', 'buy'];
        const messageHasAddRequest = additionIndicators.some(indicator => 
          lowerCaseContent.includes(indicator)
        );

        // Only add products when there's clear intent
        if (messageHasAddRequest || productsByRelevance[0]?.score > 30) {
          try {
            // Add only the single product with highest confidence
            addedProducts.add(productToAdd.toLowerCase());
            await addToShoppingList([productToAdd]);
            console.log(`✅ Successfully added product "${productToAdd}" to shopping list`);
          } catch (error) {
            console.error(`❌ Error adding product "${productToAdd}" to shopping list:`, error);
          }
        } else {
          console.log(`⚠️ Found potential product match (${productToAdd}) but no clear intent to add it to cart`);
        }
      } else {
        console.log("❌ No confident product match found in the message");
      }
    }
  } catch (error) {
    console.error("❌ Error in handleProductsInResponse:", error);
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
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [height, setHeight] = useState(0);
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

  // Update system prompt when shopping list changes
  useEffect(() => {
    setMessages(prev => [
      getSystemPrompt(shoppingList),
      ...prev.slice(1)
    ]);
  }, [shoppingList]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const onLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setHeight(height / 2);
  };

  const sendMessage = async (input: string) => {
    if (!input.trim()) return;
    if (!API_KEY) {
      setError("API key is missing. Please check your environment variables.");
      return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setError(null);

    try {
      // Get all available products first
      const availableProducts = await getAllProducts();
      console.log("🏪 Available products loaded:", availableProducts.length);
      
      // Format products with codes
      const formattedProducts = formatProductList(availableProducts);
      console.log(`🏷️ Formatted ${formattedProducts.length} products with codes`);
      
      // Create a map of product codes to product details
      const productCodeMap = Object.fromEntries(
        formattedProducts.map(p => [p.code, p])
      );
      
      // Log a few products to verify mapping
      const sampleCodes = Object.keys(productCodeMap).slice(0, 3);
      console.log("🔍 Sample product mapping:");
      sampleCodes.forEach(code => {
        console.log(`  ${code} => ${productCodeMap[code].name} ($${productCodeMap[code].price})`);
      });

      // Refresh thread every 10 messages to ensure fresh context
      const messageCount = messages.length;
      if (messageCount > 0 && messageCount % 10 === 0) {
        await refreshThread(API_KEY);
      }

      // First create a thread if we don't have one
      let threadId = await AsyncStorage.getItem('thread_id') || '';
      
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

**CRITICALLY IMPORTANT INSTRUCTIONS**:
1. You MUST use product codes [P1], [P2], etc. in your responses
2. When adding a product to the shopping list, the [P#] code MUST be included in your message
3. The product codes are REQUIRED for the system to understand which items to add
4. Keep these codes in the background of your message, don't make them visible to users
5. Only suggest products from this list
6. If a product isn't in this list, politely inform the user it's not in stock
7. Keep your responses natural and conversational
8. Use the EXACT product names as listed - this is CRITICAL for the system to work
9. Maintain accurate pricing in your responses

PRODUCT NAME ACCURACY IS CRITICAL:
- Always use the FULL product name exactly as shown above
- For example, use "Frozen Pizza [P18]" not just "pizza" 
- Product name accuracy directly impacts if the right item gets added to the cart
- Do not abbreviate, shorten or paraphrase product names

Examples of REQUIRED technique (NOT OPTIONAL):
✅ "I'll add Milk [P5] to your list! It's in the dairy section."
✅ "Here's some Bread [P22] that would go well with that."
✅ "Would you like to try our fresh Eggs [P12]? They're on sale."
❌ "I'll add some milk to your list." (WRONG - missing the product code)
❌ "Would you like some pizza?" (WRONG - not using the full product name "Frozen Pizza")

IMPORTANT: The [P#] codes MUST be included somewhere in your message - this is the ONLY way items can be added to the shopping list. If you don't include them, the system cannot add items to the list.`
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

      // Handle products in the response
      await handleProductsInResponse(messageContent, productCodeMap, addToShoppingList);

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
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-5 py-3 border-b border-gray-100">
          {isLogged && user && (
            <View className="flex-row items-center mt-2">
              <Image
                source={{ uri: user.avatar }}
                className="size-12 rounded-full"
              />
              <View className="ml-3">
                <Text className="text-sm font-rubik text-black-200">
                  Shopping as {user.name}
                </Text>
                <Text className="text-xl font-rubik-bold text-black-300">
                  Magnolia
                </Text>
              </View>  
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} onLayout={onLayout}>
          {/* Shopping List Preview */}
          <ShoppingListPreview isFloating={true} />

          {/* Logo when no messages */}
          {messages.length <= 1 && (
            <View style={{ 
              alignSelf: 'center', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: 50, 
              height: 50, 
              backgroundColor: '#32a852', 
              borderRadius: 50,
              marginTop: height / 2 - 100 
            }}>
              <Image source={images.icon} style={{ width: 30, height: 30, resizeMode: 'cover' }} />
            </View>
          )}

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ 
              flex: 1,
              marginHorizontal: 10,
              zIndex: 1, // Lower z-index than floating elements
            }}
            contentContainerStyle={{ 
              paddingTop: 20, 
              paddingBottom: 230, // Increased to allow space for input and keyboard
              paddingHorizontal: 5,
            }}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {messages.slice(1).map((item, index) => (
              <ChatMessage 
                key={index}
                role={item.role} 
                content={item.content} 
                loading={false}
              />
            ))}
          </ScrollView>

          {isTyping && (
            <View style={{ 
              position: 'absolute', 
              bottom: 145, 
              left: 14,
              zIndex: 800,
            }}>
              <ChatMessage 
                role="assistant" 
                content="" 
                loading={true}
              />
            </View>
          )}
          
          {error && (
            <View className="my-2 mx-5 p-3 bg-red-100 rounded-lg">
              <Text className="text-sm text-red-600">{error}</Text>
            </View>
          )}
        </View>

        {/* Message Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 70}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            marginBottom: 70, // Add bottom margin to account for the tab bar
            zIndex: 900, // High z-index but below ShoppingListPreview
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#f0f0f0',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 3,
          }}>
          {messages.length <= 1 && isLogged && <MessageIdeas onSelectCard={sendMessage} />}
          <MessageInput onShouldSend={sendMessage} enabled={isLogged} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default Explore;
