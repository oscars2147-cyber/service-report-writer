import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function normalizeEquipmentNumber(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    const {
      propertyName,
      equipmentNumber,
      reportType,
      endingMode,
      rawNotes,
      finalReport,
    } = await req.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const normalized = normalizeEquipmentNumber(equipmentNumber);

    // 🔍 Check if machine exists
    let { data: equipment } = await supabase
      .from("equipment")
      .select("*")
      .eq("property_name", propertyName)
      .eq("normalized_equipment_number", normalized)
      .maybeSingle();

    // ➕ Create machine if not found
    if (!equipment) {
      const { data: newEquipment, error } = await supabase
        .from("equipment")
        .insert({
          property_name: propertyName,
          equipment_number: equipmentNumber,
          normalized_equipment_number: normalized,
        })
        .select()
        .single();

      if (error) throw error;

      equipment = newEquipment;
    }

    // 💾 Save report
    const { error } = await supabase.from("reports").insert({
      equipment_id: equipment.id,
      property_name: propertyName,
      equipment_number: equipmentNumber,
      author_user_id: user.id,
      report_type: reportType,
      ending_mode: endingMode,
      raw_notes: rawNotes,
      final_report: finalReport,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Save failed" },
      { status: 500 }
    );
  }
}