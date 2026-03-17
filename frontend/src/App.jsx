import { useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("grammar");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("Please enter some text.");
      return;
    }

    setLoading(true);
    setResult("");

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

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", padding: "20px", fontFamily: "Arial" }}>
      <h1>Grammar App</h1>
      <p>Paste your text below and choose a mode.</p>

      <textarea
        rows="10"
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
        placeholder="Paste your text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <label>Select mode: </label>
        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="grammar">Grammar</option>
          <option value="rewrite">Rewrite</option>
          <option value="formal">Formal</option>
          <option value="casual">Casual</option>
        </select>
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
        {loading ? "Processing..." : "Submit"}
      </button>

      <h2 style={{ marginTop: "30px" }}>Result</h2>
      <div
        style={{
          whiteSpace: "pre-wrap",
          border: "1px solid #ccc",
          padding: "15px",
          minHeight: "120px",
          borderRadius: "8px",
          backgroundColor: "#f9f9f9"
        }}
      >
        {result}
      </div>
    </div>
  );
}

export default App;