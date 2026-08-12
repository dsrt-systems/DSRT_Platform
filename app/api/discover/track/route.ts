import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json();
  const { signal_type, entity_type, entity_id, metadata } = body;

  if (!signal_type || !entity_type || !entity_id) {
    return NextResponse.json(
      { ok: false, error: "Missing fields" },
      { status: 400 },
    );
  }

  // 🎯 For 'visit' - one per user per community (ever)
  if (signal_type === "visit" && entity_type === "community") {
    // Check if user already visited this community
    const { data: existing } = await supabase
      .from("user_activity_signals")
      .select("id")
      .eq("user_id", user.id)
      .eq("entity_id", entity_id)
      .eq("entity_type", "community")
      .eq("signal_type", "visit")
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Already visited - skip
      return NextResponse.json({ ok: true, deduped: true });
    }
  }

  try {
    await supabase.rpc("track_user_signal", {
      p_user_id: user.id,
      p_signal_type: signal_type,
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_metadata: metadata || {},
    });
  } catch (e) {
    // Silent fail
  }

  return NextResponse.json({ ok: true });
}
