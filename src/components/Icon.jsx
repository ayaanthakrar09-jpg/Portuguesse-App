// Small shared set of line icons so every screen looks consistent.
const paths = {
  home: "M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z",
  vocab: "M5 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zM9 9h6M9 13h4",
  speaking: "M12 4a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V7a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v3",
  reading: "M4 5.5C6.5 4.5 9.5 4.5 12 6c2.5-1.5 5.5-1.5 8-.5V18c-2.5-1-5.5-1-8 .5-2.5-1.5-5.5-1.5-8-.5z",
  grammar: "M5 7h14M5 12h10M5 17h6M17 15.5l1.5 1.5 3-3.5",
  slang: "M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-8l-4 3.5V16H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z",
  tutor: "M4 6a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9l-3 2.5V13H5a1 1 0 0 1-1-1zM15 9h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1v2.5L15 17h-4a1 1 0 0 1-1-1v-3",
  speaker: "M5 10v4h3l4 3.5v-11L8 10zM16 9.5a4 4 0 0 1 0 5M18.5 7a7.5 7.5 0 0 1 0 10",
  check: "m5 12.5 4.5 4.5L19 7.5",
  cross: "M6.5 6.5l11 11M17.5 6.5l-11 11",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 19h14",
  upload: "M12 16V5m0 0-4 4m4-4 4 4M5 19h14",
  chevron: "m9 6 6 6-6 6",
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
