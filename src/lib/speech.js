// Text-to-speech using the browser's built-in voices (free, works offline for installed voices).

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function normaliseLang(lang) {
  return lang.replace("_", "-").toLowerCase();
}

// Prefer European Portuguese, accept Brazilian as a flagged fallback, never use a non-Portuguese voice.
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  const european = voices.find((voice) => normaliseLang(voice.lang) === "pt-pt");
  if (european) return { voice: european, status: "ok" };
  const other = voices.find((voice) => normaliseLang(voice.lang).startsWith("pt"));
  if (other) return { voice: other, status: "brazilian-voice" };
  return { voice: null, status: "no-portuguese-voice" };
}

// "ok" only when a European Portuguese voice is installed. Used to decide whether listening questions make sense.
export async function voiceStatus() {
  if (!speechSupported()) return "unsupported";
  if (speechSynthesis.getVoices().length === 0) {
    await new Promise((resolve) => {
      speechSynthesis.addEventListener("voiceschanged", resolve, { once: true });
      setTimeout(resolve, 500);
    });
  }
  return pickVoice().status;
}

export const speechMessages = {
  unsupported: "This browser can't play speech. Try Edge or Chrome.",
  "no-portuguese-voice":
    "No Portuguese voice is installed on this device, so audio is switched off rather than reading Portuguese with an English accent. Add Portuguese (Portugal) in Windows Settings > Time & language > Speech, then restart your browser.",
  "brazilian-voice": "Only a Brazilian Portuguese voice is installed, so the accent will not be European.",
};

// Resolves to "ok", "brazilian-voice", "no-portuguese-voice" or "unsupported".
export async function speak(text, { rate = 0.9 } = {}) {
  if (!speechSupported()) return "unsupported";

  // Some browsers load their voice list a moment after the page opens.
  if (speechSynthesis.getVoices().length === 0) {
    await new Promise((resolve) => {
      speechSynthesis.addEventListener("voiceschanged", resolve, { once: true });
      setTimeout(resolve, 500);
    });
  }

  const { voice, status } = pickVoice();
  if (!voice) return status;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = rate;

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  return status;
}
