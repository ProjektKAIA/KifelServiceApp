/**
 * Zentrales Error-Handling für die Kifel Service App
 *
 * Bietet einheitliche Fehlerbehandlung, deutsche Fehlermeldungen
 * und konsistente Error-Transforms für Firebase und andere Services.
 */

import { Alert } from 'react-native';

// Firebase Auth Error Codes -> Deutsche Meldungen
const FIREBASE_AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'Ungültige Anmeldedaten. Bitte überprüfe E-Mail und Passwort.',
  'auth/invalid-email': 'Ungültige E-Mail-Adresse.',
  'auth/user-disabled': 'Dieses Konto wurde deaktiviert.',
  'auth/user-not-found': 'Kein Benutzer mit dieser E-Mail-Adresse gefunden.',
  'auth/wrong-password': 'Falsches Passwort.',
  'auth/email-already-in-use': 'Diese E-Mail-Adresse wird bereits verwendet.',
  'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
  'auth/too-many-requests': 'Zu viele fehlgeschlagene Versuche. Bitte warte einen Moment.',
  'auth/network-request-failed': 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.',
  'auth/operation-not-allowed': 'Diese Anmeldung ist nicht erlaubt.',
  'auth/requires-recent-login': 'Bitte melde dich erneut an, um fortzufahren.',
  'auth/popup-closed-by-user': 'Anmeldung wurde abgebrochen.',
};

// Firebase Firestore Error Codes -> Deutsche Meldungen
const FIREBASE_FIRESTORE_ERRORS: Record<string, string> = {
  'permission-denied': 'Keine Berechtigung für diese Aktion.',
  'not-found': 'Daten nicht gefunden.',
  'already-exists': 'Dieser Eintrag existiert bereits.',
  'resource-exhausted': 'Zu viele Anfragen. Bitte warte einen Moment.',
  'failed-precondition': 'Aktion kann nicht ausgeführt werden.',
  'aborted': 'Vorgang wurde abgebrochen.',
  'out-of-range': 'Ungültiger Wert.',
  'unimplemented': 'Diese Funktion ist nicht verfügbar.',
  'internal': 'Interner Serverfehler. Bitte versuche es später erneut.',
  'unavailable': 'Service nicht verfügbar. Bitte überprüfe deine Internetverbindung.',
  'data-loss': 'Datenverlust. Bitte kontaktiere den Support.',
  'unauthenticated': 'Nicht angemeldet. Bitte melde dich an.',
  'cancelled': 'Vorgang wurde abgebrochen.',
  'unknown': 'Ein unbekannter Fehler ist aufgetreten.',
  'invalid-argument': 'Ungültige Eingabe.',
  'deadline-exceeded': 'Zeitüberschreitung. Bitte versuche es erneut.',
};

// Allgemeine Netzwerk-Fehler
const NETWORK_ERRORS: Record<string, string> = {
  'Network request failed': 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.',
  'Failed to fetch': 'Verbindung fehlgeschlagen. Bitte überprüfe deine Internetverbindung.',
  'timeout': 'Zeitüberschreitung. Bitte versuche es erneut.',
  'ECONNREFUSED': 'Server nicht erreichbar.',
  'ENOTFOUND': 'Server nicht gefunden.',
};

// App-spezifische Fehler
const APP_ERRORS: Record<string, string> = {
  'firebase-not-configured': 'Firebase ist nicht konfiguriert.',
  'user-not-found': 'Benutzer nicht gefunden.',
  'shift-not-found': 'Schicht nicht gefunden.',
  'request-not-found': 'Antrag nicht gefunden.',
  'invalid-date-range': 'Ungültiger Zeitraum.',
  'insufficient-vacation-days': 'Nicht genügend Urlaubstage verfügbar.',
  'already-clocked-in': 'Du bist bereits eingestempelt.',
  'not-clocked-in': 'Du bist nicht eingestempelt.',
  'location-permission-denied': 'Standortzugriff wurde verweigert.',
  'location-unavailable': 'Standort konnte nicht ermittelt werden.',
};

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  originalError?: unknown;
}

/**
 * Extrahiert den Error-Code aus verschiedenen Error-Typen
 */
function extractErrorCode(error: unknown): string | undefined {
  if (!error) return undefined;

  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    // Firebase errors
    if (typeof err.code === 'string') return err.code;
    // Firestore errors (nested)
    if (err.cause && typeof err.cause === 'object') {
      const cause = err.cause as Record<string, unknown>;
      if (typeof cause.code === 'string') return cause.code;
    }
  }

  return undefined;
}

/**
 * Extrahiert die Error-Message aus verschiedenen Error-Typen
 */
function extractErrorMessage(error: unknown): string {
  if (!error) return 'Ein unbekannter Fehler ist aufgetreten.';

  if (typeof error === 'string') return error;

  if (error instanceof Error) return error.message;

  if (typeof error === 'object') {
    const err = error as Record<string, unknown>;
    if (typeof err.message === 'string') return err.message;
  }

  return 'Ein unbekannter Fehler ist aufgetreten.';
}

