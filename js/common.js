/* ZING! Arcade shared helpers: sound (WebAudio, no files), best scores, mute toggle */
const Arcade = (() => {
  let ctx = null;
  let muted = false;
  try { muted = localStorage.getItem('zing:muted') === '1'; } catch (e) {}

  function ac() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur = 0.12, type = 'sine', vol = 0.15, slideTo = null, delay = 0) {
    if (muted) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  // Major pentatonic: every step sounds nice, so rising combos feel musical.
  const PENT = [0, 2, 4, 7, 9];
  function noteFreq(i, base = 261.63) {
    const oct = Math.floor(i / 5);
    return base * Math.pow(2, (PENT[((i % 5) + 5) % 5] + 12 * oct) / 12);
  }
  function note(i, dur = 0.18, type = 'triangle', vol = 0.16) { tone(noteFreq(i), dur, type, vol); }

  // Short "bloop/pop" – pitch multiplier p
  function pop(p = 1) {
    tone(620 * p, 0.09, 'sine', 0.22, 140 * p);
    tone(1200 * p, 0.03, 'square', 0.04, 400 * p);
  }

  function chord(steps, dur = 0.5) { steps.forEach((s, i) => tone(noteFreq(s), dur, 'triangle', 0.12, null, i * 0.07)); }

  function best(game) {
    try { return parseFloat(localStorage.getItem('zing:best:' + game)) || 0; } catch (e) { return 0; }
  }
  // returns true when it is a new best
  function setBest(game, v) {
    if (v > best(game)) { try { localStorage.setItem('zing:best:' + game, String(v)); } catch (e) {} return true; }
    return false;
  }

  function initMute() {
    const b = document.getElementById('mute');
    if (!b) return;
    const paint = () => { b.textContent = muted ? '🔇' : '🔊'; b.setAttribute('aria-label', muted ? 'Unmute' : 'Mute'); };
    paint();
    b.addEventListener('click', () => {
      muted = !muted;
      try { localStorage.setItem('zing:muted', muted ? '1' : '0'); } catch (e) {}
      paint();
      if (!muted) pop(1);
    });
  }
  document.addEventListener('DOMContentLoaded', initMute);

  const fmt = n => {
    if (n < 1000) return (Math.floor(n * 10) / 10).toString().replace(/\.0$/, '');
    const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi'];
    let i = -1;
    while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
    return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + u[i];
  };

  return { tone, note, noteFreq, pop, chord, best, setBest, fmt, ac };
})();
