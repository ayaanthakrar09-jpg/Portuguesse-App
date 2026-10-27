// A small Portuguese flag. Simplified so it stays readable at icon size:
// the coat of arms is reduced to the yellow armillary ring and a white shield.
export default function Flag({ width = 24, className = "" }) {
  return (
    <svg className={`flag ${className}`} width={width} height={(width * 2) / 3} viewBox="0 0 30 20" role="img" aria-label="Portugal">
      <rect width="12" height="20" fill="#046a38" />
      <rect x="12" width="18" height="20" fill="#da291c" />
      <circle cx="12" cy="10" r="4.6" fill="none" stroke="#ffe900" strokeWidth="1.5" />
      <path d="M10.2 7.6h3.6v2.9a1.8 1.8 0 0 1-3.6 0z" fill="#fff" stroke="#da291c" strokeWidth="0.7" />
    </svg>
  );
}
