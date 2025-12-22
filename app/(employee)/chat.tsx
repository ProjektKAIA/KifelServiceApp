// app/(employee)/chat.tsx

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  const scrollViewRef = useRef<ScrollView>(null);

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', userId: '2', userName: 'Max Müller', text: 'Guten Morgen zusammen! 👋', timestamp: Date.now() - 3600000, isOwn: false },
    { id: '2', userId: '3', userName: 'Anna Schmidt', text: 'Morgen! Wer ist heute am Standort Forst?', timestamp: Date.now() - 3500000, isOwn: false },
    { id: '3', userId: '1', userName: 'Ich', text: 'Ich bin heute dort, ab 8 Uhr.', timestamp: Date.now() - 3400000, isOwn: true },
    { id: '4', userId: '2', userName: 'Max Müller', text: 'Super, ich komme auch gegen 8:30.', timestamp: Date.now() - 3300000, isOwn: false },
    { id: '5', userId: '4', userName: 'Lisa Weber', text: 'Kann jemand morgen meine Schicht übernehmen? Habe einen Arzttermin.', timestamp: Date.now() - 1800000, isOwn: false },
  ]);

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSend = () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: user?.id || '1',
      userName: 'Ich',
      text: message.trim(),
      timestamp: Date.now(),
      isOwn: true,
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={[styles.groupIcon, { backgroundColor: theme.surface }]}>
            <Users size={20} color={theme.primary} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Team-Chat</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textMuted }]}>
              5 Mitglieder online
            </Text>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((msg, index) => {
            const showAvatar = !msg.isOwn && (index === 0 || messages[index - 1].userId !== msg.userId);
            const showName = showAvatar;

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  msg.isOwn ? styles.messageRowOwn : styles.messageRowOther,
                ]}
              >
                {!msg.isOwn && (
                  <View style={styles.avatarContainer}>
                    {showAvatar ? (
                      <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.avatarText, { color: theme.textSecondary }]}>
                          {getInitials(msg.userName)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.avatarPlaceholder} />
                    )}
                  </View>
                )}

                <View style={[styles.messageBubble, msg.isOwn ? styles.bubbleOwn : [styles.bubbleOther, { backgroundColor: theme.surface }]]}>
                  {showName && (
                    <Text style={[styles.messageName, { color: theme.primary }]}>
                      {msg.userName}
                    </Text>
                  )}
                  <Text style={[styles.messageText, { color: msg.isOwn ? '#fff' : theme.text }]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.messageTime, { color: msg.isOwn ? 'rgba(255,255,255,0.7)' : theme.textMuted }]}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, color: theme.text }]}
            placeholder="Nachricht schreiben..."
            placeholderTextColor={theme.textMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim()}
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
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.base, borderBottomWidth: 1 },
  groupIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSubtitle: { fontSize: 12 },
  messageList: { flex: 1 },
  messageListContent: { padding: spacing.base, gap: spacing.xs },
  messageRow: { flexDirection: 'row', marginBottom: 2 },
  messageRowOwn: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  avatarContainer: { width: 32, marginRight: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 10, fontWeight: '600' },
  avatarPlaceholder: { width: 28 },
  messageBubble: { maxWidth: '75%', padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 16 },
  bubbleOwn: { backgroundColor: '#3b82f6', borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  messageName: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.base, borderTopWidth: 1 },
  input: { flex: 1, padding: 12, paddingTop: 12, borderRadius: 20, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.5 },
});