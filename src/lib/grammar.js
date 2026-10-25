// Grammar topics. Every drill sentence is written by hand in the data file; nothing is generated.

import present from "../data/grammar/present.json";
import { shuffle } from "./exercises";

export const topics = present.map((topic, index) => ({ ...topic, number: index + 1 }));

export function findTopic(id) {
  return topics.find((topic) => topic.id === id);
}

// Practice order gets harder: verb forms first, then whole sentences. "Choose" drills are mixed in random order.
export function practiceQuestions(topic) {
  const forms = shuffle(topic.drills.filter((d) => d.type === "form"));
  const sentences = shuffle(topic.drills.filter((d) => d.type === "sentence"));
  const choices = shuffle(topic.drills.filter((d) => d.type === "choice")).map((d) => ({ ...d, options: shuffle(d.options) }));
  return [...forms, ...sentences, ...choices].map((drill, index) => ({ ...drill, key: `${topic.id}-${index}`, verb: topic.title }));
}
