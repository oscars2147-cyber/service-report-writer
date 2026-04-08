"use client";

import { useState } from "react";

type Props = {
  onGenerated: (report: any) => void;
  setNotes: (notes: string) => void;
  setEndingMode: (mode: string) => void;
};

export function ReportForm({ onGenerated, setNotes, setEndingMode }: Props) {
  const [endingModeLocal, setEndingModeLocal] = useState("auto");
  const [notesLocal, setNotesLocal] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function generate() {
    setError("");

    if (!notesLocal.trim()) {
      setError("Please enter your notes first.");
      return;
    }

    setIsLoading(true);

    setNotes(notesLocal);
    setEndingMode(endingModeLocal);

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportType: "full",
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
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="glass-panel left-panel panel-enter">
      <div className="panel">
        <div className="section-heading">
          <h2>Report Details</h2>
          <p>Set the ending and paste your notes below.</p>
        </div>

        <div className="field field-animate">
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

        <div className="field field-animate">
          <label htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            placeholder="Type notes how you normally would… no formatting needed"
            value={notesLocal}
            onChange={(e) => setNotesLocal(e.target.value)}
            className="notes-area"
          />
        </div>

        <div className="button-row">
          <button
            className="button button-primary micro-lift"
            onClick={generate}
            type="button"
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Report"}
          </button>
        </div>

        {error && <p className="error-text status-fade">{error}</p>}
      </div>
    </section>
  );
}