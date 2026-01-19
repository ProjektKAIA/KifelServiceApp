// src/lib/firestore.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp,
  QueryConstraint,
  Firestore,
  arrayUnion
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { User, Shift, VacationRequest, ChatMessage, ChatRoom, Company, Invite, AdminNotification } from '../types';
import { logError } from '../utils/errorHandler';

// Helper to get db instance safely
const getDb = (): Firestore => {
  if (!db) throw new Error('Firestore not initialized');
  return db;
};

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  SHIFTS: 'shifts',
  TIME_ENTRIES: 'timeEntries',
  VACATION_REQUESTS: 'vacationRequests',
  CHAT_ROOMS: 'chatRooms',
  CHAT_MESSAGES: 'chatMessages',
  LOCATIONS: 'locations',
  COMPANY: 'company',
  INVITES: 'invites',
  ADMIN_NOTIFICATIONS: 'adminNotifications',
} as const;

// Helper: Convert Firestore timestamp to ISO string
const toISOString = (timestamp: Timestamp | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  return timestamp.toDate().toISOString();
};

/**
 * Wrapper für sichere Firestore-Operationen mit Error-Handling
 */
async function safeFirestoreOp<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  if (!isFirebaseConfigured()) {
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    logError(error, `Firestore:${context}`);
    throw error; // Re-throw für den Aufrufer
  }
}

/**
 * Wrapper für Firestore-Operationen die bei Fehler den Fallback zurückgeben
 * (statt zu werfen)
 */
async function safeFirestoreOpSilent<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  if (!isFirebaseConfigured()) {
    return fallback;
  }

  try {
    return await operation();
  } catch (error) {
    logError(error, `Firestore:${context}`);
    return fallback;
  }
}

// ============================================================================
// USERS / PROFILES
// ============================================================================

export const usersCollection = {
  // Get user by ID
  get: async (userId: string): Promise<User | null> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.USERS, userId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: toISOString(data.createdAt),
          updatedAt: toISOString(data.updatedAt),
        } as User;
      },
      null,
      'users.get'
    );
  },

  // Create user profile
  create: async (userId: string, userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.USERS, userId);
        await setDoc(docRef, {
          ...userData,
          status: userData.status || 'active', // Default status to 'active'
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      },
      undefined,
      'users.create'
    );
  },

  // Update user profile
  update: async (userId: string, updates: Partial<User>): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.USERS, userId);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      },
      undefined,
      'users.update'
    );
  },

  // Get all users (admin only)
  getAll: async (): Promise<User[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(collection(getDb(), COLLECTIONS.USERS), orderBy('lastName'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: toISOString(data.createdAt),
            updatedAt: toISOString(data.updatedAt),
          } as User;
        });
      },
      [],
      'users.getAll'
    );
  },

  // Get employees only
  getEmployees: async (): Promise<User[]> => {
    return safeFirestoreOp(
      async () => {
        // Only filter by role, sort client-side to avoid composite index requirement
        const q = query(
          collection(getDb(), COLLECTIONS.USERS),
          where('role', '==', 'employee')
        );
        const snapshot = await getDocs(q);

        const users = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: toISOString(data.createdAt),
            updatedAt: toISOString(data.updatedAt),
          } as User;
        });

        // Sort client-side by lastName
        return users.sort((a, b) => (a.lastName || '').localeCompare(b.lastName || ''));
      },
      [],
      'users.getEmployees'
    );
  },

  // Delete user
  delete: async (userId: string): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.USERS, userId);
        await deleteDoc(docRef);
      },
      undefined,
      'users.delete'
    );
  },
};

// ============================================================================
// SHIFTS
// ============================================================================

