// src/store/chatStore.ts

import { create } from 'zustand';
import { ChatMessage, ChatRoom } from '../types';

interface ChatState {
  rooms: ChatRoom[];
  activeRoom: ChatRoom | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  setRooms: (rooms: ChatRoom[]) => void;
  setActiveRoom: (room: ChatRoom | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, data: Partial<ChatMessage>) => void;
  deleteMessage: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSending: (sending: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  rooms: [],
  activeRoom: null,
  messages: [],
  isLoading: false,
  isSending: false,
  error: null as string | null,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  setRooms: (rooms) => set({ rooms }),

  setActiveRoom: (activeRoom) => set({ activeRoom }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, data) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...data } : msg
      ),
    })),

  deleteMessage: (id) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, isDeleted: true, content: 'Nachricht gelöscht' } : msg
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setSending: (isSending) => set({ isSending }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));