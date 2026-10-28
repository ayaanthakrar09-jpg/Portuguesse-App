// Reading texts, two per Vocab level. To add more: create src/data/reading/level-N.json and import it below.

import level1 from "../data/reading/level-1.json";
import level2 from "../data/reading/level-2.json";
import level3 from "../data/reading/level-3.json";
import level4 from "../data/reading/level-4.json";
import level5 from "../data/reading/level-5.json";
import level6 from "../data/reading/level-6.json";
import level7 from "../data/reading/level-7.json";
import level8 from "../data/reading/level-8.json";
import level9 from "../data/reading/level-9.json";
import level10 from "../data/reading/level-10.json";
import level11 from "../data/reading/level-11.json";
import level12 from "../data/reading/level-12.json";
import level13 from "../data/reading/level-13.json";

export const texts = [
  ...level1, ...level2, ...level3, ...level4, ...level5, ...level6, ...level7, ...level8, ...level9,
  ...level10, ...level11, ...level12, ...level13,
];

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
