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
  const [isTyping, setIsTyping] = useState(false);

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
      setIsTyping(false);
      return;
    }

    let index = 0;
    setDisplayedText("");
    setEditableReport("");
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

  function resetToGenerated() {
    setEditableReport(fullText || "");
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
              Review, edit, copy, or switch formats.
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

              {!isTyping && !!fullText && (
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
              <textarea
                className="editable-output"
                value={editableReport}
                onChange={(e) => setEditableReport(e.target.value)}
                placeholder="Your report will appear here."
              />
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