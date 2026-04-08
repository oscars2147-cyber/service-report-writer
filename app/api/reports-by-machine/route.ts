import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    reports: [],
    disabled: true,
    message: "Report history is disabled.",
  });
}