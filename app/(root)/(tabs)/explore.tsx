<<<<<<< HEAD
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';

// ✅ Ensure the API key is correctly loaded
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Explore Screen
 * - Mimics the style and layout from the Profile screen
 * - Ensures the chat input bar is placed above the bottom tabs
 * - Uses consistent fonts/colors (font-rubik, text-black-300, etc.)
 */
const Explore = () => {
  const { isLogged, user, loading } = useGlobalContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to the bottom when messages update
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setError(null);

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'system', content: 'You are a helpful assistant.' }, ...newMessages],
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Unknown error');
      }

      const data = await response.json();
      const botMessage: Message = {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || 'No response received.',
      };
      setMessages([...newMessages, botMessage]);
    } catch (err) {
      setError('Failed to get response. Please check API key and try again.');
    }
  };

  /**
   * Focus the chat input, close keyboard, etc.
   */
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <SafeAreaView className="h-full bg-white">
      {/**
       Use a ScrollView similar to Profile:
       - Give enough bottom padding so content isn't obscured by the tab bar.
       - Mimic the style from Profile with px-7 and pb-32.
      */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 px-7"
        ref={scrollViewRef}
        onScrollBeginDrag={dismissKeyboard}
      >
        {/* Header */}
        <View className="flex flex-row items-center justify-between mt-5">
          <Text className="text-xl font-rubik-bold">Explore</Text>
        </View>

        {/* User Info or Loading */}
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

        {/* Error Message */}
        {error && (
          <Text className="text-center text-danger mt-5">{error}</Text>
        )}

        {/* Chat Messages */}
        <View className="mt-5">
          {messages.map((item, index) => (
            <View
              key={index}
              className={`p-3 m-1 rounded-lg ${
                item.role === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'
              }`}
            >
              <Text className="text-black-300 font-rubik">{item.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Chat Input Container shifted up by ~100px and button is green. */}
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
=======
import { View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { generateRoute } from '../../../components/Routing';

const Explore = () => {
  const [route, setRoute] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const userSelectedIds = [1, 2, 4, 5, 6, 7, 9, 27]; // Current testing input - To be replaced by chatbot inputs later

  const handleGenerateRoute = async () => {
    setLoading(true);
    const generatedRoute = await generateRoute(userSelectedIds);
    setRoute(generatedRoute);
    setLoading(false);
  };

  return (
    <ScrollView style={{ padding: 16, backgroundColor: '#f5f5f5' }}>
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
          Explore - Route Generation
        </Text>

        {/* Button to generate the route */}
        <Button title="Generate Route" onPress={handleGenerateRoute} />

        {/* Display loading spinner */}
        {loading && (
          <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 16 }} />
        )}

        {/* Display the generated route */}
        {route.length > 0 && !loading && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Your Route:</Text>
            {route.map((checkpoint, index) => (
              <Text key={index} style={{ fontSize: 14, marginVertical: 4 }}>
                {checkpoint}
              </Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
>>>>>>> AdamDatabaseBranch2
  );
};

export default Explore;
