'use strict';

const numberWords = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  // Arabic number words
  صفر: '0', واحد: '1', اثنين: '2', اتنين: '2', ثلاثة: '3', تلاتة: '3',
  اربعة: '4', خمسة: '5', ستة: '6', سبعة: '7', ثمانية: '8', ثمانيه: '8', تسعة: '9', تسعه: '9'
};

/**
 * Normalizes input text and scans for contact info indicators (email, phone, social handles, links).
 * Returns { hasContactInfo: boolean, blockedPatterns: string[] }
 */
const detectContactInfo = (text) => {
  if (!text || typeof text !== 'string') {
    return { hasContactInfo: false, blockedPatterns: [] };
  }

  const blockedPatterns = [];
  const lowercaseText = text.toLowerCase();

  // 1. Direct and Obfuscated Email Check
  // Matches "test@gmail.com", "test [at] gmail [dot] com", "test(at)gmail(dot)com", "test at gmail dot com"
  const emailRegex = /\b[a-z0-9._%+-]+\s*(?:@|\[at\]|\(at\)|\bat\b)\s*[a-z0-9.-]+\s*(?:\.|\[dot\]|\(dot\)|\bdot\b)\s*[a-z]{2,}\b/g;
  const emails = lowercaseText.match(emailRegex);
  if (emails && emails.length > 0) {
    blockedPatterns.push(...emails);
  }

  // 2. Direct Social Media Profile Links
  // Matches telegram link (t.me/, telegram.me/), whatsapp link (wa.me/), facebook, instagram, linkedin, twitter, x
  const linkRegex = /(?:t\.me|wa\.me|telegram\.me|facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com)\/[a-z0-9_.-]+/g;
  const links = lowercaseText.match(linkRegex);
  if (links && links.length > 0) {
    blockedPatterns.push(...links);
  }

  // 3. WhatsApp/Telegram username handle keywords
  // Matches patterns like "whatsapp: username", "telegram id: user_name"
  const handleKeywords = /\b(?:telegram|whatsapp|insta|facebook|linkedin|fb|tg|insta|viber|wechat|skype)\s*[:@-]?\s*[a-z0-9_.-]{4,}\b/g;
  const handles = lowercaseText.match(handleKeywords);
  if (handles && handles.length > 0) {
    blockedPatterns.push(...handles);
  }

  // 4. Phone Numbers, including spaces, dots, dashes, and written-out word numbers.
  // First, replace words representing digits with actual digit chars.
  let normalizedText = lowercaseText;
  Object.keys(numberWords).forEach((word) => {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'g');
    normalizedText = normalizedText.replace(wordRegex, numberWords[word]);
  });

  // Regex to match sequences of 8 or more digits separated ONLY by spacing/punctuation (spaces, dots, dashes, parentheses).
  // E.g. "0 1 0 1 2 3 4 5 6 7 8" or "010-123-456-78"
  const phoneRegex = /(?:\+?\d[\s.\-()]*){8,}/g;
  const phones = normalizedText.match(phoneRegex);
  if (phones && phones.length > 0) {
    // We clean each match to ensure it has at least 8 digits before blocking,
    // to prevent blocking short digits or dates (e.g., "2026-06-09" matches, which is fine since it's a date,
    // but a sequence like "010-123456" is 9 digits so we block it)
    phones.forEach((phoneMatch) => {
      const digitCount = phoneMatch.replace(/[^0-9]/g, '').length;
      if (digitCount >= 8) {
        blockedPatterns.push(phoneMatch.trim());
      }
    });
  }

  return {
    hasContactInfo: blockedPatterns.length > 0,
    blockedPatterns: [...new Set(blockedPatterns)],
  };
};

module.exports = {
  detectContactInfo,
};
