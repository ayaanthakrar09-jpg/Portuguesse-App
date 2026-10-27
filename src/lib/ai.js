// AI tutor: talks to Google Gemini straight from the browser, using the learner's own free API key.
// The key is kept only in this browser's localStorage (never in the progress backup file).
// That is fine while the app runs on your own computer; if the app is ever put online for
// other people, each person must still bring their own key (never ship one inside the app).

const KEY_STORE = "pt-app-ai-key";
const MODEL_STORE = "pt-app-ai-model";
const USAGE_STORE = "pt-app-ai-usage";
const API = "https://generativelanguage.googleapis.com/v1beta";

export const DAILY_LIMIT = 20; // requests per day, a safeguard so a bug or habit can't run up usage
export const TURN_LIMIT = 15; // learner messages per conversation
const HISTORY_WINDOW = 12; // only the most recent messages are sent

function read(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function write(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Storage blocked: the key only lasts until the page closes.
  }
}

export const getKey = () => read(KEY_STORE);
export const getModel = () => read(MODEL_STORE);

export function forgetKey() {
  write(KEY_STORE, "");
  write(MODEL_STORE, "");
}

// Shows only the last four characters, so the key isn't on screen.
export function keyHint(key) {
  return key ? `••••${key.slice(-4)}` : "";
}

export function usedToday() {
  try {
    const usage = JSON.parse(read(USAGE_STORE) || "{}");
    return usage.date === new Date().toDateString() ? usage.count : 0;
  } catch {
    return 0;
  }
}

function countRequest() {
  write(USAGE_STORE, JSON.stringify({ date: new Date().toDateString(), count: usedToday() + 1 }));
}

// Turns Google's error replies into something the learner can act on.
async function explain(response) {
  let detail = "";
  try {
    detail = (await response.json())?.error?.message || "";
  } catch {
    // no readable body
  }
  if (response.status === 400 && /api key/i.test(detail)) return "Google didn't accept that key. Check you copied all of it.";
  if (response.status === 403) return "That key isn't allowed to use Gemini. Make a new key in Google AI Studio.";
  if (response.status === 429) return "Google's free limit is used up for now. Try again in a minute, or tomorrow.";
  if (response.status >= 500) return "Google's AI service is having trouble. Try again in a minute.";
  return detail || `Google returned an error (${response.status}).`;
}

async function call(url, key, body) {
  let response;
  try {
    response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { "x-goog-api-key": key, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Couldn't reach Google. Check your internet connection.");
  }
  if (!response.ok) throw new Error(await explain(response));
  return response.json();
}

// Free-tier chat models only: no preview, experimental or paid Pro models.
function pickModel(models) {
  const ids = models
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
    .map((m) => m.name.replace("models/", ""));
  // Newest numbered Flash model, Lite first (it has the most generous free limits).
  const numbered = ids.filter((id) => /^gemini-[\d.]+-flash(-lite)?$/.test(id));
  const version = (id) => parseFloat(id.match(/[\d.]+/)[0]);
  numbered.sort((a, b) => version(b) - version(a) || (a.includes("lite") ? -1 : 1));
  return numbered[0] || ids.find((id) => /^gemini-flash(-lite)?-latest$/.test(id));
}

// Checks the key with Google (listing models doesn't use up any quota), then saves it.
export async function saveKey(key) {
  const data = await call(`${API}/models?pageSize=200`, key);
  const model = pickModel(data.models || []);
  if (!model) throw new Error("The key works, but no free Gemini Flash model is available to it.");
  write(KEY_STORE, key);
  write(MODEL_STORE, model);
  return model;
}

const replySchema = {
  type: "OBJECT",
  properties: {
    corrections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          wrong: { type: "STRING" },
          right: { type: "STRING" },
          why: { type: "STRING" },
        },
        required: ["wrong", "right", "why"],
      },
    },
    reply: { type: "STRING" },
    english: { type: "STRING" },
  },
  required: ["corrections", "reply", "english"],
};

function instructions({ scenario, words, grammar }) {
  return `You are a patient tutor of European Portuguese (Portugal) chatting with a beginner who is learning on their own.

Language rules, always:
- European Portuguese only, never Brazilian. Use "tu" with the learner. Use Portugal words: autocarro, comboio, pequeno-almoço, telemóvel, casa de banho, frigorífico, rapariga, sumo, ecrã.
- "estar a" + infinitive (estou a comer), never the gerund (estou comendo).
- Object and reflexive pronouns after the verb in plain statements (chamo-me, diz-me), as in Portugal.
- Don't invent slang. If you aren't sure something is said in Portugal, don't use it.

How to talk:
- Situation: ${scenario}
- Reply in 1 to 3 short, simple sentences, then ask one question so the conversation keeps going.
- Stay mostly within words the learner has met. Known words: ${words}.
- Grammar the learner has practised: ${grammar}. Avoid tenses they haven't practised unless they use them first.
- If the learner writes in English, show them how to say it in Portuguese, then carry on.

Fields:
- "corrections": every real mistake in the learner's LAST message (grammar, agreement, spelling, missing accents, Brazilian forms). "wrong" is their words, "right" the corrected European Portuguese, "why" a short plain-English reason. Don't correct style or capital letters. Empty list if there are no mistakes or there is no learner message yet.
- "reply": your answer in European Portuguese.
- "english": a natural English translation of "reply".`;
}

// One tutor turn. `messages` is the conversation so far: [{ role: "learner" | "tutor", text }].
export async function tutorTurn({ messages, context }) {
  const key = getKey();
  const model = getModel();
  if (!key || !model) throw new Error("Add your API key first.");
  if (usedToday() >= DAILY_LIMIT) throw new Error(`You've used today's ${DAILY_LIMIT} tutor messages. More tomorrow.`);

  const recent = messages.slice(-HISTORY_WINDOW);
  const contents = recent.map((m) => ({ role: m.role === "tutor" ? "model" : "user", parts: [{ text: m.text }] }));
  // Gemini needs the conversation to start with the learner, so the opening turn gets a short cue.
  if (!contents.length || contents[0].role === "model") contents.unshift({ role: "user", parts: [{ text: "(Começa a conversa.)" }] });

  countRequest();
  const data = await call(`${API}/models/${model}:generateContent`, key, {
    systemInstruction: { parts: [{ text: instructions(context) }] },
    contents,
    generationConfig: { responseMimeType: "application/json", responseSchema: replySchema, temperature: 0.7 },
  });

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) throw new Error();
    return { reply: parsed.reply.trim(), english: parsed.english || "", corrections: parsed.corrections || [] };
  } catch {
    throw new Error("The tutor's answer came back garbled. Send your message again.");
  }
}
