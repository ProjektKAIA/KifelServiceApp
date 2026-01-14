// src/utils/chatModeration.ts

/**
 * Chat Moderation Utilities
 * - Schimpfwort-Filter
 * - @mention Erkennung
 */

// Deutsche und englische Schimpfwörter (erweiterbar)
const BLOCKED_WORDS = [
  // Deutsche Schimpfwörter
  'scheiße', 'scheisse', 'scheiß', 'scheiss', 'kacke', 'kack',
  'arschloch', 'arsch', 'wichser', 'wichse', 'hurensohn', 'hure',
  'fotze', 'fick', 'ficken', 'gefickt', 'ficker', 'drecksau',
  'mistkerl', 'miststück', 'vollidiot', 'idiot', 'depp', 'trottel',
  'penner', 'assi', 'asi', 'schwuchtel', 'spast', 'spasti',
  'behindert', 'mongo', 'retard', 'hurenkind', 'bastard',
  'dummkopf', 'blödmann', 'blödian', 'saftsack', 'dreckskerl',
  'missgeburt', 'wixer', 'pisser', 'kotzbrocken', 'dumpfbacke',
  // Englische Schimpfwörter
  'fuck', 'fucking', 'fucker', 'shit', 'bullshit', 'bitch',
  'asshole', 'ass', 'dick', 'cock', 'pussy', 'cunt', 'whore',
  'bastard', 'damn', 'moron', 'idiot', 'stupid', 'dumb',
  'retard', 'retarded', 'faggot', 'nigger', 'nigga',
  // Abkürzungen
  'wtf', 'stfu', 'gtfo', 'lmao', 'lmfao',
];

// Regex-Patterns für Variationen (z.B. sch3iße, f*ck)
const PATTERNS = [
  /s+c+h+[e3]+[i1]+[ß|ss|s]+[e3]*/gi,
  /f+[u*]+c+k+/gi,
  /a+r+s+c+h+/gi,
  /h+u+r+[e3]+/gi,
  /w+[i1]+c+h+s+/gi,
];

export interface ModerationResult {
  isClean: boolean;
  filteredContent: string;
  blockedWords: string[];
  hasMentions: boolean;
  mentions: string[];
}

/**
 * Prüft und filtert Nachrichteninhalt
 */
export const moderateMessage = (content: string): ModerationResult => {
  let filteredContent = content;
  const blockedWordsFound: string[] = [];

  // Prüfe auf blockierte Wörter
  for (const word of BLOCKED_WORDS) {
    const regex = new RegExp(`\\b${escapeRegex(word)}\\b`, 'gi');
    if (regex.test(filteredContent)) {
      blockedWordsFound.push(word);
      filteredContent = filteredContent.replace(regex, maskWord(word));
    }
  }

  // Prüfe auf Pattern-Variationen
  for (const pattern of PATTERNS) {
    const matches = filteredContent.match(pattern);
    if (matches) {
      matches.forEach(match => {
        if (!blockedWordsFound.includes(match.toLowerCase())) {
          blockedWordsFound.push(match.toLowerCase());
        }
        filteredContent = filteredContent.replace(pattern, maskWord(match));
      });
    }
  }

  // Extrahiere @mentions
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let mentionMatch;
  while ((mentionMatch = mentionRegex.exec(content)) !== null) {
    mentions.push(mentionMatch[1]);
  }

  return {
    isClean: blockedWordsFound.length === 0,
    filteredContent,
    blockedWords: blockedWordsFound,
    hasMentions: mentions.length > 0,
    mentions,
  };
};

/**
 * Maskiert ein Wort mit Sternchen
 */
const maskWord = (word: string): string => {
  if (word.length <= 2) return '**';
  return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
};

/**
 * Escaped Regex-Sonderzeichen
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Prüft ob Nachricht sauber ist (ohne Filterung)
 */
export const isMessageClean = (content: string): boolean => {
  const lower = content.toLowerCase();

  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) return false;
  }

  for (const pattern of PATTERNS) {
    if (pattern.test(content)) return false;
  }

  return true;
};

/**
 * Extrahiert @mentions aus einer Nachricht
 */
export const extractMentions = (content: string): string[] => {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

/**
 * Findet User-IDs basierend auf @mentions
 */
export const findMentionedUsers = (
  mentions: string[],
  users: Array<{ id: string; firstName: string; lastName: string }>
): string[] => {
  const mentionedUserIds: string[] = [];

  for (const mention of mentions) {
    const lowerMention = mention.toLowerCase();

    // Suche nach Vorname, Nachname oder Vollname
    const matchedUser = users.find(user => {
      const firstName = user.firstName.toLowerCase();
      const lastName = user.lastName.toLowerCase();
      const fullName = `${firstName}${lastName}`;

      return (
        firstName === lowerMention ||
        lastName === lowerMention ||
        fullName === lowerMention ||
        `${firstName}.${lastName}` === lowerMention ||
        `${firstName}_${lastName}` === lowerMention
      );
    });

    if (matchedUser && !mentionedUserIds.includes(matchedUser.id)) {
      mentionedUserIds.push(matchedUser.id);
    }
  }

  return mentionedUserIds;
};

/**
 * Formatiert Nachricht mit hervorgehobenen @mentions
 * Gibt ein Array von Teilen zurück (für React Native Text-Komponenten)
 */
export interface MessagePart {
  type: 'text' | 'mention';
  content: string;
}

export const parseMessageWithMentions = (content: string): MessagePart[] => {
  const parts: MessagePart[] = [];
  const mentionRegex = /@(\w+)/g;
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Text vor dem @mention
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex, match.index),
      });
    }

    // Der @mention selbst
    parts.push({
      type: 'mention',
      content: match[0], // Inkl. @
    });

    lastIndex = match.index + match[0].length;
  }

  // Restlicher Text nach dem letzten @mention
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex),
    });
  }

  // Falls keine mentions, gib den ganzen Text zurück
  if (parts.length === 0) {
    parts.push({ type: 'text', content });
  }

  return parts;
};