export interface FirestoreShift extends Omit<Shift, 'id'> {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export const shiftsCollection = {
  // Get shifts for a user
  getForUser: async (userId: string, startDate?: string, endDate?: string): Promise<Shift[]> => {
    return safeFirestoreOp(
      async () => {
        const constraints: QueryConstraint[] = [
          where('userId', '==', userId),
          orderBy('date', 'asc')
        ];

        const q = query(collection(getDb(), COLLECTIONS.SHIFTS), ...constraints);
        const snapshot = await getDocs(q);

        let shifts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Shift));

        // Filter by date range client-side (Firestore limitation with multiple range queries)
        if (startDate) {
          shifts = shifts.filter(s => s.date >= startDate);
        }
        if (endDate) {
          shifts = shifts.filter(s => s.date <= endDate);
        }

        return shifts;
      },
      [],
      'shifts.getForUser'
    );
  },

  // Get all shifts (admin)
  getAll: async (startDate?: string, endDate?: string): Promise<Shift[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(collection(getDb(), COLLECTIONS.SHIFTS), orderBy('date', 'asc'));
        const snapshot = await getDocs(q);

        let shifts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as Shift));

        if (startDate) {
          shifts = shifts.filter(s => s.date >= startDate);
        }
        if (endDate) {
          shifts = shifts.filter(s => s.date <= endDate);
        }

        return shifts;
      },
      [],
      'shifts.getAll'
    );
  },

  // Create shift
  create: async (shift: Omit<Shift, 'id'>): Promise<string> => {
    return safeFirestoreOp(
      async () => {
        const docRef = await addDoc(collection(getDb(), COLLECTIONS.SHIFTS), {
          ...shift,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return docRef.id;
      },
      '',
      'shifts.create'
    );
  },

  // Update shift
  update: async (shiftId: string, updates: Partial<Shift>): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.SHIFTS, shiftId);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      },
      undefined,
      'shifts.update'
    );
  },

  // Delete shift
  delete: async (shiftId: string): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.SHIFTS, shiftId);
        await deleteDoc(docRef);
      },
      undefined,
      'shifts.delete'
    );
  },
};

// ============================================================================
// TIME ENTRIES
// ============================================================================

export interface TimeEntry {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  breakMinutes: number;
  clockInLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  clockOutLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  locationHistory?: Array<{
    latitude: number;
    longitude: number;
    accuracy?: number | null;
    timestamp: number;
    address?: string | null;
  }>;
  notes?: string;
}

