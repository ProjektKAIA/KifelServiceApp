// app/(employee)/chat.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';

interface Message {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  content: string;
  time: string;
}

const mockMessages: Message[] = [
  { id: '1', userId: '2', userName: 'Thomas M.', userInitials: 'TM', content: 'Guten Morgen zusammen! Wer ist heute in Forst?', time: '09:15' },
  { id: '2', userId: '1', userName: 'Max Mustermann', userInitials: 'MM', content: 'Ich bin da! Gerade angekommen 👍', time: '09:18' },
  { id: '3', userId: '3', userName: 'Sandra K.', userInitials: 'SK', content: 'Perfekt! Ich komme um 10 Uhr nach.', time: '09:20' },
  { id: '4', userId: '4', userName: 'Chef', userInitials: 'CH', content: 'Kurze Teambesprechung um 15 Uhr. Bitte alle dabei sein!', time: '09:25' },
];

const avatarColors: Record<string, string> = {
  '1': '#22c55e',
  '2': '#3b82f6',
  '3': '#f59e0b',
  '4': '#8b5cf6',
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const currentUserId = user?.id || '1';

  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: currentUserId,
      userName: `${user?.firstName || 'Max'} ${user?.lastName || 'Mustermann'}`,
      userInitials: 'MM',
      content: inputText.trim(),
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInputText('');

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.userId === currentUserId;
    const avatarColor = avatarColors[item.userId] || '#6b7280';

    if (isOwn) {
      return (
        <View style={styles.ownMessageRow}>
          <View style={styles.ownMessageMeta}>
            <Text style={[styles.messageTime, { color: theme.textMuted }]}>Du · {item.time}</Text>
          </View>
          <View style={[styles.ownMessageBubble, { backgroundColor: '#22c55e' }]}>
            <Text style={styles.ownMessageText}>{item.content}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{item.userInitials}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherMessageRow}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{item.userInitials}</Text>
        </View>
        <View style={styles.otherMessageContent}>
          <Text style={[styles.messageSender, { color: theme.textMuted }]}>
            {item.userName} · {item.time}
          </Text>
          <View style={[styles.otherMessageBubble, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.otherMessageText, { color: theme.text }]}>{item.content}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>CHAT</Text>
        </View>
        <Text style={[styles.memberCount, { color: theme.textMuted }]}>12 Mitglieder</Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Team-Chat</Text>
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder }]}
            placeholder="Nachricht..."
            placeholderTextColor={theme.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary }]}
            onPress={handleSend}
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
    paddingTop: spacing.lg,
  },
  badge: {
    alignSelf: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: spacing.md,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  memberCount: {
    fontSize: 13,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  messagesList: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
  otherMessageRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  otherMessageContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  messageSender: {
    fontSize: 11,
    marginBottom: 4,
  },
  otherMessageBubble: {
    padding: spacing.md,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    maxWidth: '85%',
  },
  otherMessageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ownMessageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  ownMessageMeta: {
    position: 'absolute',
    top: -16,
    right: 48,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageBubble: {
    padding: spacing.md,
    borderRadius: 16,
    borderTopRightRadius: 4,
    maxWidth: '70%',
    marginRight: spacing.sm,
  },
  ownMessageText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.base,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});