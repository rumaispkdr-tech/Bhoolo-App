/**
 * Web Audio API Synthesizer for Victory and Sad/Lose Sounds
 * Zero external audio files required, works offline and across all browsers & devices.
 */

export function playCelebrationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C4, E4, G4, C5, E5
    let startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

      gain.gain.setValueAtTime(0.001, startTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + idx * 0.12 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.12 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.12);
      osc.stop(startTime + idx * 0.12 + 0.4);
    });
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}

export function playLoseSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Sad descending notes: Eb3, C3, Ab2, G2
    const notes = [311.13, 261.63, 207.65, 196.00];
    let startTime = ctx.currentTime + 0.05;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime + idx * 0.28);

      gain.gain.setValueAtTime(0.001, startTime + idx * 0.28);
      gain.gain.exponentialRampToValueAtTime(0.25, startTime + idx * 0.28 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + idx * 0.28 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime + idx * 0.28);
      osc.stop(startTime + idx * 0.28 + 0.55);
    });
  } catch (e) {
    console.warn('Audio playback error:', e);
  }
}
