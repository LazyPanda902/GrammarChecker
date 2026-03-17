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
    <div className="app">
      <div className="card">
        <h1>Grammar App</h1>
        <p className="subtitle">
          Fix grammar, rewrite text, and switch between formal or casual tone.
        </p>

        <label className="label">Your text</label>
        <textarea
          rows="10"
          className="textarea"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="controls">
          <div className="mode-box">
            <label className="label">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="select"
            >
              <option value="grammar">Grammar</option>
              <option value="rewrite">Rewrite</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="button">
            {loading ? "Processing..." : "Submit"}
          </button>

          <button onClick={handleClear} className="button secondary-button">
            Clear
          </button>
        </div>

        <div className="result-header">
          <h2>Result</h2>
          <button
            onClick={handleCopy}
            disabled={!result || result.startsWith("Error:")}
            className="copy-button"
          >
            {copied ? "Copied!" : "Copy Result"}
          </button>
        </div>

        <div className="result">
          {result || "Your improved text will appear here."}
        </div>

        <div className="history-section">
          <div className="history-header">
            <h2>Recent History</h2>
            {history.length > 0 && (
              <span className="history-count">{history.length} saved</span>
            )}
          </div>

          {history.length === 0 ? (
            <div className="history-empty">
              No history yet. Your recent results will show here.
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-top">
                    <span className="history-mode">{item.mode}</span>
                    <div className="history-actions">
                      <button
                        onClick={() => handleUseHistory(item)}
                        className="small-button"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="small-button delete-button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="history-block">
                    <p className="history-label">Original</p>
                    <p className="history-text">{item.originalText}</p>
                  </div>

                  <div className="history-block">
                    <p className="history-label">Result</p>
                    <p className="history-text">{item.resultText}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;