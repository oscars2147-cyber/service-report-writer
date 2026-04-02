"use client";

export function OutputPanel({ report }: any) {
  function copy(text: string) {
    navigator.clipboard.writeText(text || "");
  }

  const soapText = `Complaint: ${report?.soap?.complaint || ""}
Cause: ${report?.soap?.cause || ""}
Correction: ${report?.soap?.correction || ""}`;

  return (
    <section className="panel">
      <h2>Generated Output</h2>

      <div className="output-block">
        <h3>Full Report</h3>
        <button onClick={() => copy(report?.full_report || "")}>Copy</button>
        <pre>{report?.full_report || "Your full report will appear here."}</pre>
      </div>

      <div className="output-block">
        <h3>SOAP / 3C</h3>
        <button onClick={() => copy(soapText)}>Copy</button>
        <pre>{soapText}</pre>
      </div>

      <div className="output-block">
        <h3>Short Version</h3>
        <button onClick={() => copy(report?.short || "")}>Copy</button>
        <pre>{report?.short || "Your short version will appear here."}</pre>
      </div>
    </section>
  );
}