import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { reportType, notes, endingMode } = await req.json();

    if (!notes || !String(notes).trim()) {
      return NextResponse.json(
        { error: "Notes are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let endingInstruction = "";

    if (endingMode === "fixed") {
      endingInstruction = `
Use a completed repair ending.
End the report with a clear professional final machine status statement showing the machine was returned to service and operating within normal parameters at time of release.
Do not mention pending parts or further monitoring unless the notes clearly require it.
`;
    } else if (endingMode === "pending") {
      endingInstruction = `
Use a pending repair ending.
End the report with a clear professional final machine status statement showing the unit remains down, pending repair, or awaiting parts, and that a return visit is required to complete repair and verify operation.
Do not imply the machine was returned to service.
`;
    } else if (endingMode === "monitor") {
      endingInstruction = `
Use a monitoring ending.
End the report with a clear professional final machine status statement showing the machine is operating at this time or the issue improved, but continued monitoring is recommended.
Do not overstate the repair as fully complete unless the notes clearly support that.
`;
    } else {
      endingInstruction = `
Choose the ending that best matches the notes:
- If the repair was completed and operation was verified, state the machine was returned to service and operating within normal parameters at time of release.
- If parts are needed or the repair is incomplete, state the unit remains down or pending repair and requires a return visit.
- If the machine is operating but the issue is not fully confirmed resolved, state continued monitoring is recommended.
Use the ending that best matches the actual notes. Do not force the same closing on every report.
`;
    }

    let formatInstruction = "";

    if (reportType === "warranty") {
      formatInstruction = `
Return the report in strict warranty / 3C format using these section headers exactly:

Complaint:
Cause:
Correction:

Rules for warranty / 3C:
- Complaint must state what the reported issue or request was
- Cause must state what was found, diagnosed, confirmed, or ruled out
- Correction must state what was repaired, adjusted, replaced, tested, or recommended
- Keep it factual, concise, chronological, and defensible
- Do not use bullet points
- Do not add extra headers or commentary
`;
    } else {
      formatInstruction = `
Return the report as a full professional field service narrative.
Rules for full narrative:
- Write in paragraph form
- Maintain the technician's sequence of travel, inspection, diagnosis, repair, and verification
- Keep the report clear, readable, and professional
- Do not use bullet points
- Do not add headings unless the notes clearly call for them
`;
    }

    const systemPrompt = `
You are an experienced heavy equipment field service technician writing professional service reports.

Your job is to take rough mechanic notes and turn them into a clean, accurate, professional report without changing the meaning.

NON-NEGOTIABLE RULES:
- Do not invent facts
- Do not invent measurements, pressures, parts, repairs, times, conversations, or conclusions
- Do not add troubleshooting steps that are not in the notes
- Do not add details just to make the report sound better
- If the notes are rough, make them professional, but stay faithful to the actual content
- Preserve the real order of events from the notes
- Keep the report grounded in what the technician actually did

WRITING STYLE:
- Write like a real heavy equipment field technician
- Use direct, practical, field-real language
- Keep it professional but not corporate
- Do not use office-style language, sales language, or polished corporate filler
- Avoid phrases like "responded to", "engaged with", "utilized", "successfully completed", or other inflated wording
- Prefer plain, strong technician wording
- Use complete sentences and good grammar
- Expand shorthand into full professional sentences

TONE:
- Sound experienced, technical, and credible
- Be clear and matter-of-fact
- Do not sound robotic
- Do not sound like a generic AI assistant
- Do not exaggerate confidence beyond what the notes support

TECHNICAL REPORT RULES:
- If the notes mention travel, start with "Traveled to..." when appropriate
- If the notes describe complaint first, then diagnosis, then repair, keep that order
- If a test result clearly confirms something, you may say "which confirms..."
- If a test result clearly rules something out, you may say "which rules out..."
- Only use confirm/rule out language when the notes actually support it
- If a part was ordered, say so clearly
- If no repair was made, do not imply that a repair was made
- If only inspection or diagnosis was performed, say that clearly
- If parameters, settings, or adjustments were checked and not changed, say that clearly
- If the issue was due to operating conditions, state that clearly if supported by the notes

PHRASING PREFERENCES:
- Prefer "operating within normal parameters" over vague phrases like "working good"
- Prefer "operating correctly" or "functioning as intended" when supported
- Prefer "inspection found", "testing confirmed", "testing showed", "diagnosis found", "verified", and "ruled out" where accurate
- Avoid vague filler like "everything checked out fine" unless the notes truly provide no better detail

WHAT TO AVOID:
- No bullet points unless explicitly required by the format
- No made-up structure
- No extra summaries
- No introductory commentary
- No quotation marks around the report
- No markdown
- Do not mention AI, rewriting, or editing

ENDING:
${endingInstruction}

FORMAT:
${formatInstruction}

Return only the finished report text.
`;

    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Convert these technician notes into the requested report format:

${notes}`,
        },
      ],
    });

    return NextResponse.json({
      full_report: response.output_text?.trim() || "",
    });
  } catch (error: any) {
    console.error("API route error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to generate report." },
      { status: 500 }
    );
  }
}