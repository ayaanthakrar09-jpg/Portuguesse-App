// If a page crashes, show a way out instead of a blank screen: reload, keep a copy of the saved
// progress, or (after a warning) start fresh. Moving to another page clears the error (`resetKey`).

import { Component, useState } from "react";
import { clearProgress, exportBackup, rawSavedProgress } from "../lib/storage";

export default class ErrorBoundary extends Component {
  state = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error) {
    return { error };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey === state.resetKey ? null : { error: null, resetKey: props.resetKey };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    return this.state.error ? <ErrorScreen error={this.state.error} /> : this.props.children;
  }
}

function ErrorScreen({ error }) {
  const [confirming, setConfirming] = useState(false);
  const saved = rawSavedProgress();

  function startFresh() {
    clearProgress();
    window.location.reload();
  }

  return (
    <section className="page" role="alert">
      <h1 className="page-title">Something went wrong</h1>
      <div className="card error-card">
        <p>This page hit a problem and couldn't open. Your progress is still saved in this browser.</p>
        <p className="muted">Reloading usually fixes it. If it keeps happening, download a copy of your progress first, then start fresh and restore the copy from Home.</p>
        <div className="error-actions">
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Reload</button>
          <a href="#/" className="btn" onClick={() => setTimeout(() => window.location.reload())}>Go to Home</a>
          {saved && <button type="button" className="btn" onClick={() => exportBackup(saved)}>Download my progress</button>}
        </div>
        {saved && (
          <div className="error-reset">
            {confirming ? (
              <>
                <p>This deletes all progress saved in this browser. Download a copy first if you want to keep it.</p>
                <div className="error-actions">
                  <button type="button" className="btn btn-danger" onClick={startFresh}>Delete progress and start fresh</button>
                  <button type="button" className="btn btn-quiet" onClick={() => setConfirming(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <button type="button" className="btn btn-quiet" onClick={() => setConfirming(true)}>Start fresh…</button>
            )}
          </div>
        )}
        <details className="muted">
          <summary>Details for whoever fixes it</summary>
          <code>{String(error?.message ?? error)}</code>
        </details>
      </div>
    </section>
  );
}
