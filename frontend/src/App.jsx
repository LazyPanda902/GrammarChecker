import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import logo from "./assets/grammarchecker_logo.png";

const TABS = {
  EDITOR: "editor",
  HISTORY: "history",
  SETTINGS: "settings"
};

function App() {
  const [activeTab, setActiveTab] = useState(TABS.EDITOR);
  const [text, setText] = useState("");
  const [mode, setMode] = useState("grammar");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(false);
  const [validatingKey, setValidatingKey] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsState, setSettingsState] = useState({
    provider: "gemini",
    model: "gemini-2.5-flash",
    hasApiKey: false,
    apiKeyStatus: "missing",
    lastValidatedAt: null
  });

  const currentHistoryRef = useRef(null);
  const displayQueueRef = useRef([]);
  const finalResultRef = useRef("");
  const streamFinishedRef = useRef(false);
  const revealTimerRef = useRef(null);

  const needsSetup = useMemo(() => !settingsState.hasApiKey, [settingsState.hasApiKey]);

  const loadSettings = async () => {
    try {
      const settings = await window.grammarAPI.getSettings();
      setSettingsState(settings);

      if (!settings.hasApiKey) {
        setActiveTab(TABS.SETTINGS);
      }
    } catch (error) {
      setSettingsMessage("Failed to load app settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await window.grammarAPI.getHistory();

      if (response?.success) {
        setHistory(Array.isArray(response.history) ? response.history : []);
      } else {
        setHistory([]);
      }
    } catch (error) {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadSettings();
    loadHistory();
  }, []);

  const refreshSettings = async () => {
    const settings = await window.grammarAPI.getSettings();
    setSettingsState(settings);
  };

  const splitIntoRevealTokens = (textChunk) => {
    return textChunk.match(/\S+\s*|\s+/g) || [];
  };

  const stopRevealLoop = () => {
    if (revealTimerRef.current) {
      clearInterval(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  };

  const maybeFinishStream = async () => {
    if (!streamFinishedRef.current) return;
    if (displayQueueRef.current.length > 0) return;

    stopRevealLoop();
    setStreaming(false);
    setLoading(false);
    setCopied(false);

    const finalResult = finalResultRef.current || "";

    if (currentHistoryRef.current && finalResult && !finalResult.startsWith("Error:")) {
      const historyItem = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        mode: currentHistoryRef.current.mode,
        originalText: currentHistoryRef.current.originalText,
        resultText: finalResult
      };

      const saveResponse = await window.grammarAPI.saveHistory(historyItem);

      if (saveResponse?.success) {
        setHistory((prev) => [historyItem, ...prev]);
      }
    }

    currentHistoryRef.current = null;
  };

  const startRevealLoop = () => {
    if (revealTimerRef.current) return;

    revealTimerRef.current = setInterval(async () => {
      if (displayQueueRef.current.length === 0) {
        await maybeFinishStream();
        return;
      }

      const nextToken = displayQueueRef.current.shift();

      setResult((prev) => prev + nextToken);
    }, 16);
  };

  const resetStreamingState = () => {
    stopRevealLoop();
    displayQueueRef.current = [];
    finalResultRef.current = "";
    streamFinishedRef.current = false;
  };

  useEffect(() => {
    const removeChunkListener = window.grammarAPI.onStreamChunk((payload) => {
      const chunkText = payload?.text || "";

      if (!chunkText) return;

      displayQueueRef.current.push(...splitIntoRevealTokens(chunkText));
      finalResultRef.current += chunkText;
      startRevealLoop();
    });

    const removeDoneListener = window.grammarAPI.onStreamDone(async (payload) => {
      if (payload?.result && !finalResultRef.current) {
        finalResultRef.current = payload.result;
        displayQueueRef.current.push(...splitIntoRevealTokens(payload.result));
        startRevealLoop();
      }

      streamFinishedRef.current = true;
      await maybeFinishStream();
    });

    const removeErrorListener = window.grammarAPI.onStreamError((payload) => {
      resetStreamingState();
      currentHistoryRef.current = null;
      setStreaming(false);
      setLoading(false);
      setCopied(false);
      setResult(`Error: ${payload?.error || "Something went wrong."}`);
    });

    return () => {
      removeChunkListener();
      removeDoneListener();
      removeErrorListener();
      stopRevealLoop();
    };
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) {
      alert("Please enter text first.");
      return;
    }

    if (needsSetup) {
      setActiveTab(TABS.SETTINGS);
      setSettingsMessage("Add your Gemini API key before using the editor.");
      return;
    }

    resetStreamingState();
    currentHistoryRef.current = {
      originalText: text.trim(),
      mode
    };

    setLoading(true);
    setStreaming(true);
    setCopied(false);
    setResult("");

    try {
      const response = await window.grammarAPI.startGrammarStream({
        text,
        mode
      });

      if (!response?.success) {
        resetStreamingState();
        currentHistoryRef.current = null;
        setStreaming(false);
        setLoading(false);
        setResult(`Error: ${response?.error || "Unable to process text."}`);
      }
    } catch (error) {
      resetStreamingState();
      currentHistoryRef.current = null;
      setStreaming(false);
      setLoading(false);
      setResult("Error: Failed to process text.");
    }
  };

  const handleCopy = async () => {
    if (!result || result.startsWith("Error:")) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch (error) {
      alert("Copy failed.");
    }
  };

  const handleClear = () => {
    resetStreamingState();
    currentHistoryRef.current = null;
    setText("");
    setResult("");
    setCopied(false);
    setMode("grammar");
    setStreaming(false);
    setLoading(false);
  };

  const handleUseHistory = (item) => {
    resetStreamingState();
    currentHistoryRef.current = null;
    setText(item.originalText);
    setMode(item.mode);
    setResult(item.resultText);
    setCopied(false);
    setStreaming(false);
    setLoading(false);
    setActiveTab(TABS.EDITOR);
  };

  const handleDeleteHistory = async (id) => {
    const response = await window.grammarAPI.deleteHistory(id);

    if (response?.success) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleClearHistory = async () => {
    if (history.length === 0) return;

    const confirmed = window.confirm("Clear all saved history?");
    if (!confirmed) return;

    const response = await window.grammarAPI.clearHistory();

    if (response?.success) {
      setHistory([]);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setSettingsMessage("Please enter your Gemini API key.");
      return;
    }

    setSavingKey(true);
    setSettingsMessage("");

    try {
      const response = await window.grammarAPI.saveApiKey(apiKeyInput);

      if (!response.success) {
        throw new Error(response.error || "Failed to save API key.");
      }

      setApiKeyInput("");
      await refreshSettings();

      if (response.validation?.success) {
        setSettingsMessage("API key saved and validated successfully.");
        setActiveTab(TABS.EDITOR);
      } else {
        setSettingsMessage("API key saved, but validation failed.");
      }
    } catch (error) {
      setSettingsMessage(error.message || "Failed to save API key.");
    } finally {
      setSavingKey(false);
    }
  };

  const handleValidateApiKey = async () => {
    setValidatingKey(true);
    setSettingsMessage("");

    try {
      const response = await window.grammarAPI.validateApiKey();

      if (response.success) {
        setSettingsMessage("API key is valid and ready to use.");
      } else {
        setSettingsMessage(response.error || "API key validation failed.");
      }

      await refreshSettings();
    } catch (error) {
      setSettingsMessage("Validation failed.");
    } finally {
      setValidatingKey(false);
    }
  };

  const handleClearApiKey = async () => {
    try {
      await window.grammarAPI.clearApiKey();
      await refreshSettings();
      setSettingsMessage("Saved API key removed.");
      setActiveTab(TABS.SETTINGS);
    } catch (error) {
      setSettingsMessage("Failed to clear saved API key.");
    }
  };

  const renderStatusText = () => {
    if (settingsState.apiKeyStatus === "valid") return "Valid";
    if (settingsState.apiKeyStatus === "invalid") return "Invalid";
    if (settingsState.apiKeyStatus === "saved") return "Saved";
    return "Missing";
  };

  if (settingsLoading) {
    return (
      <div className="app-shell">
        <main className="app-container">
          <div className="glass-panel loading-panel">Loading GrammarChecker...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="ambient-orb orb-1"></div>
      <div className="ambient-orb orb-2"></div>

      <main className="app-container">
        <section className="hero-panel">
          <div className="hero-logo-wrap">
            <div className="hero-logo-glow"></div>
            <img src={logo} alt="GrammarChecker logo" className="hero-logo" />
          </div>

          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Refined Writing Studio
          </div>

          <h1 className="hero-title">GrammarChecker</h1>
          <p className="hero-subtitle">
            Improve grammar, rewrite with clarity, and shape your tone in a calm,
            premium workspace.
          </p>
        </section>

        <section className="glass-panel topbar-panel">
          <div className="tab-row">
            <button
              className={`tab-button ${activeTab === TABS.EDITOR ? "active" : ""}`}
              onClick={() => setActiveTab(TABS.EDITOR)}
            >
              Editor
            </button>
            <button
              className={`tab-button ${activeTab === TABS.HISTORY ? "active" : ""}`}
              onClick={() => setActiveTab(TABS.HISTORY)}
            >
              History
            </button>
            <button
              className={`tab-button ${activeTab === TABS.SETTINGS ? "active" : ""}`}
              onClick={() => setActiveTab(TABS.SETTINGS)}
            >
              Settings
            </button>
          </div>

          <div className="status-pill-row">
            <div className={`status-pill status-${settingsState.apiKeyStatus}`}>
              API: {renderStatusText()}
            </div>
            <div className="status-pill neutral-pill">
              Model: {settingsState.model}
            </div>
          </div>
        </section>

        {needsSetup && (
          <section className="glass-panel onboarding-panel">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">First Launch</p>
                <h2 className="section-title">Set up your Gemini API key</h2>
              </div>
            </div>

            <p className="helper-text">
              This app stores your key locally and checks whether it is valid before use.
              Add your Gemini API key in Settings to unlock the editor.
            </p>

            <button className="btn btn-primary" onClick={() => setActiveTab(TABS.SETTINGS)}>
              Open Settings
            </button>
          </section>
        )}

        {activeTab === TABS.EDITOR && (
          <>
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
                    {streaming ? "Writing..." : loading ? "Processing..." : "Submit"}
                  </button>

                  <button onClick={handleClear} className="btn btn-secondary" disabled={loading}>
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
                  disabled={!result || result.startsWith("Error:") || streaming}
                  className="btn btn-primary copy-btn"
                >
                  {copied ? "Copied!" : "Copy Result"}
                </button>
              </div>

              <div className={`result-box ${streaming ? "result-box-streaming" : ""}`}>
                {result || "Your improved text will appear here."}
                {streaming && <span className="typing-cursor"></span>}
              </div>
            </section>
          </>
        )}

        {activeTab === TABS.HISTORY && (
          <section className="glass-panel">
            <div className="section-heading history-heading">
              <div>
                <p className="section-eyebrow">Saved Sessions</p>
                <h2 className="section-title">History</h2>
              </div>

              <button className="btn btn-secondary" onClick={handleClearHistory}>
                Clear History
              </button>
            </div>

            {history.length === 0 ? (
              <div className="history-empty">No saved history yet.</div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <article key={item.id} className="history-card">
                    <div className="history-card-top">
                      <div className="history-meta">
                        <span className="history-tag">{item.mode}</span>
                        <span>{new Date(item.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="history-actions">
                        <button
                          className="btn btn-secondary"
                          onClick={() => handleUseHistory(item)}
                        >
                          Use
                        </button>
                        <button
                          className="btn btn-secondary danger-btn"
                          onClick={() => handleDeleteHistory(item.id)}
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
        )}

        {activeTab === TABS.SETTINGS && (
          <section className="glass-panel">
            <div className="section-heading">
              <div>
                <p className="section-eyebrow">Configuration</p>
                <h2 className="section-title">Settings</h2>
              </div>
            </div>

            <div className="settings-grid">
              <div className="settings-block">
                <p className="settings-label">Provider</p>
                <p className="settings-value">{settingsState.provider}</p>
              </div>

              <div className="settings-block">
                <p className="settings-label">Model</p>
                <p className="settings-value">{settingsState.model}</p>
              </div>

              <div className="settings-block">
                <p className="settings-label">API Key Saved</p>
                <p className="settings-value">{settingsState.hasApiKey ? "Yes" : "No"}</p>
              </div>

              <div className="settings-block">
                <p className="settings-label">API Key Status</p>
                <p className="settings-value">{renderStatusText()}</p>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Gemini API key</label>
              <input
                type="password"
                className="single-line-input"
                placeholder="Paste your Gemini API key"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
              />
            </div>

            <div className="button-row">
              <button
                className="btn btn-primary"
                onClick={handleSaveApiKey}
                disabled={savingKey}
              >
                {savingKey ? "Saving..." : "Save API Key"}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleValidateApiKey}
                disabled={validatingKey}
              >
                {validatingKey ? "Checking..." : "Validate Key"}
              </button>

              <button className="btn btn-secondary danger-btn" onClick={handleClearApiKey}>
                Remove Saved Key
              </button>
            </div>

            {settingsMessage && <div className="settings-message">{settingsMessage}</div>}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;