// Checks on the content files: the same things that used to be checked by hand in the browser
// before each batch was committed. Run with `npm.cmd test`.

import { describe, expect, it } from "vitest";
import config from "./levels.json";
import slang from "./slang/pt-pt.json";
import { allItems } from "../lib/vocab";
import { texts, tokenize } from "../lib/reading";
import { topics } from "../lib/grammar";

const unitIds = new Set(config.levels.flatMap((level) => level.units.map((unit) => unit.id)));
// Brazilian words with a different word in Portugal. A hit is only a warning sign: check the context.
const brazilian = /\b(ônibus|celular|café da manhã|banheiro|geladeira|trem|suco|garota|tela)\b/i;
const unique = (list) => new Set(list).size === list.length;

describe("vocab", () => {
  it("has unique ids and the agreed 1,000 items", () => {
    expect(unique(allItems.map((item) => item.id))).toBe(true);
    expect(allItems).toHaveLength(1000);
  });

  it.each(allItems.map((item) => [item.id, item]))("%s is complete", (id, item) => {
    expect(item.pt && item.en, "pt and en").toBeTruthy();
    expect(unitIds.has(item.unit), `unit ${item.unit}`).toBe(true);
    expect(item.example?.pt && item.example?.en, "example").toBeTruthy();
    if (item.blank) expect(item.example.pt, "the gap word is in the example").toContain(item.blank);
    if (item.gender) expect(["m", "f"]).toContain(item.gender);
    expect(typeof item.verified).toBe("boolean");
    expect(JSON.stringify(item)).not.toMatch(brazilian);
  });
});

describe("reading", () => {
  it("has unique ids", () => {
    expect(unique(texts.map((text) => text.id))).toBe(true);
  });

  it.each(texts.map((text) => [text.id, text]))("%s", (id, text) => {
    const words = new Set(text.paragraphs.flatMap(tokenize).filter((t) => t.isWord).map((t) => t.text.toLowerCase()));
    const glossed = Object.keys(text.glossary);
    expect([...words].filter((word) => !(word in text.glossary)), "words with no meaning").toEqual([]);
    expect(glossed.filter((word) => !words.has(word)), "glossary words not in the text").toEqual([]);

    const body = text.paragraphs.join(" ");
    for (const q of text.questions) {
      if (q.type === "tf") expect(typeof q.answer, q.question).toBe("boolean");
      else expect(q.options[q.answer], q.question).toBeDefined();
      if (q.why) expect(body, "the 'why' quote is in the text").toContain(q.why);
    }
    expect(typeof text.verified).toBe("boolean");
  });
});

describe("grammar", () => {
  it("has unique topic ids", () => {
    expect(unique(topics.map((topic) => topic.id))).toBe(true);
  });

  it.each(topics.map((topic) => [topic.id, topic]))("%s has usable drills", (id, topic) => {
    expect(topic.drills.length).toBeGreaterThan(0);
    for (const drill of topic.drills) {
      expect(typeof drill.answer === "string" && drill.answer.trim(), JSON.stringify(drill)).toBeTruthy();
      if (drill.type === "choice") expect(drill.options, JSON.stringify(drill)).toContain(drill.answer);
      if (drill.type === "rewrite") expect(drill.from, JSON.stringify(drill)).toBeTruthy();
    }
  });
});

describe("slang", () => {
  const groups = new Set(slang.groups.map((group) => group.id));

  it("has unique ids", () => {
    expect(unique(slang.items.map((item) => item.id))).toBe(true);
  });

  it.each(slang.items.map((item) => [item.id, item]))("%s is labelled", (id, item) => {
    expect(groups.has(item.group), `group ${item.group}`).toBe(true);
    expect(["formal", "neutral", "informal", "rude", "very rude"]).toContain(item.formality);
    expect(item.region, "region").toBeTruthy();
    expect(["high", "medium", "low"]).toContain(item.confidence);
    expect(typeof item.verified).toBe("boolean");
  });
});
