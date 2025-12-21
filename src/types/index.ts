// src/types/index.ts

// Benutzer
export type UserRole = 'employee' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// Arbeitszeit
export interface TimeEntry {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  startLocation: GpsLocation;
  endLocation?: GpsLocation;
  shiftId?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface GpsLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  address?: string;
}

// Dienstplan
export interface Shift {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  description?: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

// Abwesenheit
export type AbsenceType = 'vacation' | 'sick' | 'other';
export type AbsenceStatus = 'pending' | 'approved' | 'rejected';

export interface Absence {
  id: string;
  userId: string;
  type: AbsenceType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: AbsenceStatus;
  approvedBy?: string;
  createdAt: string;
}

// Chat
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  isDeleted: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  memberCount: number;
  lastMessage?: ChatMessage;
  createdAt: string;
}

// Kontakt & Bewerbung
export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  message?: string;
  resumeUrl?: string;
  status: 'new' | 'reviewing' | 'interview' | 'rejected' | 'hired';
  createdAt: string;
}

// Stats
export interface EmployeeStats {
  hoursThisMonth: number;
  remainingVacation: number;
  pendingRequests: number;
}

export interface AdminStats {
  activeEmployees: number;
  offDuty: number;
  onSickLeave: number;
  onVacation: number;
  pendingRequests: number;
}