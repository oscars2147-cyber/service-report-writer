import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { reportType, notes, endingMode } = await req.json();

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
Use a completed-repair ending.
End with a professional machine status statement showing the machine returned to service and was operating within normal parameters at time of release.
`;
    } else if (endingMode === "pending") {
      endingInstruction = `
Use a pending-repair ending.
End with a professional machine status statement showing the unit remains pending repair or awaiting parts and will require return visit to complete repair and verify proper operation.
`;
    } else if (endingMode === "monitor") {
      endingInstruction = `
Use a monitoring ending.
End with a professional machine status statement showing the issue improved or the machine is operating at this time, but continued monitoring is recommended.
Do not imply the repair is fully complete unless the notes support that.
`;
    } else {
      endingInstruction = `
Select the ending based on the situation described:
- If repair is complete, state machine returned to service and was operating within normal parameters at time of release.
- If parts are required or repair is incomplete, state unit remains pending repair or awaiting parts and requires return visit.
- If operation improved but is not fully confirmed, state continued monitoring is recommended.
Do not use the same ending for every report.
`;
    }

    let formatInstruction = "";

    if (reportType === "warranty") {
      formatInstruction = `
Return the report in a warranty / 3C style.
Be precise, factual, chronological, and defensible.
Clearly document:
- Complaint
- Cause
- Correction

Keep it professional and easy to submit for warranty or internal review.
`;
    } else {
      formatInstruction = `
Return a full professional narrative report.
Write in a diagnostic narrative style with clear cause-and-effect reasoning.
`;
    }

    const systemPrompt = `
You are a professional heavy equipment field service technician.

Your task is to convert rough technician notes into a clean, professional service report.

CORE RULES:
- Do NOT invent steps, measurements, repairs, or conclusions
- Preserve all original meaning
- Maintain the diagnostic sequence from the notes
- Fix grammar, spelling, and sentence flow
- Expand shorthand into full professional sentences

STYLE:
- Use a direct, practical, field-real tone
- Avoid corporate phrasing
- Avoid vague phrases like "found it good" or "tested normal"
- Prefer precise technical language such as "within normal operating range" and "operating correctly"
- Prefer field technician phrasing over service-writer phrasing

STRUCTURE:
- Begin with travel/arrival if present, using "Traveled to..."
- Maintain chronological diagnostic flow
- Explain what results confirm or rule out when clearly supported by the notes
- Do not force conclusions if unsupported

TECHNICAL LANGUAGE:
- When appropriate, explain what results indicate
- Use phrasing such as "which confirms..." or "which rules out..." when supported by the notes
- When verification is performed, clearly state what was tested and what the result confirmed
- Avoid vague phrasing like "all tested good" when a more specific technical description is possible

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
          content: `Convert these notes into the requested report:\n\n${notes}`,
        },
      ],
    });

    return NextResponse.json({
      full_report: response.output_text,
    });
  } catch (error: any) {
    console.error("API route error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to generate report." },
      { status: 500 }
    );
  }
}