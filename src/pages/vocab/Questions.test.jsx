// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRef, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnswerField, Choices, WordTiles } from "./Questions";

afterEach(cleanup);

function TypedAnswer({ result = null }) {
  const inputRef = useRef(null);
  const [value, setValue] = useState("");
  return <AnswerField inputRef={inputRef} value={value} onChange={setValue} result={result} buttonText="Check" />;
}

describe("AnswerField", () => {
  it("types accents from the buttons where the cursor is", async () => {
    const user = userEvent.setup();
    render(<TypedAnswer />);
    const input = screen.getByLabelText("Your answer in Portuguese");
    await user.type(input, "caf");
    await user.click(screen.getByRole("button", { name: "é" }));
    expect(input).toHaveValue("café");
  });

  it("locks the answer and hides the accents once marked", () => {
    render(<TypedAnswer result="wrong" />);
    expect(screen.getByLabelText("Your answer in Portuguese")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "é" })).not.toBeInTheDocument();
  });
});

describe("Choices", () => {
  const question = { kind: "pt-en", answer: "thank you", options: ["hello", "thank you", "please", "sorry"] };

  it("reports the option picked", async () => {
    const onPick = vi.fn();
    render(<Choices question={question} picked={null} reveal={false} onPick={onPick} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /please/ }));
    expect(onPick).toHaveBeenCalledWith("please");
  });

  it("shows the right and wrong answers after checking, and can't be changed", () => {
    render(<Choices question={question} picked="please" reveal onPick={() => {}} />);
    expect(screen.getByRole("button", { name: /thank you/ })).toHaveClass("is-correct");
    expect(screen.getByRole("button", { name: /please/ })).toHaveClass("is-wrong");
    expect(screen.getByRole("button", { name: /hello/ })).toHaveClass("is-dim");
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });
});

describe("WordTiles", () => {
  function Tiles() {
    const [chosen, setChosen] = useState([]);
    const tiles = [{ id: 0, text: "bom" }, { id: 1, text: "dia" }, { id: 2, text: "noite" }];
    return <WordTiles question={{ tiles }} chosen={chosen} onChange={setChosen} result={null} />;
  }

  it("moves a tapped word into the sentence and back out", async () => {
    const user = userEvent.setup();
    render(<Tiles />);
    const sentence = screen.getByLabelText("Your sentence");
    const pool = screen.getByLabelText("Words to use");
    await user.click(screen.getByRole("button", { name: "dia" }));
    await user.click(screen.getByRole("button", { name: "bom" }));
    const words = (element) => within(element).queryAllByRole("button").map((button) => button.textContent);
    expect(words(sentence)).toEqual(["dia", "bom"]);
    expect(words(pool)).toEqual(["noite"]);
    await user.click(screen.getByRole("button", { name: "dia" }));
    expect(words(sentence)).toEqual(["bom"]);
    expect(words(pool)).toEqual(["dia", "noite"]);
  });
});
