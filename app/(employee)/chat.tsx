// app/(employee)/chat.tsx

import React, { useState, useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { MessageBubble } from '@/src/components/molecules';
import { ScreenHeader, ChatInput } from '@/src/components/organisms';

import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { spacing } from '@/src/constants/spacing';

const mockMessages = [
  { id: '1', userId: '2', userName: 'Thomas M.', content: 'Guten Morgen zusammen! Wer ist heute in Forst?', createdAt: '2024-12-12T09:15:00' },
  { id: '2', userId: '1', userName: 'Max Mustermann', content: 'Ich bin da! Gerade angekommen 👍', createdAt: '2024-12-12T09:18:00' },
  { id: '3', userId: '3', userName: 'Sandra K.', content: 'Perfekt! Ich komme um 10 Uhr nach.', createdAt: '2024-12-12T09:20:00' },
  { id: '4', userId: '4', userName: 'Chef', content: 'Kurze Teambesprechung um 15 Uhr. Bitte alle dabei sein!', createdAt: '2024-12-12T09:25:00' },
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

  const [messages, setMessages] = useState(mockMessages);
  const [inputText, setInputText] = useState('');

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

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: typeof mockMessages[0] }) => {
    const isOwn = item.userId === (user?.id || '1');
    const time = format(new Date(item.createdAt), 'HH:mm');

    return (
      <MessageBubble
        userName={item.userName}
        content={item.content}
        time={time}
        isOwn={isOwn}
        avatarColor={avatarColors[item.userId]}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeader overline="12 Mitglieder" title="Team-Chat" style={styles.header} />

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <ChatInput value={inputText} onChangeText={setInputText} onSend={handleSend} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
  },
  messagesList: {
    padding: spacing.base,
    paddingBottom: spacing.xl,
  },
});