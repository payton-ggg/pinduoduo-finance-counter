/**
 * Проигрывает приятный звуковой сигнал нового сообщения через Web Audio API
 */
export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();

    // Первый тон (высокий)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain1.gain.setValueAtTime(0, ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.25);

    // Второй тон (финальный звонкий акцент)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6

    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    gain2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.38);
  } catch (e) {
    console.warn("Audio notification could not be played:", e);
  }
}
