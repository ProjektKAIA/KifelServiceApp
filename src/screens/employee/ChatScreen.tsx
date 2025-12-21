// src/screens/employee/ChatScreen.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { useAuthStore } from '../../store/authStore';

// Mock-Daten
const mockMessages = [
  {
    id: '1',
    userId: '2',
    userName: 'Thomas M.',
    content: 'Guten Morgen zusammen! Wer ist heute in Forst?',
    createdAt: '2024-12-12T09:15:00',
  },
  {
    id: '2',
    userId: '1',
    userName: 'Max Mustermann',
    content: 'Ich bin da! Gerade angekommen 👍',
    createdAt: '2024-12-12T09:18:00',
  },
  {
    id: '3',
    userId: '3',
    userName: 'Sandra K.',
    content: 'Perfekt! Ich komme um 10 Uhr nach.',
    createdAt: '2024-12-12T09:20:00',
  },
  {
    id: '4',
    userId: '4',
    userName: 'Chef',
    content: 'Kurze Teambesprechung um 15 Uhr. Bitte alle dabei sein!',
    createdAt: '2024-12-12T09:25:00',
  },
];

const avatarColors: { [key: string]: string } = {
  '1': '#22c55e',
  '2': '#3b82f6',
  '3': '#f59e0b',
  '4': '#8b5cf6',
};

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState(mockMessages);
  const [inputText, setInputText] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (userId: string) => {
    return avatarColors[userId] || '#3b82f6';
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      userId: user?.id || '1',
      userName: `${user?.firstName || 'Max'} ${user?.lastName || 'Mustermann'}`,
      content: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: typeof mockMessages[0] }) => {
    const isOwnMessage = item.userId === (user?.id || '1');
    const messageTime = format(new Date(item.createdAt), 'HH:mm');

    return (
      <View style={[
        styles.messageRow,
        isOwnMessage && styles.messageRowSent,
      ]}>
        {!isOwnMessage && (
          <View style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(item.userId) },
          ]}>
            <Text style={styles.avatarText}>
              {getInitials(item.userName)}
            </Text>
          </View>
        )}
        <View style={isOwnMessage ? styles.sentContainer : styles.receivedContainer}>
          <Text style={[styles.messageMeta, { color: theme.textMuted }]}>
            {isOwnMessage ? 'Du' : item.userName} · {messageTime}
          </Text>
          <View style={[
            styles.bubble,
            isOwnMessage ? styles.bubbleSent : styles.bubbleReceived,
            !isOwnMessage && { backgroundColor: theme.surface },
          ]}>
            <Text style={[
              styles.messageText,
              { color: isOwnMessage ? '#fff' : theme.text },
            ]}>
              {item.content}
            </Text>
          </View>
        </View>
        {isOwnMessage && (
          <View style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(item.userId) },
          ]}>
            <Text style={styles.avatarText}>
              {getInitials(item.userName)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerSmall, { color: theme.textMuted }]}>
          12 Mitglieder
        </Text>
        <Text style={[styles.headerLarge, { color: theme.text }]}>
          Team-Chat
        </Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={[styles.inputContainer, { 
          backgroundColor: theme.background,
          borderTopColor: theme.border,
        }]}>
          <TextInput
            style={[styles.input, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.text,
            }]}
            placeholder="Nachricht..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.base,
    paddingBottom: spacing.md,
  },
  headerSmall: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  headerLarge: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  messagesList: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.base,
    alignItems: 'flex-start',
  },
  messageRowSent: {
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  receivedContainer: {
    marginLeft: spacing.sm,
    flex: 1,
    maxWidth: '75%',
  },
  sentContainer: {
    marginRight: spacing.sm,
    flex: 1,
    maxWidth: '75%',
    alignItems: 'flex-end',
  },
  messageMeta: {
    fontSize: 10,
    marginBottom: 4,
  },
  bubble: {
    padding: spacing.md,
    borderRadius: 18,
  },
  bubbleReceived: {
    borderBottomLeftRadius: 4,
  },
  bubbleSent: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.base,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.base,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.input,
    borderWidth: 1,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.button,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});