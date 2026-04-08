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
      <TopBar />

      <section className="dashboard-grid">
        <ReportForm
          onGenerated={setReport}
          setNotes={setNotes}
          setEndingMode={setEndingMode}
        />

        <OutputPanel
          report={report}
          notes={notes}
          endingMode={endingMode}
          setReport={setReport}
        />
      </section>
    </main>
  );
}