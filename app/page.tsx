"use client";

import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { ReportForm } from "@/components/report-form";
import { OutputPanel } from "@/components/output-panel";

export default function HomePage() {
  const [report, setReport] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [endingMode, setEndingMode] = useState("auto");

  return (
    <main className="app-shell">
      <div className="bg-overlay" />
      <TopBar />

      <section className="dashboard-grid">
        <div className="glass-panel left-panel">
          <ReportForm
            onGenerated={setReport}
            setNotes={setNotes}
            setEndingMode={setEndingMode}
          />
        </div>

        <div className="glass-panel right-panel">
          <OutputPanel
            report={report}
            notes={notes}
            endingMode={endingMode}
            setReport={setReport}
          />
        </div>
      </section>
    </main>
  );
}