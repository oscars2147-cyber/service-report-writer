"use client";

import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { ReportForm } from "@/components/report-form";
import { OutputPanel } from "@/components/output-panel";

export default function HomePage() {
  const [report, setReport] = useState<{ full_report?: string } | null>(null);

  return (
    <main className="page-shell">
      <TopBar />
      <div className="main-grid">
        <ReportForm onGenerated={setReport} />
        <OutputPanel report={report} />
      </div>
    </main>
  );
}