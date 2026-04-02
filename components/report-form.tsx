"use client";

import { useState } from "react";

type ReportResponse = {
  full_report?: string;
  soap?: {
    complaint?: string;
    cause?: string;
    correction?: string;
  };
  short?: string;
  error?: string;
};

export function ReportForm({
  onGenerated,
}: {
  onGenerated: (report: ReportResponse) => void;
}) {
  const [mode, setMode] = useState("notes");
  const [endingMode, setEndingMode] = useState("auto");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mode, notes, endingMode }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Failed to generate report.");
      }

      const data: ReportResponse = JSON.parse(text);
      onGenerated(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>New Report</h2>

      <div className="field">
        <label htmlFor="mode">Mode</label>
        <select
          id="mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="notes">Scattered Notes Mode</option>
          <option value="structured">Structured Mode</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="endingMode">Ending</label>
        <select
          id="endingMode"
          value={endingMode}
          onChange={(e) => setEndingMode(e.target.value)}
        >
          <option value="auto">Auto</option>
          <option value="fixed">Fixed / Returned to Service</option>
          <option value="pending">Pending Repair / Awaiting Parts</option>
          <option value="monitor">Monitor / Partial Correction</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          placeholder="Enter notes (messy is fine)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{ width: "100%", minHeight: "220px" }}
        />
      </div>

      <div className="button-row">
        <button
          className="button button-primary"
          onClick={generate}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate"}
        </button>
      </div>

      {error ? <p style={{ color: "red" }}>{error}</p> : null}
    </section>
  );
}