import { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("grammar");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

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
          <div>
            <label className="label">Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="select">
              <option value="grammar">Grammar</option>
              <option value="rewrite">Rewrite</option>
              <option value="formal">Formal</option>
              <option value="casual">Casual</option>
            </select>
          </div>

          <button onClick={handleSubmit} disabled={loading} className="button">
            {loading ? "Processing..." : "Submit"}
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
      </div>
    </div>
  );
}

export default App;