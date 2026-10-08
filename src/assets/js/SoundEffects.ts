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
   * Plays a short, lively tick.
   */
  private playTick(pitch: number, volume: number): void {
    if (this.mute) {
      return;
    }

    const context = this.getAudioContext();
    const now = context.currentTime;

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(pitch, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }

  /**
   * Plays an upbeat ticking sound while the picker spins.
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

      // Starts energetic and gradually becomes more exciting.
      const interval = Math.max(90, 240 - progress * 120);

      // Slightly raises the pitch as the draw gets closer to the winner.
      const pitch = 520 + progress * 280;

      this.playTick(pitch, 0.055);

      this.spinTimeout = window.setTimeout(tick, interval);
    };

    tick();
  }

  /**
   * Plays a cheerful winner sound.
   */
  public async win(): Promise<void> {
    if (this.mute) {
      return;
    }

    const context = this.getAudioContext();
    const now = context.currentTime;

    const notes = [
      { frequency: 523.25, time: 0 },
      { frequency: 659.25, time: 0.12 },
      { frequency: 783.99, time: 0.24 },
      { frequency: 1046.5, time: 0.40 }
    ];

    notes.forEach(({ frequency, time }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now + time);

      gain.gain.setValueAtTime(0.0001, now + time);
      gain.gain.exponentialRampToValueAtTime(
        0.14,
        now + time + 0.015
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        now + time + 0.28
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now + time);
      oscillator.stop(now + time + 0.3);
    });

    return new Promise((resolve) => {
      window.setTimeout(resolve, 750);
    });
  }
}
