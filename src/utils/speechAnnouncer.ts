/**
 * Browser SpeechSynthesis Auction Announcer
 * Provides spoken announcements for live bids, outbids, and winning gavel calls.
 */

// Natural converter for Nigerian Naira amounts into human speech
export function formatNairaForSpeech(amount: number): string {
  if (!amount || isNaN(amount)) return 'zero Naira';
  
  if (amount >= 1_000_000_000) {
    const billions = Math.floor(amount / 1_000_000_000);
    const remainder = amount % 1_000_000_000;
    const remMil = Math.floor(remainder / 1_000_000);
    if (remMil > 0) {
      return `${billions} billion ${remMil} million Naira`;
    }
    return `${billions} billion Naira`;
  }

  if (amount >= 1_000_000) {
    const millions = Math.floor(amount / 1_000_000);
    const remainder = amount % 1_000_000;
    const thousands = Math.floor(remainder / 1000);
    if (thousands > 0) {
      return `${millions} million ${thousands.toLocaleString()} thousand Naira`;
    }
    return `${millions} million Naira`;
  }

  if (amount >= 1_000) {
    const thousands = Math.floor(amount / 1000);
    const remainder = amount % 1000;
    if (remainder > 0) {
      return `${thousands.toLocaleString()} thousand ${remainder} Naira`;
    }
    return `${thousands.toLocaleString()} thousand Naira`;
  }

  return `${amount} Naira`;
}

// Clean nickname for voice pronunciation
export function sanitizeBidderForSpeech(name: string): string {
  if (!name) return 'a bidder';
  let cleaned = name
    .replace(/^@/, '')
    .replace(/_/g, ' ')
    .replace(/#/g, ' number ')
    .trim();
  return cleaned;
}

export type AnnouncerTone = 'standard' | 'energetic' | 'fast';

class SpeechAnnouncer {
  private isAvailable: boolean = false;
  private enabled: boolean = true;
  private voice: SpeechSynthesisVoice | null = null;
  private onSpeakingChangeCallbacks: Set<(isSpeaking: boolean, currentPhrase: string) => void> = new Set();
  private lastSpokenPhrase: string = '';
  private isSpeaking: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.isAvailable = true;
      // Load saved preference
      const saved = localStorage.getItem('naija_auction_voice_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }

      this.initVoice();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoice();
      }
    }
  }

  private initVoice() {
    if (!this.isAvailable) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    // Prefer Nigerian, British, or US English voices
    const preferred = voices.find(v => 
      v.lang === 'en-NG' || 
      v.lang.startsWith('en-GB') || 
      v.name.includes('Natural') || 
      v.name.includes('Samantha') || 
      v.name.includes('Google') ||
      v.lang.startsWith('en')
    );

    this.voice = preferred || voices[0] || null;
  }

  public checkAvailability(): boolean {
    return this.isAvailable;
  }

  public isVoiceEnabled(): boolean {
    return this.enabled;
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('naija_auction_voice_enabled', enabled ? 'true' : 'false');
      if (!enabled) {
        this.cancel();
      }
    }
  }

  public subscribe(callback: (isSpeaking: boolean, currentPhrase: string) => void): () => void {
    this.onSpeakingChangeCallbacks.add(callback);
    return () => {
      this.onSpeakingChangeCallbacks.delete(callback);
    };
  }

  private notify(speaking: boolean, phrase: string = '') {
    this.isSpeaking = speaking;
    this.lastSpokenPhrase = phrase;
    this.onSpeakingChangeCallbacks.forEach(cb => cb(speaking, phrase));
  }

  public cancel(): void {
    if (!this.isAvailable) return;
    try {
      window.speechSynthesis.cancel();
      this.notify(false, '');
    } catch {
      // Ignore
    }
  }

  public speak(text: string, options: { rate?: number; pitch?: number; priority?: boolean } = {}): void {
    if (!this.isAvailable || !this.enabled) return;

    try {
      // Resume if suspended (browser background policy)
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Cancel previous utterance if rapid bidding occurs so announcements stay real-time
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.lang = 'en-US';
      utterance.rate = options.rate || 1.08; // Energetic auctioneer cadence
      utterance.pitch = options.pitch || 1.02;

      utterance.onstart = () => {
        this.notify(true, text);
      };

      utterance.onend = () => {
        this.notify(false, '');
      };

      utterance.onerror = () => {
        this.notify(false, '');
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.notify(false, '');
    }
  }

  /**
   * Announce new highest bid
   */
  public announceBid(amount: number, bidder: string, isCurrentUser: boolean = false): void {
    const nairaPhrase = formatNairaForSpeech(amount);
    const cleanedBidder = sanitizeBidderForSpeech(bidder);

    let phrase = '';
    if (isCurrentUser) {
      phrase = `You placed the highest bid of ${nairaPhrase}!`;
    } else {
      phrase = `New highest bid! ${nairaPhrase} by ${cleanedBidder}.`;
    }

    this.speak(phrase, { rate: 1.1 });
  }

  /**
   * Announce lot sold
   */
  public announceSold(amount: number, winner: string, itemTitle?: string): void {
    const nairaPhrase = formatNairaForSpeech(amount);
    const winnerName = sanitizeBidderForSpeech(winner);
    const shortTitle = itemTitle ? itemTitle.split(' ').slice(0, 4).join(' ') : 'item';
    const phrase = `Sold! ${shortTitle} sold to ${winnerName} for ${nairaPhrase}!`;
    this.speak(phrase, { rate: 1.05, pitch: 1.05 });
  }

  /**
   * Test voice helper
   */
  public testVoice(): void {
    this.speak('Voice announcer active! Next bid is 750 thousand Naira.', { rate: 1.08 });
  }
}

export const speechAnnouncer = new SpeechAnnouncer();