export const timeEntriesCollection = {
  // Get entries for user
  getForUser: async (userId: string, limitCount = 50): Promise<TimeEntry[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.TIME_ENTRIES),
          where('userId', '==', userId),
          orderBy('clockIn', 'desc'),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            clockIn: toISOString(data.clockIn),
            clockOut: data.clockOut ? toISOString(data.clockOut) : null,
            breakMinutes: data.breakMinutes || 0,
            clockInLocation: data.clockInLocation,
            clockOutLocation: data.clockOutLocation,
            notes: data.notes,
          } as TimeEntry;
        });
      },
      [],
      'timeEntries.getForUser'
    );
  },

  // Get current active entry (not clocked out)
  getCurrent: async (userId: string): Promise<TimeEntry | null> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.TIME_ENTRIES),
          where('userId', '==', userId),
          where('clockOut', '==', null),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docData = snapshot.docs[0];
        const data = docData.data();
        return {
          id: docData.id,
          userId: data.userId,
          clockIn: toISOString(data.clockIn),
          clockOut: null,
          breakMinutes: data.breakMinutes || 0,
          clockInLocation: data.clockInLocation,
          notes: data.notes,
        };
      },
      null,
      'timeEntries.getCurrent'
    );
  },

  // Clock in
  clockIn: async (userId: string, location?: { latitude: number; longitude: number; address?: string }): Promise<string> => {
    return safeFirestoreOp(
      async () => {
        const docRef = await addDoc(collection(getDb(), COLLECTIONS.TIME_ENTRIES), {
          userId,
          clockIn: Timestamp.now(),
          clockOut: null,
          breakMinutes: 0,
          clockInLocation: location || null,
        });
        return docRef.id;
      },
      '',
      'timeEntries.clockIn'
    );
  },

  // Clock out
  clockOut: async (entryId: string, location?: { latitude: number; longitude: number; address?: string }): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.TIME_ENTRIES, entryId);
        await updateDoc(docRef, {
          clockOut: Timestamp.now(),
          clockOutLocation: location || null,
        });
      },
      undefined,
      'timeEntries.clockOut'
    );
  },

  // Update break time
  updateBreak: async (entryId: string, breakMinutes: number): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.TIME_ENTRIES, entryId);
        await updateDoc(docRef, { breakMinutes });
      },
      undefined,
      'timeEntries.updateBreak'
    );
  },

  // Get entries for user within date range
  getForUserInRange: async (userId: string, startDate: string, endDate: string): Promise<TimeEntry[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.TIME_ENTRIES),
          where('userId', '==', userId),
          orderBy('clockIn', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              clockIn: toISOString(data.clockIn),
              clockOut: data.clockOut ? toISOString(data.clockOut) : null,
              breakMinutes: data.breakMinutes || 0,
              clockInLocation: data.clockInLocation,
              clockOutLocation: data.clockOutLocation,
              notes: data.notes,
            } as TimeEntry;
          })
          .filter(entry => {
            const entryDate = entry.clockIn.split('T')[0];
            return entryDate >= startDate && entryDate <= endDate;
          });
      },
      [],
      'timeEntries.getForUserInRange'
    );
  },

  // Get all entries (admin) within date range
  getAllInRange: async (startDate: string, endDate: string): Promise<TimeEntry[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.TIME_ENTRIES),
          orderBy('clockIn', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              clockIn: toISOString(data.clockIn),
              clockOut: data.clockOut ? toISOString(data.clockOut) : null,
              breakMinutes: data.breakMinutes || 0,
              clockInLocation: data.clockInLocation,
              clockOutLocation: data.clockOutLocation,
              notes: data.notes,
            } as TimeEntry;
          })
          .filter(entry => {
            const entryDate = entry.clockIn.split('T')[0];
            return entryDate >= startDate && entryDate <= endDate;
          });
      },
      [],
      'timeEntries.getAllInRange'
    );
  },

  // Update location history - fuegt einzelne Location hinzu
  updateLocationHistory: async (
    entryId: string,
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      timestamp: number;
      address?: string;
    }
  ): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.TIME_ENTRIES, entryId);
        await updateDoc(docRef, {
          locationHistory: arrayUnion({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy ?? null,
            timestamp: location.timestamp,
            address: location.address ?? null,
          }),
        });
      },
      undefined,
      'timeEntries.updateLocationHistory'
    );
  },

  // Batch-Update fuer mehrere Locations auf einmal
  batchUpdateLocationHistory: async (
    entryId: string,
    locations: Array<{
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      timestamp: number;
      address?: string;
    }>
  ): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.TIME_ENTRIES, entryId);
        const formattedLocations = locations.map((loc) => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy ?? null,
          timestamp: loc.timestamp,
          address: loc.address ?? null,
        }));
        await updateDoc(docRef, {
          locationHistory: arrayUnion(...formattedLocations),
        });
      },
      undefined,
      'timeEntries.batchUpdateLocationHistory'
    );
  },
};

// ============================================================================
// VACATION REQUESTS
// ============================================================================

export const vacationRequestsCollection = {
  // Get requests for user
  getForUser: async (userId: string): Promise<VacationRequest[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.VACATION_REQUESTS),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: toISOString(data.createdAt),
            reviewedAt: data.reviewedAt ? toISOString(data.reviewedAt) : undefined,
          } as VacationRequest;
        });
      },
      [],
      'vacationRequests.getForUser'
    );
  },

  // Get all requests (admin)
  getAll: async (status?: 'pending' | 'approved' | 'rejected'): Promise<VacationRequest[]> => {
    return safeFirestoreOp(
      async () => {
        // Only filter by status if provided, sort client-side to avoid composite index
        let q;
        if (status) {
          q = query(
            collection(getDb(), COLLECTIONS.VACATION_REQUESTS),
            where('status', '==', status)
          );
        } else {
          q = query(collection(getDb(), COLLECTIONS.VACATION_REQUESTS));
        }

        const snapshot = await getDocs(q);

        const requests = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: toISOString(data.createdAt),
            reviewedAt: data.reviewedAt ? toISOString(data.reviewedAt) : undefined,
          } as VacationRequest;
        });

        // Sort client-side by createdAt descending
        return requests.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },
      [],
      'vacationRequests.getAll'
    );
  },

  // Create request
  create: async (request: Omit<VacationRequest, 'id' | 'createdAt' | 'status'>): Promise<string> => {
    return safeFirestoreOp(
      async () => {
        const docRef = await addDoc(collection(getDb(), COLLECTIONS.VACATION_REQUESTS), {
          ...request,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
        return docRef.id;
      },
      '',
      'vacationRequests.create'
    );
  },

  // Update status (admin)
  updateStatus: async (
    requestId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string
  ): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.VACATION_REQUESTS, requestId);
        await updateDoc(docRef, {
          status,
          reviewedBy,
          reviewedAt: serverTimestamp(),
        });
      },
      undefined,
      'vacationRequests.updateStatus'
    );
  },

  // Delete request
  delete: async (requestId: string): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.VACATION_REQUESTS, requestId);
        await deleteDoc(docRef);
      },
      undefined,
      'vacationRequests.delete'
    );
  },
};

