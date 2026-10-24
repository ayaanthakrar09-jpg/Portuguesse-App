// Text-to-speech using the browser's built-in voices (free, works offline for installed voices).

export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function findEuropeanVoice() {
  return speechSynthesis.getVoices().find((voice) => voice.lang.replace("_", "-").toLowerCase() === "pt-pt");
}

// Resolves to "ok", "no-pt-pt-voice" (spoke with whatever the browser chose) or "unsupported".
export async function speak(text) {
  if (!speechSupported()) return "unsupported";

  // Some browsers load their voice list a moment after the page opens.
  if (speechSynthesis.getVoices().length === 0) {
    await new Promise((resolve) => {
      speechSynthesis.addEventListener("voiceschanged", resolve, { once: true });
      setTimeout(resolve, 500);
    });
  }

  const voice = findEuropeanVoice();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-PT";
  utterance.rate = 0.9;
  if (voice) utterance.voice = voice;

  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
  return voice ? "ok" : "no-pt-pt-voice";
}
