// English explanations with Portuguese words marked in the data as *palavra*.
// The marked words are tagged as Portuguese, so they get the Portuguese typeface and are read in a Portuguese voice.
export default function RichText({ text }) {
  return text.split(/\*([^*]+)\*/).map((part, index) =>
    index % 2 === 1 ? <span key={index} className="pt-inline" lang="pt-PT">{part}</span> : part,
  );
}