// ============================================================================
// CHAT
// ============================================================================

export const chatCollection = {
  // Get team chat room (or create if not exists)
  getTeamRoom: async (): Promise<ChatRoom | null> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.CHAT_ROOMS),
          where('type', '==', 'team'),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          // Create team room
          const docRef = await addDoc(collection(getDb(), COLLECTIONS.CHAT_ROOMS), {
            name: 'Team Chat',
            type: 'team',
            members: [],
            createdAt: serverTimestamp(),
          });
          return {
            id: docRef.id,
            name: 'Team Chat',
            type: 'team',
            members: [],
            createdAt: new Date().toISOString(),
          };
        }

        const docData = snapshot.docs[0];
        const data = docData.data();
        return {
          id: docData.id,
          name: data.name,
          type: data.type,
          members: data.members || [],
          createdAt: toISOString(data.createdAt),
        };
      },
      null,
      'chat.getTeamRoom'
    );
  },

  // Get messages for room
  getMessages: async (roomId: string, limitCount = 50): Promise<ChatMessage[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.CHAT_MESSAGES),
          where('chatId', '==', roomId),
          orderBy('timestamp', 'desc'),
          limit(limitCount)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            chatId: data.chatId,
            userId: data.userId,
            userName: data.userName,
            content: data.content,
            timestamp: data.timestamp?.toMillis() || Date.now(),
            readBy: data.readBy || [],
            isDeleted: data.isDeleted || false,
          } as ChatMessage;
        }).reverse(); // Reverse to get oldest first
      },
      [],
      'chat.getMessages'
    );
  },

  // Send message
  sendMessage: async (roomId: string, userId: string, userName: string, content: string): Promise<string> => {
    return safeFirestoreOp(
      async () => {
        const docRef = await addDoc(collection(getDb(), COLLECTIONS.CHAT_MESSAGES), {
          chatId: roomId,
          userId,
          userName,
          content,
          timestamp: Timestamp.now(),
          readBy: [userId],
          isDeleted: false,
        });
        return docRef.id;
      },
      '',
      'chat.sendMessage'
    );
  },

  // Subscribe to messages (realtime)
  subscribeToMessages: (roomId: string, callback: (messages: ChatMessage[]) => void, onError?: (error: Error) => void) => {
    if (!isFirebaseConfigured()) {
      callback([]);
      return () => {};
    }

    try {
      const q = query(
        collection(getDb(), COLLECTIONS.CHAT_MESSAGES),
        where('chatId', '==', roomId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const messages = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              chatId: data.chatId,
              userId: data.userId,
              userName: data.userName,
              content: data.content,
              timestamp: data.timestamp?.toMillis() || Date.now(),
              readBy: data.readBy || [],
              isDeleted: data.isDeleted || false,
            } as ChatMessage;
          }).reverse();

          callback(messages);
        },
        (error) => {
          logError(error, 'chat.subscribeToMessages');
          if (onError) {
            onError(error);
          }
        }
      );
    } catch (error) {
      logError(error, 'chat.subscribeToMessages.setup');
      return () => {};
    }
  },

  // Delete message (soft delete)
  deleteMessage: async (messageId: string): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.CHAT_MESSAGES, messageId);
        await updateDoc(docRef, { isDeleted: true });
      },
      undefined,
      'chat.deleteMessage'
    );
  },
};

