// src/types/index.ts

export type UserRole = 'employee' | 'admin';

export type UserStatus = 'active' | 'inactive' | 'deleted' | 'invited';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  avatar?: string;
  location?: string;
  language?: 'de' | 'en' | 'tr' | 'ru'; // Sprache für Push-Notifications
  // Erweiterte Profildaten
  street?: string;
  zipCode?: string;
  city?: string;
  birthDate?: string;
  employeeId?: string; // Personalnummer
  department?: string;
  position?: string;
  startDate?: string; // Eintrittsdatum
  // Urlaubstage
  vacationDaysTotal?: number;
  vacationDaysUsed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  street?: string;
  zipCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string; // Steuernummer
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  userId: string;
  employeeId?: string; // Alias für Kompatibilität
  employeeName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: string;
  locationId?: string; // Referenz auf Location-Dokument
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
  content: string;
  text?: string; // Alias
  timestamp: number;
  createdAt?: string;
  readBy: string[];
  isDeleted?: boolean;
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
  radius?: number; // Validierungs-Radius in Metern
}

export interface LocationValidation {
  isValid: boolean;
  distanceMeters: number;
  expectedLocationName: string;
  thresholdMeters: number;
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

export interface EmployeeStats {
  hoursThisMonth: number;
  hoursThisWeek: number;
  remainingVacationDays: number;
  usedVacationDays: number;
}

export interface AdminStats {
  totalEmployees: number;
  activeToday: number;
  onVacation: number;
  sick: number;
  pendingRequests: number;
}

// Admin-Benachrichtigungen (z.B. Profil-Änderungen)
export interface AdminNotification {
  id: string;
  type: 'profile_change' | 'vacation_request' | 'sick_leave' | 'system';
  userId: string; // Wer hat die Änderung gemacht
  userName: string;
  title: string;
  message: string;
  changes?: Record<string, { old: string; new: string }>; // Was wurde geändert
  createdAt: string;
  readBy: string[]; // Welche Admins haben es gelesen
  isRead?: boolean; // Für UI
}

// Einladungs-System
export interface Invite {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  location?: string;
  role: UserRole;
  token: string;
  createdBy: string; // Admin ID
  createdAt: string;
  expiresAt: string;
  acceptedAt?: string;
  status: 'pending' | 'accepted' | 'expired';
}