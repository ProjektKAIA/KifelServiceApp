/**
 * Toast-Service für nicht-blockierende Benachrichtigungen
 *
 * Verwendet react-native-toast-message für benutzerfreundliche
 * Feedback-Meldungen ohne die UI zu blockieren.
 */

import Toast, { ToastShowParams } from 'react-native-toast-message';
import { getErrorMessage } from './errorHandler';

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  duration?: number;
  onPress?: () => void;
  onHide?: () => void;
}

const DEFAULT_DURATION = 3000;
const ERROR_DURATION = 4000;

/**
 * Zeigt eine Erfolgs-Nachricht an
 */
export function showSuccess(
  message: string,
  title: string = 'Erfolg',
  options: ToastOptions = {}
): void {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    visibilityTime: options.duration ?? DEFAULT_DURATION,
    onPress: options.onPress,
    onHide: options.onHide,
  });
}

/**
 * Zeigt eine Fehler-Nachricht an
 */
export function showError(
  error: unknown,
  title: string = 'Fehler',
  options: ToastOptions = {}
): void {
  const message = typeof error === 'string' ? error : getErrorMessage(error);

  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    visibilityTime: options.duration ?? ERROR_DURATION,
    onPress: options.onPress,
    onHide: options.onHide,
  });
}

/**
 * Zeigt eine Info-Nachricht an
 */
export function showInfo(
  message: string,
  title: string = 'Info',
  options: ToastOptions = {}
): void {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    visibilityTime: options.duration ?? DEFAULT_DURATION,
    onPress: options.onPress,
    onHide: options.onHide,
  });
}

/**
 * Zeigt eine Warnung an
 */
export function showWarning(
  message: string,
  title: string = 'Hinweis',
  options: ToastOptions = {}
): void {
  Toast.show({
    type: 'info', // Toast-message hat kein 'warning' type, nutze 'info'
    text1: title,
    text2: message,
    visibilityTime: options.duration ?? DEFAULT_DURATION,
    onPress: options.onPress,
    onHide: options.onHide,
  });
}

/**
 * Zeigt eine benutzerdefinierte Toast-Nachricht an
 */
export function showToast(params: ToastShowParams): void {
  Toast.show(params);
}

/**
 * Versteckt den aktuellen Toast
 */
export function hideToast(): void {
  Toast.hide();
}

/**
 * Kurzform-Funktionen für häufige Aktionen
 */
export const toast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  show: showToast,
  hide: hideToast,

  // Häufige Erfolgs-Meldungen
  saved: () => showSuccess('Änderungen wurden gespeichert'),
  created: (item: string = 'Eintrag') => showSuccess(`${item} wurde erstellt`),
  deleted: (item: string = 'Eintrag') => showSuccess(`${item} wurde gelöscht`),
  updated: (item: string = 'Eintrag') => showSuccess(`${item} wurde aktualisiert`),
  sent: () => showSuccess('Erfolgreich gesendet'),
  copied: () => showSuccess('In die Zwischenablage kopiert'),

  // Häufige Fehler-Meldungen
  networkError: () => showError('Netzwerkfehler. Bitte überprüfe deine Internetverbindung.'),
  loadError: (item: string = 'Daten') => showError(`${item} konnten nicht geladen werden`),
  saveError: () => showError('Speichern fehlgeschlagen'),
  deleteError: () => showError('Löschen fehlgeschlagen'),
  unauthorized: () => showError('Keine Berechtigung für diese Aktion'),
  sessionExpired: () => showError('Sitzung abgelaufen. Bitte erneut anmelden.'),
};

export default toast;