// ============================================================================
// STATS
// ============================================================================

export const statsCollection = {
  // Get user stats
  getUserStats: async (userId: string) => {
    const defaultStats = {
      hoursThisMonth: 0,
      hoursThisWeek: 0,
      remainingVacationDays: 30,
      usedVacationDays: 0,
    };

    return safeFirestoreOpSilent(
      async () => {
        // Get time entries for this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());

        const entries = await timeEntriesCollection.getForUser(userId, 100);

        let hoursThisMonth = 0;
        let hoursThisWeek = 0;

        entries.forEach(entry => {
          if (!entry.clockOut) return;

          const clockIn = new Date(entry.clockIn);
          const clockOut = new Date(entry.clockOut);
          const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60) - (entry.breakMinutes / 60);

          if (clockIn >= startOfMonth) {
            hoursThisMonth += hours;
          }
          if (clockIn >= startOfWeek) {
            hoursThisWeek += hours;
          }
        });

        // Get user for vacation days
        const user = await usersCollection.get(userId);

        return {
          hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
          hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
          remainingVacationDays: 30 - (user?.vacationDaysUsed || 0),
          usedVacationDays: user?.vacationDaysUsed || 0,
        };
      },
      defaultStats,
      'stats.getUserStats'
    );
  },

  // Get admin stats
  getAdminStats: async () => {
    const defaultStats = {
      totalEmployees: 0,
      activeToday: 0,
      onVacation: 0,
      sick: 0,
      pendingRequests: 0,
    };

    return safeFirestoreOpSilent(
      async () => {
        const [employees, pendingRequests, allRequests] = await Promise.all([
          usersCollection.getEmployees(),
          vacationRequestsCollection.getAll('pending'),
          vacationRequestsCollection.getAll('approved'),
        ]);

        const today = new Date().toISOString().split('T')[0];

        // Count active employees (those with open time entries today)
        // This is simplified - in production you'd query time entries
        const activeToday = 0; // Would need to query time entries

        // Count on vacation/sick today
        let onVacation = 0;
        let sick = 0;

        allRequests.forEach(req => {
          if (req.startDate <= today && req.endDate >= today) {
            if (req.type === 'vacation') onVacation++;
            if (req.type === 'sick') sick++;
          }
        });

        return {
          totalEmployees: employees.length,
          activeToday,
          onVacation,
          sick,
          pendingRequests: pendingRequests.length,
        };
      },
      defaultStats,
      'stats.getAdminStats'
    );
  },
};

// ============================================================================
// COMPANY
// ============================================================================

export const companyCollection = {
  // Get company (singleton - only one company per app instance)
  get: async (): Promise<Company | null> => {
    return safeFirestoreOpSilent(
      async () => {
        const q = query(collection(getDb(), COLLECTIONS.COMPANY), limit(1));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docData = snapshot.docs[0];
        const data = docData.data();
        return {
          id: docData.id,
          ...data,
          createdAt: toISOString(data.createdAt),
          updatedAt: toISOString(data.updatedAt),
        } as Company;
      },
      null,
      'company.get'
    );
  },

  // Create or update company
  save: async (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    return safeFirestoreOp(
      async () => {
        // Check if company already exists
        const existing = await companyCollection.get();

        if (existing) {
          // Update existing
          const docRef = doc(getDb(), COLLECTIONS.COMPANY, existing.id);
          await updateDoc(docRef, {
            ...companyData,
            updatedAt: serverTimestamp(),
          });
          return existing.id;
        } else {
          // Create new
          const docRef = await addDoc(collection(getDb(), COLLECTIONS.COMPANY), {
            ...companyData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          return docRef.id;
        }
      },
      '',
      'company.save'
    );
  },

  // Update company
  update: async (companyId: string, updates: Partial<Company>): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.COMPANY, companyId);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      },
      undefined,
      'company.update'
    );
  },
};

// ============================================================================
// INVITES (Einladungs-System)
// ============================================================================

