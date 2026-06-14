import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLL_KEY!
);

export async function GET() {
  // Fetch all decisions — override Supabase's default 1000-row cap
  const { data, error } = await supabaseAdmin
    .from("clinical_decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, 99999);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const all = data ?? [];

  // Compute aggregate metrics from the full dataset
  const total = all.length;
  const totalWaitSaved = all.reduce(
    (sum: number, d: any) => sum + ((d.confidence || 0) / 10),
    0
  );
  const avgWait = total > 0 ? totalWaitSaved / total : 0;
  const failed = all.filter(
    (d: any) =>
      d.status?.toLowerCase() === "failed" ||
      d.status?.toLowerCase() === "rejected"
  ).length;

  return NextResponse.json({
    decisions: all,
    metrics: { totalRedirects: total, avgWaitSaved: avgWait, failedRedirects: failed },
  });
}
