"use client";

import { useState } from "react";

type Props = {
  onGenerated: (report: any) => void;
  setNotes: (notes: string) => void;
  setEndingMode: (mode: string) => void;
};

export function ReportForm({ onGenerated, setNotes, setEndingMode }: Props) {
  const [reportType, setReportType] = useState("full");
  const [endingModeLocal, setEndingModeLocal] = useState("auto");
  const [notesLocal, setNotesLocal] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    setError("");
    setIsLoading(true);

    // store globally for switching buttons
    setNotes(notesLocal);
    setEndingMode(endingModeLocal);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType,
          notes: notesLocal,
          endingMode: endingModeLocal,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || "Failed to generate report.");
      }

      const data = JSON.parse(text);
      onGenerated(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="panel">
      <h2>Report Details</h2>

      {/* REPORT TYPE */}
      <div className="field">
        <label htmlFor="reportType">Report Type</label>
        <select
          id="reportType"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="full">Full Report</option>
          <option value="warranty">Warranty Report (3C)</option>
        </select>
      </div>

      {/* ENDING */}
      <div className="field">
        <label htmlFor="endingMode">Ending</label>
        <select
          id="endingMode"
          value={endingModeLocal}
          onChange={(e) => setEndingModeLocal(e.target.value)}
        >
          <option value="auto">Auto</option>
          <option value="fixed">Returned to Service</option>
          <option value="pending">Pending Repair / Parts</option>
          <option value="monitor">Monitor Condition</option>
        </select>
      </div>

      {/* NOTES */}
      <div className="field">
        <label htmlFor="notes">Notes / Observations</label>
        <textarea
          id="notes"
          placeholder="Type notes how you normally would… (no formatting needed)"
          value={notesLocal}
          onChange={(e) => setNotesLocal(e.target.value)}
          style={{ width: "100%", minHeight: "220px" }}
        />
      </div>

      {/* BUTTON */}
      <div className="button-row">
        <button
          className="button button-primary"
          onClick={generate}
          type="button"
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Report"}
        </button>
      </div>

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </section>
  );
}