// Generate a random token
const generateInviteToken = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

export const invitesCollection = {
  // Create a new invite
  create: async (inviteData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    location?: string;
    role: 'employee' | 'admin';
    createdBy: string;
  }): Promise<Invite> => {
    return safeFirestoreOp(
      async () => {
        const token = generateInviteToken();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 Tage gültig

        const docRef = await addDoc(collection(getDb(), COLLECTIONS.INVITES), {
          ...inviteData,
          token,
          status: 'pending',
          createdAt: serverTimestamp(),
          expiresAt: Timestamp.fromDate(expiresAt),
        });

        return {
          id: docRef.id,
          ...inviteData,
          token,
          status: 'pending' as const,
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        };
      },
      null as any,
      'invites.create'
    );
  },

  // Get invite by token
  getByToken: async (token: string): Promise<Invite | null> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.INVITES),
          where('token', '==', token),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return null;

        const docData = snapshot.docs[0];
        const data = docData.data();

        const invite: Invite = {
          id: docData.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          location: data.location,
          role: data.role,
          token: data.token,
          createdBy: data.createdBy,
          createdAt: toISOString(data.createdAt),
          expiresAt: toISOString(data.expiresAt),
          acceptedAt: data.acceptedAt ? toISOString(data.acceptedAt) : undefined,
          status: data.status,
        };

        // Check if expired
        if (new Date(invite.expiresAt) < new Date() && invite.status === 'pending') {
          // Update status to expired
          await updateDoc(doc(getDb(), COLLECTIONS.INVITES, docData.id), {
            status: 'expired',
          });
          invite.status = 'expired';
        }

        return invite;
      },
      null,
      'invites.getByToken'
    );
  },

  // Get all pending invites (admin)
  getPending: async (): Promise<Invite[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.INVITES),
          where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            location: data.location,
            role: data.role,
            token: data.token,
            createdBy: data.createdBy,
            createdAt: toISOString(data.createdAt),
            expiresAt: toISOString(data.expiresAt),
            status: data.status,
          } as Invite;
        });
      },
      [],
      'invites.getPending'
    );
  },

  // Accept invite and create user
  accept: async (token: string, userId: string): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        // Find the invite
        const q = query(
          collection(getDb(), COLLECTIONS.INVITES),
          where('token', '==', token),
          limit(1)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          throw new Error('Einladung nicht gefunden');
        }

        const inviteDoc = snapshot.docs[0];
        const inviteData = inviteDoc.data();

        // Check if already accepted
        if (inviteData.status === 'accepted') {
          throw new Error('Einladung wurde bereits verwendet');
        }

        // Check if expired
        const expiresAt = inviteData.expiresAt?.toDate() || new Date();
        if (expiresAt < new Date()) {
          throw new Error('Einladung ist abgelaufen');
        }

        // Update invite status
        await updateDoc(doc(getDb(), COLLECTIONS.INVITES, inviteDoc.id), {
          status: 'accepted',
          acceptedAt: serverTimestamp(),
        });

        // Create user profile
        await usersCollection.create(userId, {
          email: inviteData.email,
          firstName: inviteData.firstName,
          lastName: inviteData.lastName,
          phone: inviteData.phone || undefined,
          location: inviteData.location || undefined,
          role: inviteData.role,
          status: 'active',
        });
      },
      undefined,
      'invites.accept'
    );
  },

  // Delete/revoke invite
  delete: async (inviteId: string): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.INVITES, inviteId);
        await deleteDoc(docRef);
      },
      undefined,
      'invites.delete'
    );
  },

  // Resend invite (generate new token)
  resend: async (inviteId: string): Promise<Invite> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.INVITES, inviteId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          throw new Error('Einladung nicht gefunden');
        }

        const data = docSnap.data();
        const newToken = generateInviteToken();
        const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await updateDoc(docRef, {
          token: newToken,
          status: 'pending',
          expiresAt: Timestamp.fromDate(newExpiresAt),
        });

        return {
          id: docSnap.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          location: data.location,
          role: data.role,
          token: newToken,
          createdBy: data.createdBy,
          createdAt: toISOString(data.createdAt),
          expiresAt: newExpiresAt.toISOString(),
          status: 'pending' as const,
        };
      },
      null as any,
      'invites.resend'
    );
  },
};

