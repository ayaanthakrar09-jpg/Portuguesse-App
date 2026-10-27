// All Vocab content in one place. To add a level: create src/data/vocab/level-N.json,
// import it below and list the level (with its units) in levels.json.

import config from "../data/levels.json";
import level1 from "../data/vocab/level-1.json";
import level2 from "../data/vocab/level-2.json";
import level3 from "../data/vocab/level-3.json";
import level4 from "../data/vocab/level-4.json";
import level5 from "../data/vocab/level-5.json";
import level6 from "../data/vocab/level-6.json";
import level7 from "../data/vocab/level-7.json";
import level8 from "../data/vocab/level-8.json";
import level9 from "../data/vocab/level-9.json";
import level10 from "../data/vocab/level-10.json";
import level11 from "../data/vocab/level-11.json";
import level12 from "../data/vocab/level-12.json";
import level13 from "../data/vocab/level-13.json";
import level14 from "../data/vocab/level-14.json";
import level15 from "../data/vocab/level-15.json";
import level16 from "../data/vocab/level-16.json";

const itemsByLevel = { 1: level1, 2: level2, 3: level3, 4: level4, 5: level5, 6: level6, 7: level7, 8: level8, 9: level9, 10: level10, 11: level11, 12: level12, 13: level13, 14: level14, 15: level15, 16: level16 };

export const passMark = config.passMark;

// Only levels that have content are shown. Each unit carries its own items.
export const levels = config.levels
  .filter((level) => itemsByLevel[level.id])
  .map((level) => ({
    ...level,
    units: level.units.map((unit, index) => ({
      ...unit,
      number: index + 1,
      level: level.id,
      items: itemsByLevel[level.id].filter((item) => item.unit === unit.id),
    })),
  }));

export const allItems = levels.flatMap((level) => level.units.flatMap((unit) => unit.items));

export function findLevel(id) {
  return levels.find((level) => level.id === Number(id));
}

export function findUnit(id) {
  return levels.flatMap((level) => level.units).find((unit) => unit.id === id);
}

// Level 1 is always open; any other level opens once the previous level's test is passed.
export function isLevelOpen(levelId, passedLevels) {
  return levelId === 1 || passedLevels.includes(levelId - 1);
}

export function openItems(passedLevels) {
  return levels.filter((level) => isLevelOpen(level.id, passedLevels)).flatMap((level) => level.units.flatMap((unit) => unit.items));
}

// Nouns are stored without their article; show them with it ("o pão").
export function displayPt(item) {
  if (item.gender === "m") return `o ${item.pt}`;
  if (item.gender === "f") return `a ${item.pt}`;
  return item.pt;
}

export const genderText = { m: "masculine", f: "feminine" };
