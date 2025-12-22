// app/(employee)/chat.tsx

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
import { Send, Users } from 'lucide-react-native';
import { colors } from '@/src/theme/colors';
import { spacing, borderRadius } from '@/src/theme/spacing';
import { useAuthStore } from '@/src/store/authStore';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = colors[colorScheme];
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', userId: '2', userName: 'Anna S.', text: 'Guten Morgen zusammen! 👋', timestamp: Date.now() - 3600000, isOwn: false },
    { id: '2', userId: '3', userName: 'Tom W.', text: 'Morgen! Wer ist heute am Standort Nord?', timestamp: Date.now() - 3000000, isOwn: false },
    { id: '3', userId: '1', userName: 'Max M.', text: 'Ich bin heute dort, Tom.', timestamp: Date.now() - 2400000, isOwn: true },
    { id: '4', userId: '2', userName: 'Anna S.', text: 'Ich bin Mitte. Falls jemand Schichttausch braucht, meldet euch!', timestamp: Date.now() - 1800000, isOwn: false },
  ]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: user?.id || '1',
      userName: `${user?.firstName || 'Max'} ${user?.lastName?.[0] || 'M'}.`,
      text: messageText.trim(),
      timestamp: Date.now(),
      isOwn: true,
    };

    setMessages([...messages, newMessage]);
    setMessageText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageContainer, item.isOwn && styles.messageContainerOwn]}>
      {!item.isOwn && (
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <Text style={styles.avatarText}>{getInitials(item.userName)}</Text>
        </View>
      )}
      <View style={[
        styles.messageBubble,
        item.isOwn
          ? { backgroundColor: theme.primary }
          : { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder, borderWidth: 1 }
      ]}>
        {!item.isOwn && (
          <Text style={[styles.messageName, { color: theme.primary }]}>{item.userName}</Text>
        )}
        <Text style={[styles.messageText, { color: item.isOwn ? '#fff' : theme.text }]}>{item.text}</Text>
        <Text style={[styles.messageTime, { color: item.isOwn ? 'rgba(255,255,255,0.7)' : theme.textMuted }]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.borderLight }]}>
        <View style={[styles.headerIcon, { backgroundColor: `${theme.primary}15` }]}>
          <Users size={20} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Team-Chat</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>12 Mitglieder</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.borderLight }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.text }]}
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Nachricht schreiben..."
            placeholderTextColor={theme.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!messageText.trim()}
            activeOpacity={0.7}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.base, gap: spacing.md, borderBottomWidth: 1 },
  headerIcon: { width: 44, height: 44, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  headerSubtitle: { fontSize: 12 },
  messagesList: { padding: spacing.base, paddingBottom: spacing.md },
  messageContainer: { flexDirection: 'row', marginBottom: spacing.md, maxWidth: '85%' },
  messageContainerOwn: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  avatarText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  messageBubble: { borderRadius: borderRadius.card, padding: spacing.md, maxWidth: '100%' },
  messageName: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  messageText: { fontSize: 15, lineHeight: 21 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.base, gap: spacing.sm, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: borderRadius.button, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: borderRadius.button, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
});