import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRef, useState } from 'react';
import icons from '@/constants/icons';
import { Image } from 'react-native';

export type Props = {
  onShouldSend: (message: string) => void;
  enabled?: boolean;
};

const MessageInput = ({ onShouldSend, enabled = true }: Props) => {
  const [message, setMessage] = useState('');
  const { bottom } = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const onChangeText = (text: string) => {
    setMessage(text);
  };

  const onSend = () => {
    if (message.trim() && enabled) {
      onShouldSend(message);
      setMessage('');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: bottom || 10, paddingTop: 10 }]}>
      <View style={styles.row}>
        <TextInput
          autoFocus={false}
          ref={inputRef}
          placeholder={enabled ? "Type your message..." : "Log in to chat"}
          style={[styles.messageInput, !enabled && styles.disabledInput]}
          onChangeText={onChangeText}
          value={message}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={onSend}
          editable={enabled}
          className="text-base font-rubik text-black-300 caret-green-600"
        />
        <TouchableOpacity 
          onPress={onSend} 
          disabled={!enabled || !message.trim()}
          className="ml-2 p-2 rounded-full"
          style={{ opacity: (!enabled || !message.trim()) ? 0.5 : 1 }}
        >
          <Image 
            source={icons.send} 
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e5e5',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  messageInput: {
    flex: 1,
    marginHorizontal: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    padding: 10,
    borderColor: '#e5e5e5',
    backgroundColor: '#f1f1f1',
  },
  disabledInput: {
    backgroundColor: '#f9f9f9',
    color: '#999',
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#32a852',
  }
});

export default MessageInput; 