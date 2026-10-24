import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ComingSoon from "./pages/ComingSoon";
import VocabHome from "./pages/vocab/VocabHome";
import LevelPage from "./pages/vocab/LevelPage";
import FlashcardSession from "./pages/vocab/FlashcardSession";
import TypingSession from "./pages/vocab/TypingSession";
import { useProgress } from "./lib/useProgress";

// Sections that are not built yet show an honest "coming" page instead of a fake screen.
const upcoming = [
  {
    path: "/speaking",
    title: "Speaking",
    milestone: 3,
    text: "Hear a sentence, say it into your microphone, and see which words the browser understood.",
  },
  {
    path: "/reading",
    title: "Reading",
    milestone: 4,
    text: "Short European Portuguese texts. Tap any word for its meaning, then answer a few questions.",
  },
  {
    path: "/slang",
    title: "Slang",
    milestone: 5,
    text: "Everyday expressions, labelled formal, informal or rude, with when and where people say them.",
  },
];

export default function App() {
  const [progress, updateProgress] = useProgress();

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard progress={progress} updateProgress={updateProgress} />} />
          <Route path="/vocab" element={<VocabHome progress={progress} />} />
          <Route path="/vocab/level/:levelId" element={<LevelPage progress={progress} />} />
          <Route path="/vocab/unit/:unitId" element={<FlashcardSession progress={progress} updateProgress={updateProgress} />} />
          <Route path="/vocab/unit/:unitId/type" element={<TypingSession progress={progress} updateProgress={updateProgress} />} />
          <Route path="/vocab/review" element={<FlashcardSession review progress={progress} updateProgress={updateProgress} />} />
          {upcoming.map((page) => (
            <Route key={page.path} path={page.path} element={<ComingSoon {...page} />} />
          ))}
          <Route path="*" element={<ComingSoon title="Page not found" text="That page doesn't exist. Use the menu to go back." />} />
        </Routes>
      </main>
    </div>
  );
}
