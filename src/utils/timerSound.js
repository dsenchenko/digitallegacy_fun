let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function playTimerExpiredSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const playTone = (frequency, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(880, now, 0.18);
    playTone(660, now + 0.2, 0.18);
    playTone(880, now + 0.4, 0.25);
  } catch {
    // OBS may block audio until user interaction — fail silently
  }
}
