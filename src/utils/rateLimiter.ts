// src/utils/rateLimiter.ts

/**
 * Rate Limiter für Login-Versuche
 * Schützt vor Brute-Force-Angriffen
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@rate_limiter';
const MAX_ATTEMPTS = 5; // Max Versuche
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 Minuten Sperre
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 Minuten Zeitfenster

interface RateLimitData {
  attempts: number;
  firstAttemptTime: number;
  lockedUntil: number | null;
}

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntil: Date | null;
  message?: string;
}

class RateLimiter {
  private data: Map<string, RateLimitData> = new Map();
  private loaded = false;

  // Lade gespeicherte Daten
  private async load(): Promise<void> {
    if (this.loaded) return;

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.error('RateLimiter load error:', error);
    }

    this.loaded = true;
  }

  // Speichere Daten
  private async save(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.data);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('RateLimiter save error:', error);
    }
  }

  // Bereinige alte Einträge
  private cleanup(key: string): void {
    const entry = this.data.get(key);
    if (!entry) return;

    const now = Date.now();

    // Wenn Sperre abgelaufen ist, zurücksetzen
    if (entry.lockedUntil && now > entry.lockedUntil) {
      this.data.delete(key);
      return;
    }

    // Wenn Zeitfenster abgelaufen ist, zurücksetzen
    if (now - entry.firstAttemptTime > ATTEMPT_WINDOW) {
      this.data.delete(key);
    }
  }

  // Prüfe ob Zugriff erlaubt ist
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    await this.load();
    this.cleanup(identifier);

    const entry = this.data.get(identifier);
    const now = Date.now();

    // Wenn gesperrt
    if (entry?.lockedUntil && now < entry.lockedUntil) {
      const remainingMs = entry.lockedUntil - now;
      const remainingMin = Math.ceil(remainingMs / 60000);

      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: new Date(entry.lockedUntil),
        message: `Zu viele Versuche. Bitte warten Sie ${remainingMin} Minute${remainingMin !== 1 ? 'n' : ''}.`,
      };
    }

    const remainingAttempts = entry ? MAX_ATTEMPTS - entry.attempts : MAX_ATTEMPTS;

    return {
      allowed: true,
      remainingAttempts,
      lockedUntil: null,
    };
  }

  // Registriere einen fehlgeschlagenen Versuch
  async recordFailedAttempt(identifier: string): Promise<RateLimitResult> {
    await this.load();
    this.cleanup(identifier);

    const now = Date.now();
    let entry = this.data.get(identifier);

    if (!entry) {
      entry = {
        attempts: 0,
        firstAttemptTime: now,
        lockedUntil: null,
      };
    }

    entry.attempts += 1;

    // Wenn Max erreicht, sperren
    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + LOCKOUT_DURATION;
      this.data.set(identifier, entry);
      await this.save();

      const remainingMin = Math.ceil(LOCKOUT_DURATION / 60000);

      return {
        allowed: false,
        remainingAttempts: 0,
        lockedUntil: new Date(entry.lockedUntil),
        message: `Zu viele fehlgeschlagene Versuche. Konto für ${remainingMin} Minuten gesperrt.`,
      };
    }

    this.data.set(identifier, entry);
    await this.save();

    const remainingAttempts = MAX_ATTEMPTS - entry.attempts;

    return {
      allowed: true,
      remainingAttempts,
      lockedUntil: null,
      message: remainingAttempts <= 2
        ? `Noch ${remainingAttempts} Versuch${remainingAttempts !== 1 ? 'e' : ''} übrig`
        : undefined,
    };
  }

  // Erfolgreicher Login - zurücksetzen
  async recordSuccess(identifier: string): Promise<void> {
    await this.load();
    this.data.delete(identifier);
    await this.save();
  }

  // Manuelles Zurücksetzen (z.B. für Admin)
  async reset(identifier: string): Promise<void> {
    await this.load();
    this.data.delete(identifier);
    await this.save();
  }

  // Alle Sperren zurücksetzen
  async resetAll(): Promise<void> {
    this.data.clear();
    await AsyncStorage.removeItem(STORAGE_KEY);
  }
}

// Singleton Export
export const loginRateLimiter = new RateLimiter();

// Convenience Funktionen
export const checkLoginAllowed = (email: string) => loginRateLimiter.checkLimit(email.toLowerCase());
export const recordFailedLogin = (email: string) => loginRateLimiter.recordFailedAttempt(email.toLowerCase());
export const recordSuccessfulLogin = (email: string) => loginRateLimiter.recordSuccess(email.toLowerCase());
