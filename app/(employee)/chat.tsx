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
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, X, AtSign } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
import { useTranslation } from '@/src/hooks/useTranslation';
import { chatCollection, usersCollection } from '@/src/lib/firestore';
import { ChatMessage, ChatRoom, User } from '@/src/types';
import { moderateMessage, parseMessageWithMentions, MessagePart } from '@/src/utils/chatModeration';

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
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [showMentionPicker, setShowMentionPicker] = useState(false);

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

        // Get member count and store team members for @mentions
        const users = await usersCollection.getAll();
        const activeUsers = users.filter(u => u.status !== 'inactive' && u.status !== 'deleted');
        setMemberCount(activeUsers.length);
        setTeamMembers(activeUsers);

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

    // Moderiere Nachricht (Schimpfwort-Filter)
    const moderation = moderateMessage(messageContent);

    if (!moderation.isClean) {
      Alert.alert(
        t('chat.moderationTitle'),
        t('chat.moderationMessage'),
        [{ text: t('common.ok') }]
      );
    }

    setInputText('');

    try {
      await chatCollection.sendMessage(
        chatRoom.id,
        user.id,
        `${user.firstName} ${user.lastName}`,
        moderation.filteredContent // Gefilterten Inhalt senden
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

  // @mention einfügen
  const handleMention = (selectedUser: User) => {
    const mentionText = `@${selectedUser.firstName}${selectedUser.lastName} `;
    setInputText(prev => prev + mentionText);
    setShowMentionPicker(false);
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  // Rendert Nachrichteninhalt mit hervorgehobenen @mentions
  const renderMessageContent = (content: string, isOwn: boolean) => {
    const parts = parseMessageWithMentions(content);

    return (
      <Text style={isOwn ? [styles.ownMessageText, { color: theme.textInverse }] : [styles.otherMessageText, { color: theme.text }]}>
        {parts.map((part, index) => {
          if (part.type === 'mention') {
            return (
              <Text
                key={index}
                style={[
                  styles.mentionText,
                  {
                    color: isOwn ? '#ffffff' : theme.primary,
                    fontWeight: '700',
                  }
                ]}
              >
                {part.content}
              </Text>
            );
          }
          return <Text key={index}>{part.content}</Text>;
        })}
      </Text>
    );
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
            <Text style={[styles.messageTime, { color: theme.textMuted }]}>{t('chat.you')} · {formatTime(item.timestamp)}</Text>
          </View>
          <View style={[styles.ownMessageBubble, { backgroundColor: theme.success }]}>
            {renderMessageContent(item.content, true)}
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
            {renderMessageContent(item.content, false)}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top - 20 }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
          <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>CHAT</Text>
        </View>
        <Text style={[styles.memberCount, { color: theme.textMuted }]}>{memberCount} {t('chat.members')}</Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('empChat.title')}</Text>
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
              {t('empChat.noMessages')} {t('empChat.startConversation')}
            </Text>
          </View>
        }
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          {/* @mention Button */}
          <TouchableOpacity
            style={[styles.mentionButton, { backgroundColor: theme.surface }]}
            onPress={() => setShowMentionPicker(true)}
            activeOpacity={0.7}
          >
            <AtSign size={20} color={theme.primary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.inputBorder }]}
            placeholder={t('empChat.placeholder')}
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

      {/* @mention Picker Modal */}
      <Modal
        visible={showMentionPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMentionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.mentionPickerContainer, { backgroundColor: theme.background }]}>
            <View style={styles.mentionPickerHeader}>
              <Text style={[styles.mentionPickerTitle, { color: theme.text }]}>{t('empChat.mentionPerson')}</Text>
              <TouchableOpacity onPress={() => setShowMentionPicker(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.mentionList}>
              {teamMembers
                .filter(member => member.id !== currentUserId)
                .map(member => (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.mentionItem, { borderBottomColor: theme.border }]}
                    onPress={() => handleMention(member)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.mentionAvatar, { backgroundColor: getAvatarColor(member.id, theme) }]}>
                      <Text style={[styles.avatarText, { color: theme.textInverse }]}>
                        {getInitials(`${member.firstName} ${member.lastName}`)}
                      </Text>
                    </View>
                    <View style={styles.mentionInfo}>
                      <Text style={[styles.mentionName, { color: theme.text }]}>
                        {member.firstName} {member.lastName}
                      </Text>
                      <Text style={[styles.mentionHandle, { color: theme.primary }]}>
                        @{member.firstName}{member.lastName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingTop: 0,
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
  mentionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentionText: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  mentionPickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: spacing.xl,
  },
  mentionPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  mentionPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  mentionList: {
    paddingHorizontal: spacing.base,
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  mentionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mentionInfo: {
    marginLeft: spacing.md,
  },
  mentionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  mentionHandle: {
    fontSize: 13,
    marginTop: 2,
  },
});
