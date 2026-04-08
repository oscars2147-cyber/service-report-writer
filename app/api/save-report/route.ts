import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: false,
    disabled: true,
    message: "Saving reports is disabled.",
  });
}