// Marks typed answers. Forgiving about capitals, spacing, punctuation and missing accents;
// strict about everything else. Other wordings only count if the item lists them in `alternatives`.

import { displayPt } from "./vocab";

// Lower case, punctuation removed (hyphens kept: pequeno-almoço, chamo-me), spaces tidied.
function tidy(text) {
  return text
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,!?¿¡;:"'«»…]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withoutAccents(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Every spelling we accept. Nouns count with or without their article ("pão" or "o pão").
export function acceptedAnswers(item) {
  const forms = [item.pt, ...(item.alternatives ?? [])];
  return item.gender ? forms.flatMap((form) => [form, displayPt({ ...item, pt: form })]) : forms;
}

// Returns "correct", "accent" (right apart from accents) or "wrong".
export function markAnswer(typed, item) {
  const answer = tidy(typed);
  if (!answer) return "wrong";
  const accepted = acceptedAnswers(item).map(tidy);
  if (accepted.includes(answer)) return "correct";
  if (accepted.map(withoutAccents).includes(withoutAccents(answer))) return "accent";
  return "wrong";
}
