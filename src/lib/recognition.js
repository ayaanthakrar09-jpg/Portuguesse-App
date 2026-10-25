// Speech-to-text with the browser's built-in recogniser (Chrome and Edge).
// It only writes down what it thinks it heard. It does not and cannot score pronunciation.
// Chrome sends the audio to Google and Edge to Microsoft to do this.

const Recognition = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined;

export function recognitionSupported() {
  return Boolean(Recognition);
}

export const recognitionMessages = {
  unsupported: "This browser can't turn speech into text. Use Chrome or Edge, or just listen and repeat.",
  "not-allowed": "The microphone is blocked. Allow it with the icon in the address bar, then try again.",
  "service-not-allowed": "The microphone is blocked. Allow it with the icon in the address bar, then try again.",
  "audio-capture": "No microphone was found. Plug one in or check your sound settings.",
  "no-speech": "Nothing was heard. Press Speak and say the sentence a little louder.",
  network: "Speech recognition needs an internet connection.",
  "language-not-supported": "This browser can't recognise European Portuguese.",
};

// Starts listening. Calls onText with the words so far, and onEnd with the final text or an error code.
// Returns a function that stops listening early.
export function startListening({ onText, onEnd }) {
  if (!Recognition) {
    onEnd({ error: "unsupported" });
    return () => {};
  }
  const recognition = new Recognition();
  recognition.lang = "pt-PT";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  let text = "";
  let error = null;
  recognition.onresult = (event) => {
    text = Array.from(event.results, (result) => result[0].transcript).join(" ");
    onText(text);
  };
  recognition.onerror = (event) => {
    if (event.error !== "aborted") error = event.error;
  };
  recognition.onend = () => onEnd(error ? { error } : { text });
  recognition.start();
  return () => recognition.stop();
}

/* ---------- Comparing what was heard with the sentence ---------- */

// Recognisers often write numbers as digits and "euros" as €.
const DIGITS = { 0: ["zero"], 1: ["um", "uma"], 2: ["dois", "duas"], 3: ["tres"], 4: ["quatro"], 5: ["cinco"], 6: ["seis"], 7: ["sete"], 8: ["oito"], 9: ["nove"], 10: ["dez"] };

function plain(word) {
  return word.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Words for comparing: lower case, no accents or punctuation, hyphenated words split ("chamo-me" -> "chamo", "me").
function comparable(text) {
  return plain(text.replace(/€/g, " euros "))
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean);
}

function sameWord(target, heard) {
  return target === heard || (DIGITS[heard] ?? []).includes(target);
}

// Splits the sentence into display words, each marked as heard or not, using the longest common
// in-order match between the sentence and what the recogniser wrote.
export function compareSpeech(sentence, heardText) {
  const display = sentence.split(/\s+/).flatMap((word) =>
    comparable(word).map((part, index, parts) => ({ part, word, last: index === parts.length - 1 })),
  );
  const target = display.map((d) => d.part);
  const heard = comparable(heardText);

  // Longest common subsequence table.
  const table = Array.from({ length: target.length + 1 }, () => new Array(heard.length + 1).fill(0));
  for (let i = target.length - 1; i >= 0; i -= 1) {
    for (let j = heard.length - 1; j >= 0; j -= 1) {
      table[i][j] = sameWord(target[i], heard[j]) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const matched = new Array(target.length).fill(false);
  for (let i = 0, j = 0; i < target.length && j < heard.length; ) {
    if (sameWord(target[i], heard[j])) {
      matched[i] = true;
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) i += 1;
    else j += 1;
  }

  // Back to the sentence's own words: a hyphenated word counts as heard only if all its parts were.
  const words = [];
  let allParts = true;
  display.forEach((d, index) => {
    allParts = allParts && matched[index];
    if (d.last) {
      words.push({ text: d.word, heard: allParts });
      allParts = true;
    }
  });
  return { words, heardCount: words.filter((w) => w.heard).length };
}
