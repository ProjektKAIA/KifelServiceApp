// src/types/index.ts

export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface VacationRequest {
  id: string;
  userId: string;
  type: 'vacation' | 'sick' | 'other';
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  readBy: string[];
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'team' | 'direct';
  members: string[];
  lastMessage?: ChatMessage;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface NotificationPayload {
  id: string;
  type: 'shift' | 'vacation' | 'chat' | 'system';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  createdAt: string;
  read: boolean;
}