/**
 * Transformiert einen beliebigen Error in eine benutzerfreundliche deutsche Meldung
 */
export function getErrorMessage(error: unknown): string {
  const code = extractErrorCode(error);
  const originalMessage = extractErrorMessage(error);

  // Prüfe Firebase Auth Errors
  if (code && FIREBASE_AUTH_ERRORS[code]) {
    return FIREBASE_AUTH_ERRORS[code];
  }

  // Prüfe Firestore Errors (Code ohne Prefix)
  if (code) {
    const firestoreCode = code.replace('firestore/', '');
    if (FIREBASE_FIRESTORE_ERRORS[firestoreCode]) {
      return FIREBASE_FIRESTORE_ERRORS[firestoreCode];
    }
  }

  // Prüfe App-spezifische Errors
  if (code && APP_ERRORS[code]) {
    return APP_ERRORS[code];
  }

  // Prüfe Netzwerk-Errors anhand der Message
  for (const [key, message] of Object.entries(NETWORK_ERRORS)) {
    if (originalMessage.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }

  // Fallback: Original-Message, falls sie auf Deutsch ist oder kurz genug
  if (originalMessage.length < 100 && !originalMessage.includes('Firebase')) {
    return originalMessage;
  }

  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
}

/**
 * Erstellt ein strukturiertes AppError-Objekt
 */
export function createAppError(
  error: unknown,
  severity: ErrorSeverity = 'error'
): AppError {
  return {
    message: getErrorMessage(error),
    code: extractErrorCode(error),
    severity,
    originalError: error,
  };
}

/**
 * Zeigt einen Alert mit der Fehlermeldung an
 */
export function showErrorAlert(
  error: unknown,
  title: string = 'Fehler',
  onDismiss?: () => void
): void {
  const message = getErrorMessage(error);

  Alert.alert(
    title,
    message,
    [{ text: 'OK', onPress: onDismiss }],
    { cancelable: true }
  );
}

/**
 * Zeigt einen Erfolgs-Alert an
 */
export function showSuccessAlert(
  message: string,
  title: string = 'Erfolg',
  onDismiss?: () => void
): void {
  Alert.alert(
    title,
    message,
    [{ text: 'OK', onPress: onDismiss }],
    { cancelable: true }
  );
}

/**
 * Zeigt einen Bestätigungs-Dialog an
 */
export function showConfirmDialog(
  message: string,
  onConfirm: () => void,
  title: string = 'Bestätigung',
  confirmText: string = 'Ja',
  cancelText: string = 'Abbrechen'
): void {
  Alert.alert(
    title,
    message,
    [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, onPress: onConfirm, style: 'destructive' },
    ],
    { cancelable: true }
  );
}

/**
 * Loggt einen Fehler zur Konsole (nur in Development)
 */
export function logError(
  error: unknown,
  context?: string
): void {
  if (__DEV__) {
    const prefix = context ? `[${context}]` : '[Error]';
    console.error(prefix, error);
  }

  // Hier könnte später ein Error-Reporting-Service eingebunden werden
  // z.B. Sentry, Crashlytics, etc.
}

/**
 * Wrapper für async Funktionen mit automatischem Error-Handling
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    context?: string;
    showAlert?: boolean;
    alertTitle?: string;
    onError?: (error: AppError) => void;
    fallbackValue?: T;
  } = {}
): Promise<T | undefined> {
  const {
    context,
    showAlert = false,
    alertTitle = 'Fehler',
    onError,
    fallbackValue,
  } = options;

  try {
    return await fn();
  } catch (error) {
    logError(error, context);

    const appError = createAppError(error);

    if (showAlert) {
      showErrorAlert(error, alertTitle);
    }

    if (onError) {
      onError(appError);
    }

    return fallbackValue;
  }
}

/**
 * Validiert, ob ein Wert vorhanden ist, und wirft einen Fehler wenn nicht
 */
export function assertDefined<T>(
  value: T | null | undefined,
  errorMessage: string = 'Wert ist nicht definiert'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(errorMessage);
  }
}

/**
 * Prüft Netzwerk-Konnektivität (vereinfacht)
 */
export function isNetworkError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase();
  const code = extractErrorCode(error);

  return (
    code === 'auth/network-request-failed' ||
    code === 'unavailable' ||
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('internet')
  );
}

/**
 * Prüft, ob es sich um einen Auth-Fehler handelt
 */
export function isAuthError(error: unknown): boolean {
  const code = extractErrorCode(error);
  return code?.startsWith('auth/') || code === 'unauthenticated';
}

export default {
  getErrorMessage,
  createAppError,
  showErrorAlert,
  showSuccessAlert,
  showConfirmDialog,
  logError,
  withErrorHandling,
  assertDefined,
  isNetworkError,
  isAuthError,
};
