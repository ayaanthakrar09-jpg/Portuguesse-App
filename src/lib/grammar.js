// Grammar topics, grouped into stages. Every drill sentence is written by hand in the data files; nothing is generated.
// To add a stage: create a JSON file of topics in src/data/grammar/ and list it below.

import present from "../data/grammar/present.json";
import basics from "../data/grammar/basics.json";
import patterns from "../data/grammar/patterns.json";
import past from "../data/grammar/past.json";
import { shuffle } from "./exercises";

const stageList = [
  { id: "present", title: "Present tense", summary: "The verbs you'll use most, then the regular patterns and common irregular verbs.", topics: present },
  { id: "basics", title: "Building blocks", summary: "Gender and plurals, the little words that join together, my and your, this and that.", topics: basics },
  { id: "patterns", title: "Everyday patterns", summary: "Reflexive verbs, what's happening now, verbs that team up with other verbs, and ficar.", topics: patterns },
  { id: "past", title: "Past tense", summary: "What happened: regular verbs, then the common irregular ones.", topics: past },
];

// Topics are numbered straight through all stages.
let number = 0;
export const stages = stageList.map((stage) => ({
  ...stage,
  topics: stage.topics.map((topic) => ({ ...topic, number: (number += 1) })),
}));

export const topics = stages.flatMap((stage) => stage.topics);

export function findTopic(id) {
  return topics.find((topic) => topic.id === id);
}

// The hint shown after a question: the drill's own hint or verb, otherwise the topic's verb.
// Topics about words rather than one verb ("focus": "word") only show a drill's own hint.
// Practice order gets harder: verb forms, then whole sentences, then "rewrite" (a sentence to change, e.g. to the past).
// "Choose" drills come last, in random order.
export function practiceQuestions(topic) {
  const forms = shuffle(topic.drills.filter((d) => d.type === "form"));
  const sentences = shuffle(topic.drills.filter((d) => d.type === "sentence"));
  const rewrites = shuffle(topic.drills.filter((d) => d.type === "rewrite"));
  const choices = shuffle(topic.drills.filter((d) => d.type === "choice")).map((d) => ({ ...d, options: shuffle(d.options) }));
  const topicHint = topic.focus === "word" ? null : topic.title;
  return [...forms, ...sentences, ...rewrites, ...choices].map((drill, index) => ({
    ...drill,
    key: `${topic.id}-${index}`,
    hint: drill.hint ?? drill.verb ?? topicHint,
  }));
}
