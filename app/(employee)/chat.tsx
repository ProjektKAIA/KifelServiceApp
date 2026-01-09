// app/(employee)/chat.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { chatCollection, usersCollection } from '@/src/lib/firestore';
import { ChatMessage, ChatRoom, User } from '@/src/types';

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getAvatarColor = (userId: string, theme: any): string => {
  const colors = [theme.primary, theme.success, theme.warning, theme.secondary, theme.danger];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function ChatScreen() {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [memberCount, setMemberCount] = useState(0);

  const currentUserId = user?.id || '';

  // Initialize chat room and subscribe to messages
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initChat = async () => {
      try {
        // Get or create team chat room
        const room = await chatCollection.getTeamRoom();
        if (!room) {
          setIsLoading(false);
          return;
        }
        setChatRoom(room);

        // Get member count
        const users = await usersCollection.getAll();
        setMemberCount(users.filter(u => u.status !== 'inactive' && u.status !== 'deleted').length);

        // Subscribe to realtime messages
        unsubscribe = chatCollection.subscribeToMessages(room.id, (newMessages) => {
          setMessages(newMessages);
          setIsLoading(false);
        });
      } catch (error) {
        console.error('Error initializing chat:', error);
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !user || !chatRoom || isSending) return;

    setIsSending(true);
    const messageContent = inputText.trim();
    setInputText('');

    try {
      await chatCollection.sendMessage(
        chatRoom.id,
        user.id,
        `${user.firstName} ${user.lastName}`,
        messageContent
      );

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(messageContent);
    } finally {
      setIsSending(false);
    }
  }, [inputText, user, chatRoom, isSending]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.userId === currentUserId;
    const avatarColor = getAvatarColor(item.userId, theme);
    const initials = getInitials(item.userName);

    if (item.isDeleted) {
      return null;
    }

    if (isOwn) {
      return (
        <View style={styles.ownMessageRow}>
          <View style={styles.ownMessageMeta}>
            <Text style={[styles.messageTime, { color: theme.textMuted }]}>Du · {formatTime(item.timestamp)}</Text>
          </View>
          <View style={[styles.ownMessageBubble, { backgroundColor: theme.success }]}>
            <Text style={[styles.ownMessageText, { color: theme.textInverse }]}>{item.content}</Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={[styles.avatarText, { color: theme.textInverse }]}>{initials}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.otherMessageRow}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={[styles.avatarText, { color: theme.textInverse }]}>{initials}</Text>
        </View>
        <View style={styles.otherMessageContent}>
          <Text style={[styles.messageSender, { color: theme.textMuted }]}>
            {item.userName} · {formatTime(item.timestamp)}
          </Text>
          <View style={[styles.otherMessageBubble, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.otherMessageText, { color: theme.text }]}>{item.content}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>CHAT</Text>
        </View>
        <Text style={[styles.memberCount, { color: theme.textMuted }]}>{memberCount} Mitglieder</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              Noch keine Nachrichten. Starte die Unterhaltung!
            </Text>
          </View>
        }
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
            editable={!isSending}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: theme.primary, opacity: isSending ? 0.5 : 1 }]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={isSending || !inputText.trim()}
          >
            <Send size={20} color={theme.textInverse} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
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
