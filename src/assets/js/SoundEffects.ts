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
   * Creates a short mechanical prize-wheel click.
   */
  private playClick(volume = 0.055): void {
    if (this.mute) {
      return;
    }

    const context = this.getAudioContext();
    const now = context.currentTime;

    // Short click
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'square';

    oscillator.frequency.setValueAtTime(1800, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      900,
      now + 0.035
    );

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      volume,
      now + 0.003
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + 0.045
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }

  /**
   * Plays a fast prize-wheel clicking sound.
   */
  public spin(durationInSecond = 20): void {
    if (this.spinTimeout) {
      window.clearTimeout(this.spinTimeout);
    }

    if (this.mute) {
      return;
    }

    this.spinStartTime = performance.now();

    const tick = () => {
      if (this.mute) {
        return;
      }

      const elapsed = performance.now() - this.spinStartTime;
      const duration = durationInSecond * 1000;

      if (elapsed >= duration) {
        return;
      }

      const progress = elapsed / duration;

      /*
       * Very fast clicks at the beginning.
       * Gradually slow down toward the winner.
       */
      const interval =
        progress < 0.72
          ? 85
          : 85 + ((progress - 0.72) / 0.28) * 260;

      this.playClick(
        progress > 0.85 ? 0.07 : 0.045
      );

      this.spinTimeout = window.setTimeout(
        tick,
        interval
      );
    };

    tick();
  }

  /**
   * Plays a fun game-show winner sound.
   */
  public async win(): Promise<void> {
    if (this.mute) {
      return;
    }

    const context = this.getAudioContext();
    const now = context.currentTime;

    /*
     * Bright game-show "TA-DA!"
     */
    const notes = [
      { frequency: 523.25, time: 0.00 },
      { frequency: 659.25, time: 0.10 },
      { frequency: 783.99, time: 0.20 },
      { frequency: 1046.50, time: 0.34 }
    ];

    notes.forEach(({ frequency, time }) => {
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
        0.16,
        now + time + 0.015
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + time + 0.3
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now + time);
      oscillator.stop(now + time + 0.32);
    });

    return new Promise((resolve) => {
      window.setTimeout(resolve, 750);
    });
  }
}
