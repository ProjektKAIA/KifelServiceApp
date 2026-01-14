// src/utils/validation.ts

/**
 * Input Validation Utilities
 * Schützt vor XSS, ungültigen Eingaben und Injection-Versuchen
 */

// Email Validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Password Validation
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string, minLength = 6): PasswordValidation => {
  const errors: string[] = [];

  if (password.length < minLength) {
    errors.push(`Mindestens ${minLength} Zeichen erforderlich`);
  }

  if (!/[A-Za-z]/.test(password)) {
    errors.push('Mindestens ein Buchstabe erforderlich');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Mindestens eine Zahl erforderlich');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Sanitize Input - entfernt gefährliche Zeichen
export const sanitizeInput = (input: string): string => {
  if (!input) return '';

  return input
    .trim()
    // Entferne HTML Tags
    .replace(/<[^>]*>/g, '')
    // Entferne Script-Tags speziell
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Encode spezielle Zeichen
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// Sanitize für Anzeige (weniger strikt)
export const sanitizeForDisplay = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Name Validation
export const isValidName = (name: string): boolean => {
  if (!name || name.trim().length < 2) return false;
  // Erlaubt Buchstaben, Umlaute, Bindestriche, Apostrophe, Leerzeichen
  const nameRegex = /^[a-zA-ZäöüÄÖÜßéèêàáâùúûìíîòóô\s\-']+$/;
  return nameRegex.test(name.trim());
};

// Phone Validation
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field
  // Erlaubt +, Zahlen, Leerzeichen, Bindestriche, Klammern
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/;
  return phoneRegex.test(phone.trim()) && phone.replace(/\D/g, '').length >= 6;
};

// URL Validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Prüft auf verdächtige Injection-Patterns
export const containsSuspiciousPatterns = (input: string): boolean => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i, // onclick=, onerror=, etc.
    /data:/i,
    /vbscript:/i,
    /expression\(/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
};

// Validiere und sanitize Login-Daten
export interface LoginValidation {
  isValid: boolean;
  email: string;
  password: string;
  error?: string;
}

export const validateLoginInput = (email: string, password: string): LoginValidation => {
  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedPassword = password; // Passwort nicht trimmen (Leerzeichen könnten gewollt sein)

  if (!sanitizedEmail) {
    return { isValid: false, email: '', password: '', error: 'E-Mail ist erforderlich' };
  }

  if (!isValidEmail(sanitizedEmail)) {
    return { isValid: false, email: sanitizedEmail, password: '', error: 'Ungültige E-Mail-Adresse' };
  }

  if (!sanitizedPassword) {
    return { isValid: false, email: sanitizedEmail, password: '', error: 'Passwort ist erforderlich' };
  }

  if (sanitizedPassword.length < 4) {
    return { isValid: false, email: sanitizedEmail, password: '', error: 'Passwort zu kurz' };
  }

  if (containsSuspiciousPatterns(sanitizedEmail)) {
    return { isValid: false, email: '', password: '', error: 'Ungültige Eingabe erkannt' };
  }

  return {
    isValid: true,
    email: sanitizedEmail,
    password: sanitizedPassword,
  };
};

// Validiere Registrierungs-/Profil-Daten
export interface ProfileValidation {
  isValid: boolean;
  errors: Record<string, string>;
  sanitized: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
  };
}

export const validateProfileInput = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
}): ProfileValidation => {
  const errors: Record<string, string> = {};

  const firstName = sanitizeForDisplay(data.firstName);
  const lastName = sanitizeForDisplay(data.lastName);
  const email = data.email.trim().toLowerCase();
  const phone = data.phone?.trim() || '';
  const location = sanitizeForDisplay(data.location || '');

  if (!isValidName(firstName)) {
    errors.firstName = 'Ungültiger Vorname';
  }

  if (!isValidName(lastName)) {
    errors.lastName = 'Ungültiger Nachname';
  }

  if (!isValidEmail(email)) {
    errors.email = 'Ungültige E-Mail-Adresse';
  }

  if (phone && !isValidPhone(phone)) {
    errors.phone = 'Ungültige Telefonnummer';
  }

  // Check for suspicious patterns
  if (containsSuspiciousPatterns(firstName) || containsSuspiciousPatterns(lastName)) {
    errors.general = 'Ungültige Eingabe erkannt';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized: {
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      location: location || undefined,
    },
  };
};
