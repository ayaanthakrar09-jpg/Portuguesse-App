import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* HashRouter keeps page links working on simple hosts like GitHub Pages */}
    {/* Last resort, if the whole app fails rather than one page (App.jsx has the per-page one). */}
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
);
