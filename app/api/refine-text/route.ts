import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { text, mode } = await req.json();

    if (!text || !String(text).trim()) {
      return NextResponse.json(
        { error: "Selected text is required." },
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

    let modeInstruction = "";

    switch (mode) {
      case "shorter":
        modeInstruction = `
Rewrite the selected text to be shorter and tighter.
Keep the same meaning.
Do not remove important technical information.
`;
        break;
      case "direct":
        modeInstruction = `
Rewrite the selected text to sound more direct and field-practical.
Keep the same meaning.
Do not add corporate wording.
`;
        break;
      case "warranty":
        modeInstruction = `
Rewrite the selected text to be more warranty-friendly:
clear, factual, defensible, and concise.
Keep the same meaning.
Do not invent details.
`;
        break;
      default:
        modeInstruction = `
Rewrite the selected text to sound more professional and polished.
Keep the same meaning.
Do not invent details.
Do not add extra steps, measurements, conclusions, or repairs.
`;
        break;
    }

    const systemPrompt = `
You are an experienced heavy equipment field service technician.

Your task is to rewrite ONLY the selected portion of a service report.

Rules:
- Return only the rewritten text
- Do not add quotation marks
- Do not add headings
- Do not add bullet points
- Do not explain your changes
- Do not invent facts
- Preserve the original meaning
- Keep the tone practical, professional, and technician-focused

${modeInstruction}
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
          content: `Rewrite this selected report text:\n\n${text}`,
        },
      ],
    });

    return NextResponse.json({
      refinedText: response.output_text?.trim() || text,
    });
  } catch (error: any) {
    console.error("Refine text route error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to refine selected text." },
      { status: 500 }
    );
  }
}