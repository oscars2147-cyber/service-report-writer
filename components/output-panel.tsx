"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ReportData = {
  full_report?: string;
};

type OutputPanelProps = {
  report: ReportData | null;
  notes: string;
  endingMode: string;
  setReport: (report: any) => void;
};

export function OutputPanel({
  report,
  notes,
  endingMode,
  setReport,
}: OutputPanelProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [editableReport, setEditableReport] = useState("");
  const [generatedReport, setGeneratedReport] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [refining, setRefining] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fullText = useMemo(() => report?.full_report || "", [report]);

  function showToast(message: string) {
    setToast(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setToast("");
    }, 1800);
  }

  useEffect(() => {
    if (typeTimerRef.current) {
      clearTimeout(typeTimerRef.current);
    }

    if (!fullText) {
      setDisplayedText("");
      setEditableReport("");
      setGeneratedReport("");
      setIsTyping(false);
      return;
    }

    let index = 0;
    setDisplayedText("");
    setEditableReport("");
    setGeneratedReport(fullText);
    setIsTyping(true);

    const chunkSize = Math.max(1, Math.ceil(fullText.length / 120));

    const typeChunk = () => {
      index += chunkSize;
      const nextText = fullText.slice(0, index);
      setDisplayedText(nextText);

      if (index < fullText.length) {
        typeTimerRef.current = setTimeout(typeChunk, 12);
      } else {
        setEditableReport(fullText);
        setGeneratedReport(fullText);
        setIsTyping(false);
      }
    };

    typeTimerRef.current = setTimeout(typeChunk, 80);

    return () => {
      if (typeTimerRef.current) {
        clearTimeout(typeTimerRef.current);
      }
    };
  }, [fullText]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (typeTimerRef.current) clearTimeout(typeTimerRef.current);
    };
  }, []);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text || "");
      showToast("Report copied");
    } catch (err) {
      console.error(err);
      showToast("Copy failed");
    }
  }

  async function regenerate(type: string) {
    if (!notes.trim()) {
      showToast("Enter notes first");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: type,
          notes,
          endingMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate report.");
      }

      setReport(data);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to regenerate report");
    } finally {
      setLoading(false);
    }
  }

  async function refineSelection(mode: "professional" | "shorter" | "direct" | "warranty" = "professional") {
    const textarea = textareaRef.current;

    if (!textarea) {
      showToast("Editor not ready");
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) {
      showToast("Highlight text first");
      return;
    }

    const selectedText = editableReport.slice(start, end);

    if (!selectedText.trim()) {
      showToast("Highlight text first");
      return;
    }

    setRefining(true);

    try {
      const res = await fetch("/api/refine-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedText,
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to refine selection.");
      }

      const refinedText = data.refinedText || selectedText;
      const updated =
        editableReport.slice(0, start) +
        refinedText +
        editableReport.slice(end);

      setEditableReport(updated);
      showToast("Selection refined");

      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        textareaRef.current.focus();
        const newEnd = start + refinedText.length;
        textareaRef.current.setSelectionRange(start, newEnd);
      });
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Refine failed");
    } finally {
      setRefining(false);
    }
  }

  function resetToGenerated() {
    if (!generatedReport.trim()) {
      showToast("Nothing to reset");
      return;
    }

    setEditableReport(generatedReport);
    showToast("Report reset");
  }

  const reportValue = isTyping ? displayedText : editableReport;

  return (
    <section className="glass-panel right-panel panel-enter">
      <div className="panel">
        <div className="report-header-row">
          <div>
            <h2>Generated Report</h2>
            <p className="subtle-text">
              Review, edit, refine selections, copy, or switch formats.
            </p>
          </div>

          <div className="ready-pill">
            <span className="ready-dot" />
            Ready
          </div>
        </div>

        <div className="report-card card-fade-in">
          <div className="output-block">
            <div className="output-toolbar">
              <button
                className="button button-secondary micro-lift"
                onClick={() => copy(reportValue)}
                type="button"
              >
                Copy Report
              </button>

              {!isTyping && !!generatedReport && (
                <button
                  className="button button-secondary micro-lift"
                  onClick={resetToGenerated}
                  type="button"
                >
                  Reset
                </button>
              )}
            </div>

            {isTyping ? (
              <pre className="output-text typewriter-text">
                {displayedText || "Your report will appear here."}
                {fullText && displayedText.length < fullText.length && (
                  <span className="typing-caret" />
                )}
              </pre>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  className="editable-output"
                  value={editableReport}
                  onChange={(e) => setEditableReport(e.target.value)}
                  placeholder="Your report will appear here."
                />

                <div className="refine-toolbar">
                  <button
                    className="action-button micro-lift"
                    onClick={() => refineSelection("professional")}
                    type="button"
                    disabled={refining}
                  >
                    {refining ? "Refining..." : "Refine Selection"}
                  </button>

                  <button
                    className="action-button micro-lift"
                    onClick={() => refineSelection("shorter")}
                    type="button"
                    disabled={refining}
                  >
                    Shorter
                  </button>

                  <button
                    className="action-button micro-lift"
                    onClick={() => refineSelection("direct")}
                    type="button"
                    disabled={refining}
                  >
                    More Direct
                  </button>

                  <button
                    className="action-button micro-lift"
                    onClick={() => refineSelection("warranty")}
                    type="button"
                    disabled={refining}
                  >
                    Warranty Style
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="action-grid">
            <button
              className="action-button micro-lift"
              onClick={() => regenerate("full")}
              type="button"
              disabled={loading}
            >
              Full Report
            </button>

            <button
              className="action-button micro-lift"
              onClick={() => regenerate("warranty")}
              type="button"
              disabled={loading}
            >
              Warranty / 3C
            </button>
          </div>

          {loading && <p className="subtle-text status-fade">Working...</p>}
        </div>

        <div className={`toast ${toast ? "toast-show" : ""}`}>{toast}</div>
      </div>
    </section>
  );
}