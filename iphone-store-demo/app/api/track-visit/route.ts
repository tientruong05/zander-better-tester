import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// POST /api/track-visit — increment site visit counter
export async function POST() {
  try {
    const supabase = getServiceClient();

    const { data, error } = await supabase.rpc("increment_site_visits", {
      count_to_add: 1,
    });

    if (error) {
      console.error("track-visit error:", error);
      return NextResponse.json({ error: "Failed to track visit" }, { status: 500 });
    }

    return NextResponse.json(
      { total: data },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch (error) {
    console.error("track-visit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
