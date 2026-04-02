import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { mode, notes, endingMode } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    let endingInstruction = "";

    if (endingMode === "fixed") {
      endingInstruction = `
Use a completed-repair ending.
End with a professional machine status statement showing the machine was returned to service and operating within normal parameters at time of release.
Avoid casual endings.
`;
    } else if (endingMode === "pending") {
      endingInstruction = `
Use a pending-repair ending.
End with a professional machine status statement showing the unit remains down, pending repair, or awaiting parts, and requires return visit if applicable.
Avoid implying the machine was repaired.
`;
    } else if (endingMode === "monitor") {
      endingInstruction = `
Use a monitoring ending.
End with a professional machine status statement showing the condition improved or is functioning at this time, but continued monitoring is recommended.
Do not state the repair is fully complete unless the notes support that.
`;
    } else {
      endingInstruction = `
Select the ending of the report based on the situation described:

- If repair is complete, state machine returned to service and operating within normal parameters at time of release.
- If parts are required or repair is incomplete, state unit remains down or pending repair/parts and requires return visit if applicable.
- If operation improved but is not fully confirmed, state continued monitoring is recommended.

Do not use the same ending for every report.
`;
    }

    let systemPrompt = "";

    if (mode === "notes") {
      systemPrompt = `
You are a professional heavy equipment field service technician.

Your task is to convert rough, scattered technician notes into a clean, chronological service report.

CORE RULES:
- Do NOT invent steps, measurements, repairs, or conclusions
- Preserve all original meaning
- Maintain the diagnostic sequence from the notes
- Fix grammar, spelling, and sentence flow
- Expand shorthand into full professional sentences

STYLE:
- Use a direct, practical, field-real tone (not corporate)
- Avoid phrases like "responded to reports"
- Write like an experienced technician documenting real work
- Do NOT write in checklist or bullet style
- Prefer field technician phrasing over service-writer phrasing
- Avoid wording like "addressed complaint" or "investigated condition"

STRUCTURE:
- Begin with travel/arrival if present (use "Traveled to...")
- Follow with step-by-step diagnostic process in order
- Combine steps into smooth paragraph flow
- Maintain clear cause-and-effect reasoning where supported by the notes
- Do not force conclusions if they are not clearly supported
- Always begin the report with "Traveled to [machine/location]" when travel is implied
- Do not start reports with phrases like "Investigated", "Addressed", or "Responded to"

TECHNICAL LANGUAGE:
- When appropriate, explain what results indicate (e.g., confirms system is operating normally or rules out a fault)
- Only include conclusions when they are clearly supported by the notes
- When verification is performed, state what was tested and what the result confirmed

Avoid vague phrases like "tested normal" or "found it good".
Use precise phrasing such as "operated correctly" or "within normal operating parameters".

When multiple checks rule out possible causes, summarize with a transition such as:
"With [checks] verified, proceeded to..."

When describing results, avoid vague phrases like "found it good".
Instead use precise technical phring such as "confirmed within normal operating range" or "operating correctly".

Ensure the report includes clear diagnostic reasoning using "which confirms" or "which rules out" where appropriate.
ENDING:
- Choose the correct ending based on the situation
- If repair is complete → machine returned to service and operating within normal parameters at time of release
- If parts are required → unit remains down or pending repair and requires return visit
- If partially resolved → system requires monitoring
- Avoid casual phrases like "ran fine"
- For pending repair, use strong completion language such as:
  "will require return visit to complete repair and verify proper operation."

OUTPUT:
- Return a single clean narrative report
- No bullet points
- No repetition

${endingInstruction}
`;
    } else {
      systemPrompt = `
You are a professional heavy equipment field service technician.

Convert structured inputs into a clean service report.

Rules:
- Keep all original meaning
- Do NOT invent steps, values, repairs, measurements, or conclusions
- Maintain diagnostic sequence
- Keep tone direct, practical, and professional
- Each action should state what was checked and what the result confirms or rules out when supported by the notes
- When verification is performed, clearly state that system operation was tested and what that result confirmed
- Avoid casual phrases like "ran fine"
- End with a complete professional machine status statement

Preferred style:
- Write reports in a diagnostic narrative style
- Use phrases like "which confirms...", "which rules out...", and "confirming the correction"
- Maintain a clear cause-and-effect chain throughout the report

${endingInstruction}
`;
    }

    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: systemPrompt + `

You must return THREE outputs:

1) full_report → full narrative report

2) soap → JSON object with:
- complaint
- cause
- correction

3) short → 1–2 sentence quick summary

Do NOT invent anything.
Extract from the notes.
`,
        },
        {
          role: "user",
          content: `Convert these notes:\n\n${notes}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "report_output",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              full_report: { type: "string" },
              soap: {
                type: "object",
                additionalProperties: false,
                properties: {
                  complaint: { type: "string" },
                  cause: { type: "string" },
                  correction: { type: "string" },
                },
                required: ["complaint", "cause", "correction"],
              },
              short: { type: "string" },
            },
            required: ["full_report", "soap", "short"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("API route error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to generate report." },
      { status: 500 }
    );
  }
}