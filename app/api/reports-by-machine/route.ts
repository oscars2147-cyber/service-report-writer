import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeEquipmentNumber(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const { propertyName, equipmentNumber } = await req.json();

    const normalized = normalizeEquipmentNumber(equipmentNumber);

    const { data: equipment } = await supabase
      .from("equipment")
      .select("id")
      .eq("property_name", propertyName)
      .eq("normalized_equipment_number", normalized)
      .maybeSingle();

    if (!equipment) {
      return NextResponse.json({ reports: [] });
    }

    const { data: reports } = await supabase
      .from("reports")
      .select("*")
      .eq("equipment_id", equipment.id)
      .order("created_at", { ascending: false });

    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load reports" },
      { status: 500 }
    );
  }
}