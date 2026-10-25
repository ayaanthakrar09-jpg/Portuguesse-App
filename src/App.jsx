import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ComingSoon from "./pages/ComingSoon";
import VocabHome from "./pages/vocab/VocabHome";
import LevelPage from "./pages/vocab/LevelPage";
import FlashcardSession from "./pages/vocab/FlashcardSession";
import TypingSession from "./pages/vocab/TypingSession";
import ChoiceSession from "./pages/vocab/ChoiceSession";
import LevelTest from "./pages/vocab/LevelTest";
import SpeakingHome from "./pages/speaking/SpeakingHome";
import SpeakingSession from "./pages/speaking/SpeakingSession";
import { useProgress } from "./lib/useProgress";

// Sections that are not built yet show an honest "coming" page instead of a fake screen.
const upcoming = [
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
          <Route path="/vocab/level/:levelId/test" element={<LevelTest progress={progress} updateProgress={updateProgress} />} />
          <Route path="/vocab/unit/:unitId" element={<FlashcardSession progress={progress} updateProgress={updateProgress} />} />
          <Route path="/vocab/unit/:unitId/choose" element={<ChoiceSession progress={progress} updateProgress={updateProgress} />} />
          <Route path="/vocab/unit/:unitId/type" element={<TypingSession progress={progress} updateProgress={updateProgress} />} />
          <Route path="/speaking" element={<SpeakingHome progress={progress} />} />
          <Route path="/speaking/:unitId" element={<SpeakingSession progress={progress} updateProgress={updateProgress} />} />
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
