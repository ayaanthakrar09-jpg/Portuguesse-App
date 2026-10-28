// Short sounds for lessons, made in the browser (no audio files). Sound on or off is remembered per device.

const KEY = "pt-app-sound";
let context = null;

export function soundOn() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Storage can be blocked; the choice then lasts until the page closes.
  }
}

function tone(frequency, start, length, { type = "sine", volume = 0.07 } = {}) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + length);
}

// "right": two rising notes. "wrong": one low soft note. "done": a short rising run.
export function playSound(name) {
  if (!soundOn()) return;
  try {
    context ??= new AudioContext();
    const now = context.currentTime;
    if (name === "right") {
      tone(660, now, 0.14);
      tone(990, now + 0.08, 0.2);
    } else if (name === "wrong") {
      tone(196, now, 0.28, { type: "triangle", volume: 0.06 });
    } else if (name === "done") {
      [523, 659, 784, 1047].forEach((frequency, i) => tone(frequency, now + i * 0.11, 0.3));
    }
  } catch {
    // No audio available: lessons work the same without sound.
  }
}