// ============================================================================
// ADMIN NOTIFICATIONS (Benachrichtigungen für Admin)
// ============================================================================

export const adminNotificationsCollection = {
  // Create a new notification (z.B. bei Profil-Änderung)
  create: async (notification: {
    type: AdminNotification['type'];
    userId: string;
    userName: string;
    title: string;
    message: string;
    changes?: Record<string, { old: string; new: string }>;
  }): Promise<AdminNotification> => {
    return safeFirestoreOp(
      async () => {
        const docRef = await addDoc(collection(getDb(), COLLECTIONS.ADMIN_NOTIFICATIONS), {
          ...notification,
          readBy: [],
          createdAt: serverTimestamp(),
        });

        return {
          id: docRef.id,
          ...notification,
          readBy: [],
          createdAt: new Date().toISOString(),
        };
      },
      null as any,
      'adminNotifications.create'
    );
  },

  // Get all unread notifications (for admin)
  getUnread: async (adminId: string): Promise<AdminNotification[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.ADMIN_NOTIFICATIONS),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              type: data.type,
              userId: data.userId,
              userName: data.userName,
              title: data.title,
              message: data.message,
              changes: data.changes,
              createdAt: toISOString(data.createdAt),
              readBy: data.readBy || [],
              isRead: (data.readBy || []).includes(adminId),
            } as AdminNotification;
          })
          .filter(n => !n.isRead);
      },
      [],
      'adminNotifications.getUnread'
    );
  },

  // Get all notifications (for admin dashboard)
  getAll: async (adminId: string, maxResults = 20): Promise<AdminNotification[]> => {
    return safeFirestoreOp(
      async () => {
        const q = query(
          collection(getDb(), COLLECTIONS.ADMIN_NOTIFICATIONS),
          orderBy('createdAt', 'desc'),
          limit(maxResults)
        );
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            type: data.type,
            userId: data.userId,
            userName: data.userName,
            title: data.title,
            message: data.message,
            changes: data.changes,
            createdAt: toISOString(data.createdAt),
            readBy: data.readBy || [],
            isRead: (data.readBy || []).includes(adminId),
          } as AdminNotification;
        });
      },
      [],
      'adminNotifications.getAll'
    );
  },

  // Mark notification as read
  markAsRead: async (notificationId: string, adminId: string): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const docRef = doc(getDb(), COLLECTIONS.ADMIN_NOTIFICATIONS, notificationId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const readBy = data.readBy || [];
          if (!readBy.includes(adminId)) {
            await updateDoc(docRef, {
              readBy: [...readBy, adminId],
            });
          }
        }
      },
      undefined,
      'adminNotifications.markAsRead'
    );
  },

  // Mark all as read
  markAllAsRead: async (adminId: string): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const unread = await adminNotificationsCollection.getUnread(adminId);
        await Promise.all(
          unread.map(n => adminNotificationsCollection.markAsRead(n.id, adminId))
        );
      },
      undefined,
      'adminNotifications.markAllAsRead'
    );
  },

  // Delete old notifications (cleanup)
  deleteOld: async (daysOld = 30): Promise<void> => {
    return safeFirestoreOp(
      async () => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - daysOld);

        const q = query(
          collection(getDb(), COLLECTIONS.ADMIN_NOTIFICATIONS),
          where('createdAt', '<', Timestamp.fromDate(cutoff))
        );
        const snapshot = await getDocs(q);

        await Promise.all(
          snapshot.docs.map(doc => deleteDoc(doc.ref))
        );
      },
      undefined,
      'adminNotifications.deleteOld'
    );
  },
};

// Export all collections
export const firestoreDb = {
  users: usersCollection,
  shifts: shiftsCollection,
  timeEntries: timeEntriesCollection,
  vacationRequests: vacationRequestsCollection,
  chat: chatCollection,
  stats: statsCollection,
  company: companyCollection,
  invites: invitesCollection,
  adminNotifications: adminNotificationsCollection,
};

export default firestoreDb;
