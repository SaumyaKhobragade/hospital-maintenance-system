import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLL_KEY!
);

export async function GET() {
  const [{ data: patients }, { data: treatments }] = await Promise.all([
    supabaseAdmin
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, 99999), // Override Supabase's default 1000-row cap
    supabaseAdmin
      .from("active_treatments")
      .select("*")
      .order("created_at", { ascending: false })
      .range(0, 99999),
  ]);

  return NextResponse.json({
    patients: patients ?? [],
    treatments: treatments ?? [],
  });
}
