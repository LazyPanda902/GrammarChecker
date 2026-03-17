import { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("grammar");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("Please enter some text.");
      return;
    }

    setLoading(true);
    setResult("");
    setCopied(false);

    try {
      const response = await fetch("http://localhost:5000/api/grammar-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text, mode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data.result);

      const historyItem = {
        id: Date.now(),
        mode,
        originalText: text,
        resultText: data.result
      };

      setHistory((prev) => [historyItem, ...prev].slice(0, 5));
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result || result.startsWith("Error:")) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      alert("Copy failed.");
    }
  };

  const handleClear = () => {
    setText("");
    setResult("");
    setCopied(false);
    setMode("grammar");
  };

  const handleUseHistory = (item) => {
    setText(item.originalText);
    setMode(item.mode);
    setResult(item.resultText);
    setCopied(false);
  };

  const handleDeleteHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="app-shell">
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      <main className="app-container">
        <section className="hero-panel">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Refined Writing Studio
          </div>

          <h1 className="hero-title">Grammar App</h1>
          <p className="hero-subtitle">
            Improve grammar, rewrite with clarity, and shape your tone in a calm, premium workspace.
          </p>
        </section>

        <section className="glass-panel">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">Workspace</p>
              <h2 className="section-title">Write with precision</h2>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">Your text</label>
            <textarea
              rows="10"
              className="text-input"
              placeholder="Paste your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="control-row">
            <div className="field-group mode-group">
              <label className="field-label">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="select-input"
              >
                <option value="grammar">Grammar</option>
                <option value="rewrite">Rewrite</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
              </select>
            </div>

            <div className="button-row">
              <button onClick={handleSubmit} disabled={loading} className="btn btn-primary">
                {loading ? "Processing..." : "Submit"}
              </button>

              <button onClick={handleClear} className="btn btn-secondary">
                Clear
              </button>
            </div>
          </div>
        </section>

        <section className="glass-panel result-panel">
          <div className="section-heading result-heading">
            <div>
              <p className="section-eyebrow">Output</p>
              <h2 className="section-title">Refined output</h2>
            </div>

            <button
              onClick={handleCopy}
              disabled={!result || result.startsWith("Error:")}
              className="btn btn-primary copy-btn"
            >
              {copied ? "Copied!" : "Copy Result"}
            </button>
          </div>

          <div className="result-box">
            {result || "Your improved text will appear here."}
          </div>
        </section>

        <section className="glass-panel history-panel">
          <div className="section-heading history-heading">
            <div>
              <p className="section-eyebrow">Archive</p>
              <h2 className="section-title">Recent sessions</h2>
            </div>

            <div className="history-meta">
              {history.length > 0 ? `${history.length} saved` : "No saved items yet"}
            </div>
          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              Your recent requests will appear here once you start processing text.
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <article key={item.id} className="history-card">
                  <div className="history-card-top">
                    <span className="history-tag">{item.mode}</span>

                    <div className="history-actions">
                      <button
                        onClick={() => handleUseHistory(item)}
                        className="btn btn-small btn-secondary"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="btn btn-small btn-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="history-content-grid">
                    <div className="history-block">
                      <p className="history-label">Original</p>
                      <p className="history-text">{item.originalText}</p>
                    </div>

                    <div className="history-block">
                      <p className="history-label">Result</p>
                      <p className="history-text">{item.resultText}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;