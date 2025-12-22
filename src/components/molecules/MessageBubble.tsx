// src/components/molecules/MessageBubble.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '@/components/atoms/Avatar';
import { Typography } from '@/components/atoms/Typography';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/spacing';

interface MessageBubbleProps {
  userName: string;
  content: string;
  time: string;
  isOwn: boolean;
  avatarColor?: string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  userName,
  content,
  time,
  isOwn,
  avatarColor,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.row, isOwn && styles.rowReverse]}>
      <Avatar name={userName} size="sm" backgroundColor={avatarColor} />
      
      <View style={[styles.content, isOwn ? styles.contentSent : styles.contentReceived]}>
        <Typography variant="caption" color="muted" style={styles.meta}>
          {isOwn ? 'Du' : userName} · {time}
        </Typography>
        
        <View
          style={[
            styles.bubble,
            isOwn ? styles.bubbleSent : [styles.bubbleReceived, { backgroundColor: theme.surface }],
          ]}
        >
          <Text style={[styles.text, { color: isOwn ? '#fff' : theme.text }]}>
            {content}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.base,
    alignItems: 'flex-start',
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  content: {
    flex: 1,
    maxWidth: '75%',
  },
  contentReceived: {
    marginLeft: spacing.sm,
  },
  contentSent: {
    marginRight: spacing.sm,
    alignItems: 'flex-end',
  },
  meta: {
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
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});