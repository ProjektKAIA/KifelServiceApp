// app/(admin)/chat.tsx - Admin Chat mit @all und Moderation

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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, X, AtSign, Trash2, Users, Shield } from 'lucide-react-native';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';
import { useTheme } from '@/src/hooks/useTheme';
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

export default function AdminChatScreen() {
  const { theme } = useTheme();
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
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [showMessageOptions, setShowMessageOptions] = useState(false);

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
        'Hinweis',
        'Die Nachricht enthält unangemessene Wörter. Diese wurden automatisch gefiltert.',
        [{ text: 'OK' }]
      );
    }

    setInputText('');

    try {
      await chatCollection.sendMessage(
        chatRoom.id,
        user.id,
        `${user.firstName} ${user.lastName}`,
        moderation.filteredContent
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
  const handleMention = (selectedUser: User | 'all') => {
    if (selectedUser === 'all') {
      setInputText(prev => prev + '@all ');
    } else {
      const mentionText = `@${selectedUser.firstName}${selectedUser.lastName} `;
      setInputText(prev => prev + mentionText);
    }
    setShowMentionPicker(false);
  };

  // Nachricht löschen (Admin Moderation)
  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    Alert.alert(
      'Nachricht löschen',
      'Möchtest du diese Nachricht wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await chatCollection.deleteMessage(selectedMessage.id);
              setShowMessageOptions(false);
              setSelectedMessage(null);
            } catch (error) {
              console.error('Error deleting message:', error);
              Alert.alert('Fehler', 'Nachricht konnte nicht gelöscht werden.');
            }
          },
        },
      ]
    );
  };

  // Long press auf Nachricht
  const handleMessageLongPress = (message: ChatMessage) => {
    setSelectedMessage(message);
    setShowMessageOptions(true);
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
            // @all speziell hervorheben
            const isAll = part.content.toLowerCase() === '@all';
            return (
              <Text
                key={index}
                style={[
                  styles.mentionText,
                  {
                    color: isOwn ? '#ffffff' : (isAll ? theme.danger : theme.primary),
                    fontWeight: '700',
                    backgroundColor: isAll ? (isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.1)') : 'transparent',
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
      return (
        <View style={styles.deletedMessageRow}>
          <Text style={[styles.deletedMessageText, { color: theme.textMuted }]}>
            Nachricht wurde gelöscht
          </Text>
        </View>
      );
    }

    if (isOwn) {
      return (
        <TouchableOpacity
          style={styles.ownMessageRow}
          onLongPress={() => handleMessageLongPress(item)}
          activeOpacity={0.8}
        >
          <View style={styles.ownMessageMeta}>
            <Text style={[styles.messageTime, { color: theme.textMuted }]}>Du · {formatTime(item.timestamp)}</Text>
          </View>
          <View style={[styles.ownMessageBubble, { backgroundColor: theme.success }]}>
            {renderMessageContent(item.content, true)}
          </View>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={[styles.avatarText, { color: theme.textInverse }]}>{initials}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.otherMessageRow}
        onLongPress={() => handleMessageLongPress(item)}
        activeOpacity={0.8}
      >
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
      </TouchableOpacity>
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
        <View style={styles.headerRow}>
          <View style={[styles.badge, { backgroundColor: theme.pillInfo }]}>
            <Text style={[styles.badgeText, { color: theme.pillInfoText }]}>CHAT</Text>
          </View>
          <View style={[styles.adminBadge, { backgroundColor: theme.pillSecondary }]}>
            <Shield size={12} color={theme.pillSecondaryText} />
            <Text style={[styles.adminBadgeText, { color: theme.pillSecondaryText }]}>ADMIN</Text>
          </View>
        </View>
        <Text style={[styles.memberCount, { color: theme.textMuted }]}>{memberCount} Mitglieder</Text>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Team-Chat</Text>
        <Text style={[styles.adminHint, { color: theme.textMuted }]}>
          Lange auf Nachricht drücken zum Löschen
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

      {/* @mention Picker Modal (mit @all für Admin) */}
      <Modal
        visible={showMentionPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMentionPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.mentionPickerContainer, { backgroundColor: theme.background }]}>
            <View style={styles.mentionPickerHeader}>
              <Text style={[styles.mentionPickerTitle, { color: theme.text }]}>Person erwähnen</Text>
              <TouchableOpacity onPress={() => setShowMentionPicker(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.mentionList}>
              {/* @all Option - nur für Admin */}
              <TouchableOpacity
                style={[styles.mentionItem, styles.mentionAllItem, { borderBottomColor: theme.border, backgroundColor: theme.pillDanger + '20' }]}
                onPress={() => handleMention('all')}
                activeOpacity={0.7}
              >
                <View style={[styles.mentionAvatar, { backgroundColor: theme.danger }]}>
                  <Users size={20} color={theme.textInverse} />
                </View>
                <View style={styles.mentionInfo}>
                  <Text style={[styles.mentionName, { color: theme.danger, fontWeight: '700' }]}>
                    @alle
                  </Text>
                  <Text style={[styles.mentionHandle, { color: theme.textMuted }]}>
                    Benachrichtigt alle {memberCount} Mitglieder
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Einzelne Mitglieder */}
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

      {/* Message Options Modal (Löschen) */}
      <Modal
        visible={showMessageOptions}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMessageOptions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageOptions(false)}
        >
          <View style={[styles.optionsContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.optionsTitle, { color: theme.text }]}>Nachricht-Optionen</Text>

            {selectedMessage && (
              <View style={[styles.selectedMessagePreview, { backgroundColor: theme.surface }]}>
                <Text style={[styles.previewText, { color: theme.textMuted }]} numberOfLines={2}>
                  {selectedMessage.content}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: theme.danger }]}
              onPress={handleDeleteMessage}
              activeOpacity={0.8}
            >
              <Trash2 size={20} color="#ffffff" />
              <Text style={styles.optionButtonText}>Nachricht löschen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => setShowMessageOptions(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Abbrechen</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminBadgeText: {
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
  adminHint: {
    fontSize: 11,
    marginTop: spacing.xs,
    fontStyle: 'italic',
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
  deletedMessageRow: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  deletedMessageText: {
    fontSize: 12,
    fontStyle: 'italic',
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
    maxHeight: '70%',
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
  mentionAllItem: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
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
  optionsContainer: {
    margin: spacing.base,
    borderRadius: 16,
    padding: spacing.base,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  selectedMessagePreview: {
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  previewText: {
    fontSize: 13,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  optionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
