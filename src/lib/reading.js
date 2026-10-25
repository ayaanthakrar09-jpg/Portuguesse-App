// Reading texts. To add more: create src/data/reading/level-N.json and import it below.

import level1 from "../data/reading/level-1.json";

export const texts = [...level1];

export function findText(id) {
  return texts.find((text) => text.id === id);
}

// Splits a paragraph into words (letters, accents, hyphens: "chamo-me") and the bits between them.
export function tokenize(paragraph) {
  return paragraph.split(/([\p{L}]+(?:-[\p{L}]+)*)/u).filter(Boolean).map((piece) => ({
    text: piece,
    isWord: /^\p{L}/u.test(piece),
  }));
}

export function meaning(text, word) {
  return text.glossary[word.toLowerCase()];
}

export function wordCount(text) {
  return text.paragraphs.flatMap(tokenize).filter((token) => token.isWord).length;
}
