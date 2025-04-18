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
    <View style={[
      styles.row, 
      role === 'user' ? styles.userRow : styles.assistantRow
    ]}>
      {role === 'assistant' && (
        <View style={styles.avatarContainer}>
          <View style={[styles.item, { backgroundColor: '#32a852' }]}>
            <Image source={images.icon} style={styles.btnImage} />
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#32a852" size="small" />
        </View>
      ) : (
        <View style={[
          styles.bubbleContainer,
          role === 'user' ? styles.userBubbleContainer : styles.assistantBubbleContainer
        ]}>
          <View style={[
            styles.bubble,
            role === 'user' ? styles.userBubble : styles.assistantBubble
          ]}>
            <Text style={[
              styles.text,
              role === 'user' ? styles.userText : styles.assistantText
            ]}>
              {content}
            </Text>
          </View>
        </View>
      )}

      {role === 'user' && (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: user?.avatar }} style={styles.avatar} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 34,
    height: 34,
    justifyContent: 'flex-end',
  },
  item: {
    borderRadius: 17,
    overflow: 'hidden',
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnImage: {
    width: 20,
    height: 20,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#000',
  },
  bubbleContainer: {
    maxWidth: '75%',
    minWidth: 40,
    marginHorizontal: 8,
  },
  userBubbleContainer: {
    alignItems: 'flex-end',
  },
  assistantBubbleContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: '#32a852',
  },
  assistantBubble: {
    backgroundColor: '#f1f1f1',
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: '#333',
  },
  loadingContainer: {
    backgroundColor: '#f1f1f1',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginLeft: 8,
    minWidth: 40,
    justifyContent: 'center',
  },
});

export default ChatMessage; 