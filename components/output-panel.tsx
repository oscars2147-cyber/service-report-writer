"use client";

import { useState } from "react";

export function OutputPanel({ report, notes, endingMode, setReport }: any) {
  const [loading, setLoading] = useState(false);

  function copy(text: string) {
    navigator.clipboard.writeText(text || "");
  }

  async function regenerate(type: string) {
    if (!notes) return;

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
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel">
      <div className="report-header-row">
        <h2>Generated Report</h2>
        <div className="ready-pill">
          <span className="ready-dot" />
          Ready
        </div>
      </div>

      <div className="report-card">
        <div className="output-block">
          <h3>Report Output</h3>

          <button
            className="button button-secondary"
            onClick={() => copy(report?.full_report || "")}
          >
            Copy
          </button>

          <pre className="output-text">
            {report?.full_report || "Your report will appear here."}
          </pre>
        </div>

        <div className="action-grid">
          <button
            className="action-button"
            onClick={() => regenerate("full")}
          >
            Full Summary
          </button>


          <button
            className="action-button"
            onClick={() => regenerate("warranty")}
          >
            Warranty / 3C
          </button>
        </div>

        {loading && <p className="subtle-text">Regenerating...</p>}
      </div>
    </section>
  );
}