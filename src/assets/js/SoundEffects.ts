/** Class for playing sound effects */
export default class SoundEffects {
  private audioContext: AudioContext | null;
  private spinTimeout?: number;
  private spinStartTime = 0;

  public mute: boolean;

  constructor() {
    this.audioContext = null;
    this.mute = false;
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    return this.audioContext;
  }

  /**
   * Plays one playful musical note during the spin.
   */
  private playSpinNote(
    frequency: number,
    duration = 0.12,
    volume = 0.06
  ): void {
    if (this.mute) {
      return;
    }

    const context = this.getAudioContext();
    const now = context.currentTime;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';

    oscillator.frequency.setValueAtTime(frequency, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.008
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.01);
  }

  /**
   * Fun musical spinning sound.
   */
  public spin(durationInSecond = 20): void {
    if (this.spinTimeout) {
      window.clearTimeout(this.spinTimeout);
    }

    if (this.mute) {
      return;
    }

    this.spinStartTime = performance.now();

    // Playful game-show style notes.
    const notes = [
      523.25,  // C5
      659.25,  // E5
      783.99,  // G5
      659.25,  // E5
      880.00,  // A5
      783.99,  // G5
      987.77,  // B5
      783.99   // G5
    ];

    let noteIndex = 0;

    const tick = () => {
      if (this.mute) {
        return;
      }

      const elapsed =
        performance.now() - this.spinStartTime;

      const duration = durationInSecond * 1000;

      if (elapsed >= duration) {
        return;
      }

      const progress = elapsed / duration;

      /*
       * Starts playful and energetic,
       * then gradually slows down.
       */
      let interval: number;

      if (progress < 0.65) {
        interval = 150;
      } else if (progress < 0.85) {
        interval = 150 + ((progress - 0.65) / 0.20) * 120;
      } else {
        interval = 270 + ((progress - 0.85) / 0.15) * 300;
      }

      /*
       * Make the notes rise toward the end
       * for a little more suspense.
       */
      let frequency = notes[noteIndex % notes.length];

      if (progress > 0.80) {
        frequency *= 1.25;
      }

      if (progress > 0.92) {
        frequency *= 1.12;
      }

      this.playSpinNote(
        frequency,
        Math.min(0.14, interval / 1000 * 0.8),
        progress > 0.85 ? 0.075 : 0.055
      );

      noteIndex += 1;

      this.spinTimeout = window.setTimeout(
        tick,
        interval
      );
    };

    tick();
  }

  /**
   * Big fun game-show "TA-DA!"
   */
  public async win(): Promise<void> {
    if (this.mute) {
      return;
    }

    const context = this.getAudioContext();
    const now = context.currentTime;

    /*
     * Bright major TA-DA chord:
     * C - E - G - C
     */
    const chord = [
      { frequency: 523.25, time: 0.00 },
      { frequency: 659.25, time: 0.00 },
      { frequency: 783.99, time: 0.00 },
      { frequency: 1046.50, time: 0.08 }
    ];

    chord.forEach(({ frequency, time }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'triangle';

      oscillator.frequency.setValueAtTime(
        frequency,
        now + time
      );

      gain.gain.setValueAtTime(
        0.0001,
        now + time
      );

      gain.gain.exponentialRampToValueAtTime(
        0.18,
        now + time + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + time + 0.8
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now + time);
      oscillator.stop(now + time + 0.85);
    });

    /*
     * Extra high sparkle notes.
     */
    const sparkleNotes = [
      { frequency: 1318.51, time: 0.18 },
      { frequency: 1567.98, time: 0.25 },
      { frequency: 2093.00, time: 0.33 }
    ];

    sparkleNotes.forEach(({ frequency, time }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';

      oscillator.frequency.setValueAtTime(
        frequency,
        now + time
      );

      gain.gain.setValueAtTime(
        0.0001,
        now + time
      );

      gain.gain.exponentialRampToValueAtTime(
        0.10,
        now + time + 0.01
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + time + 0.35
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now + time);
      oscillator.stop(now + time + 0.4);
    });

    return new Promise((resolve) => {
      window.setTimeout(resolve, 1100);
    });
  }
}
