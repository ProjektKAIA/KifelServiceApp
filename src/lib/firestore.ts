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
  Firestore
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import { User, Shift, VacationRequest, ChatMessage, ChatRoom } from '../types';
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

// Export all collections
export const firestoreDb = {
  users: usersCollection,
  shifts: shiftsCollection,
  timeEntries: timeEntriesCollection,
  vacationRequests: vacationRequestsCollection,
  chat: chatCollection,
  stats: statsCollection,
};

export default firestoreDb;
