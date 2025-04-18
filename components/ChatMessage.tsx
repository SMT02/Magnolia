import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native';
import { Link } from 'expo-router';
import images from "@/constants/images";
import { useGlobalContext } from '@/lib/global-provider';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const ChatMessage = ({
  content,
  role,
  loading,
}: Message & { loading?: boolean }) => {
  const { user } = useGlobalContext();

  return (
    <View style={styles.row}>
      {role === 'assistant' ? (
        <View style={[styles.item, { backgroundColor: '#32a852' }]}>
          <Image source={images.icon} style={styles.btnImage} />
        </View>
      ) : (
        <Image source={{ uri: user?.avatar }} style={styles.avatar} />
      )}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#32a852" size="small" />
        </View>
      ) : (
        <Text style={[styles.text, 
          role === 'user' ? styles.userText : styles.assistantText
        ]}>{content}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    gap: 14,
    marginVertical: 12,
  },
  item: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  btnImage: {
    margin: 6,
    width: 16,
    height: 16,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#000',
  },
  text: {
    padding: 4,
    fontSize: 16,
    flexWrap: 'wrap',
    flex: 1,
  },
  userText: {
    color: 'white',
    backgroundColor: '#32a852',
    borderRadius: 18,
    padding: 10,
  },
  assistantText: {
    color: '#333',
    backgroundColor: '#f1f1f1',
    borderRadius: 18,
    padding: 10,
  },
  loading: {
    justifyContent: 'center',
    height: 26,
    marginLeft: 14,
  },
});

export default ChatMessage; 