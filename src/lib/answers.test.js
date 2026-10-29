import { describe, expect, it } from "vitest";
import { acceptedAnswers, markAnswer, markText } from "./answers";

describe("markText", () => {
  it("forgives capitals, spaces and punctuation", () => {
    expect(markText("  Bom   DIA! ", ["bom dia"])).toBe("correct");
    expect(markText("tudo bem", ["Tudo bem?"])).toBe("correct");
  });

  it("calls a missing accent nearly right, not wrong", () => {
    expect(markText("pequeno-almoco", ["pequeno-almoço"])).toBe("accent");
    expect(markText("voce", ["você"])).toBe("accent");
  });

  it("keeps hyphens, so a missing one is a mistake", () => {
    expect(markText("chamo-me", ["chamo-me"])).toBe("correct");
    expect(markText("chamo me", ["chamo-me"])).toBe("wrong");
  });

  it("is strict about different words and empty answers", () => {
    expect(markText("boa noite", ["boa tarde"])).toBe("wrong");
    expect(markText("", ["olá"])).toBe("wrong");
    expect(markText("   ", ["olá"])).toBe("wrong");
  });

  it("treats accents typed as separate characters like normal ones", () => {
    const decomposed = "café"; // e followed by a combining accent
    expect(markText(decomposed, ["café"])).toBe("correct");
  });
});

describe("markAnswer", () => {
  const noun = { pt: "pão", gender: "m" };
  const adjective = { pt: "cansado", alternatives: ["cansada"] };

  it("accepts a noun with or without its article", () => {
    expect(markAnswer("pão", noun)).toBe("correct");
    expect(markAnswer("o pão", noun)).toBe("correct");
    expect(markAnswer("a pão", noun)).toBe("wrong");
  });

  it("accepts listed alternatives and nothing else", () => {
    expect(markAnswer("cansada", adjective)).toBe("correct");
    expect(markAnswer("cansados", adjective)).toBe("wrong");
  });

  it("lists each accepted spelling", () => {
    expect(acceptedAnswers(noun)).toEqual(["pão", "o pão"]);
    expect(acceptedAnswers(adjective)).toEqual(["cansado", "cansada"]);
  });
});
