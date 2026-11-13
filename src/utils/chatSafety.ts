/**
 * Chat safety & scam prevention engine for Nigerian Live Auction
 */

const SCAM_PATTERNS = [
  /whatsapp\s*(me|us|at)?/i,
  /call\s*(me|my\s*line|at|on)?/i,
  /pay\s*(directly|outside|to\s*my\s*opay|to\s*palmpay|to\s*kuda|account)/i,
  /send\s*(money|dm|wire|crypto|usdt)/i,
  /telegram/i,
  /0[789][01]\d{8}/, // Nigerian phone numbers like 08012345678, 090, 070
  /\+?234\s?[789][01]\d{8}/,
  /dm\s*(me|for\s*cheap)/i,
  /https?:\/\/[^\s]+/i,
  /www\.[^\s]+/i,
  /\.com|\.ng|\.org|\.io/i,
];

const PROFANITY_LIST = [
  'scam', 'thief', 'bastard', 'fuck', 'idiot', 'fool', 'cheat', 'fake'
];

export interface ChatFilterResult {
  allowed: boolean;
  cleanText: string;
  reason?: string;
  isFlagged?: boolean;
}

export function filterChatMessage(rawText: string): ChatFilterResult {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { allowed: false, cleanText: '', reason: 'Empty message' };
  }

  // Length check
  if (trimmed.length > 200) {
    return { allowed: false, cleanText: '', reason: 'Message exceeds maximum length (200 chars)' };
  }

  // Check for scam phrases & off-platform solicitation
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        allowed: false,
        cleanText: trimmed,
        reason: 'Message blocked: Sharing external contact information or off-platform payment requests is strictly prohibited for buyer protection.'
      };
    }
  }

  // Mask sensitive 10-11 digit numeric sequences (potential phone numbers or bank account numbers)
  let cleanText = trimmed.replace(/\b(\d{3,4})[\s-]?(\d{3,4})[\s-]?(\d{3,4})\b/g, '[NUMBER HIDDEN]');

  // Check profanity
  let isFlagged = false;
  for (const word of PROFANITY_LIST) {
    const reg = new RegExp(`\\b${word}\\b`, 'gi');
    if (reg.test(cleanText)) {
      cleanText = cleanText.replace(reg, '***');
      isFlagged = true;
    }
  }

  return {
    allowed: true,
    cleanText,
    isFlagged
  };
}
