class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public volume: number = 0.8;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Subtle, rewarding chime for the user's successful bid or pre-bid placement.
   * Dual harmonic chime (F5 -> C6) with smooth decay and warm filter.
   */
  playUserBidSuccessSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.14 * this.volume, now);
      masterGain.connect(this.ctx.destination);

      // Note 1: F5 (698.46 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(698.46, now);
      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Note 2: C6 (1046.5 Hz) - bright harmonic chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1046.5, now + 0.05);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.9, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.35);

      // Subtle high sparkle overtone
      const osc3 = this.ctx.createOscillator();
      const gain3 = this.ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1567.98, now + 0.08); // G6
      gain3.gain.setValueAtTime(0.001, now);
      gain3.gain.setValueAtTime(0.35, now + 0.08);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      osc3.start(now + 0.08);
      osc3.stop(now + 0.3);
    } catch {
      // Audio playback fails gracefully
    }
  }

  /**
   * Attention-grabbing, warm harmonic chime for closing-soon notifications (within 2 minutes of closing).
   * Rising dual-bell tone (A5 880Hz -> E6 1318.5Hz).
   */
  playClosingSoonAlert() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.18 * this.volume, now);
      masterGain.connect(this.ctx.destination);

      // First bell: A5 (880 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.7, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Second bell: E6 (1318.5 Hz) - bright harmonic chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.5, now + 0.08);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.85, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.48);
    } catch {
      // Audio playback fails gracefully
    }
  }

  /**
   * Subtle, distinct outbid alert notification.
   * Gentle two-stage cautionary drop (D5 587Hz -> A4 440Hz) with soft low-pass filter.
   */
  playOutbidSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.15 * this.volume, now);

      // Warm low-pass filter to prevent harshness
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);
      filter.connect(this.ctx.destination);
      masterGain.connect(filter);

      // First warning tone: D5 (587.33 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.8, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Second warning tone: A4 (440 Hz) - descending interval indicating outbid
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now + 0.1);
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.9, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.35);
    } catch {
      // gracefully fail
    }
  }

  /**
   * Subtle background activity tick for competitor bids placed in room.
   */
  playCompetitorBidSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(460, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

      gain.gain.setValueAtTime(0.06 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // gracefully fail
    }
  }

  // Alias for backward compatibility
  playBidSound() {
    this.playCompetitorBidSound();
  }

  /**
   * Dynamic auction countdown tick.
   * - Seconds 10 down to 6: subtle wooden clock tick
   * - Seconds 5 down to 1: intensifying high-tension suspense heartbeat tick with ascending pitch
   */
  playCountdownTick(secondsRemaining: number) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (secondsRemaining <= 5 && secondsRemaining >= 1) {
        // High-tension critical countdown (5, 4, 3, 2, 1)
        // Ascending pitches: 5s=800Hz, 4s=900Hz, 3s=1020Hz, 2s=1160Hz, 1s=1320Hz
        const pitches: Record<number, number> = {
          5: 800,
          4: 900,
          3: 1040,
          2: 1180,
          1: 1350
        };
        const freq = pitches[secondsRemaining] || 900;
        const gainLevel = (0.06 + (6 - secondsRemaining) * 0.015) * this.volume;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(gainLevel, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);

        // Subtly add sub-pulse for 3s, 2s, 1s
        if (secondsRemaining <= 3) {
          const subOsc = this.ctx.createOscillator();
          const subGain = this.ctx.createGain();
          subOsc.type = 'sine';
          subOsc.frequency.setValueAtTime(freq * 0.5, now);
          subGain.gain.setValueAtTime(gainLevel * 0.5, now);
          subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
          subOsc.connect(subGain);
          subGain.connect(this.ctx.destination);
          subOsc.start(now);
          subOsc.stop(now + 0.07);
        }
      } else {
        // Standard countdown tick (10s to 6s): gentle, subtle wooden acoustic click
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(840, now);

        gain.gain.setValueAtTime(0.04 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // gracefully fail
    }
  }

  // Alias for backward compatibility
  playTickSound() {
    this.playCountdownTick(5);
  }

  /**
   * Anti-sniping +10s Extension sound:
   * Uplifting rapid arpeggio celebrating extended bidding window.
   */
  playExtendedSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const freqs = [440, 554.37, 659.25, 880];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.09 * this.volume, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.15);
      });
    } catch {
      // gracefully fail
    }
  }

  /**
   * Auction Gavel hammer strike:
   * Double wooden tap with resonant acoustic body.
   */
  playSoldGavelSound() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Double strike hammer effect
      [0, 0.16].forEach((timeOffset) => {
        if (!this.ctx) return;
        // Wood impact
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now + timeOffset);
        osc.frequency.exponentialRampToValueAtTime(80, now + timeOffset + 0.09);

        gain.gain.setValueAtTime(0.18 * this.volume, now + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.11);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.12);
      });
    } catch {
      // gracefully fail
    }
  }

  /**
   * Celebratory Win Fanfare for the winning bidder!
   */
  playWinFanfare() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C major fanfare
      chord.forEach((freq, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.12 * this.volume, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
      });
    } catch {
      // gracefully fail
    }
  }
}

export const sounds = new SoundManager();

