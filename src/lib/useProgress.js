import { useCallback, useState } from "react";
import { loadProgress, saveProgress } from "./storage";

// Gives components the saved progress plus an `update` function that saves every change.
export function useProgress() {
  const [progress, setProgress] = useState(loadProgress);

  const update = useCallback((change) => {
    setProgress((previous) => {
      const next = typeof change === "function" ? change(previous) : change;
      saveProgress(next);
      return next;
    });
  }, []);

  return [progress, update];
}
