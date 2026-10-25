// Question pieces shared by the unit exercises and the level test.

import Icon from "../../components/Icon";

const instructions = {
  "pt-en": "What does this mean?",
  "en-pt": "Pick the Portuguese",
  blank: "Fill the gap",
  "type-gap": "Type the missing word",
  type: "Type this in Portuguese",
};

// Letters English keyboards lack. Optional: a missing accent still counts.
const ACCENTS = ["á", "à", "â", "ã", "ç", "é", "ê", "í", "ó", "ô", "õ", "ú"];

// The prompt: a gapped sentence with its English, or a single word or phrase.
export function QuestionPrompt({ question, filled, state = "" }) {
  const gapped = question.kind === "blank" || question.kind === "type-gap";
  return (
    <>
      <p className="muted">{instructions[question.kind]}</p>
      {gapped ? (
        <div className="gap-sentence">
          <p className="gap-pt" lang="pt-PT">
            {question.before}
            <span className={`gap ${state}`}>{filled || " "}</span>
            {question.after}
          </p>
          <p className="muted">{question.prompt}</p>
        </div>
      ) : (
        <h1 className="flash-word" lang={question.kind === "pt-en" ? "pt-PT" : undefined}>{question.prompt}</h1>
      )}
    </>
  );
}

// Answer options. With `reveal`, marks the right and wrong ones; otherwise just highlights the one picked.
export function Choices({ question, picked, reveal, onPick }) {
  const inPortuguese = question.kind !== "pt-en";
  return (
    <div className="choices" role="group" aria-label="Options">
      {question.options.map((option, index) => {
        let state = option === picked ? "is-picked" : "";
        if (reveal) state = option === question.answer ? "is-correct" : option === picked ? "is-wrong" : "is-dim";
        return (
          <button
            key={option}
            type="button"
            className={`choice ${state}`}
            onClick={() => onPick(option)}
            disabled={reveal}
            aria-pressed={option === picked}
            lang={inPortuguese ? "pt-PT" : undefined}
          >
            <span className="choice-key" aria-hidden="true">{index + 1}</span>
            {option}
          </button>
        );
      })}
    </div>
  );
}

// Text box with a submit button and the accent keys. Put it inside a <form>.
export function AnswerField({ inputRef, value, onChange, result, buttonText }) {
  function addAccent(letter) {
    const field = inputRef.current;
    const start = field.selectionStart ?? value.length;
    const end = field.selectionEnd ?? value.length;
    onChange(value.slice(0, start) + letter + value.slice(end));
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(start + 1, start + 1);
    });
  }

  return (
    <>
      <div className="type-row">
        <input
          ref={inputRef}
          className={`type-input ${result ? `is-${result}` : ""}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          readOnly={Boolean(result)}
          lang="pt-PT"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          aria-label="Your answer in Portuguese"
        />
        <button type="submit" className="btn btn-primary">{buttonText}</button>
      </div>
      {!result && (
        <div className="accent-keys" aria-label="Accented letters">
          {ACCENTS.map((letter) => (
            <button key={letter} type="button" className="accent-key" onClick={() => addAccent(letter)}>{letter}</button>
          ))}
        </div>
      )}
    </>
  );
}

// Green tick or red cross that pops in when an answer is marked.
export function ResultMark({ ok }) {
  return (
    <span className={`result-mark ${ok ? "is-ok" : "is-no"}`} aria-hidden="true">
      <Icon name={ok ? "check" : "cross"} size={18} />
    </span>
  );
}

// Hint under a "type it" prompt.
export function typeHint(item) {
  const kind = item.type === "phrase" ? "phrase" : item.gender ? "noun (article optional)" : "word";
  return [kind, item.formality].filter(Boolean).join(", ");
}
