import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { isTestApiEnabled, testApiNotFound } from "@/lib/test-mode";

// Returns a Supabase access token for JMeter (or any API client) so tests
// do not need to manage browser cookies / localStorage sessions.
export async function POST(request: NextRequest) {
  if (!isTestApiEnabled()) return testApiNotFound();

  try {
    const body = await request.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured" },
        { status: 500 },
      );
    }

    // Use a dedicated anonymous client per request: no persisted session,
    // no side effects shared with the service-role client.
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json(
        { error: "Invalid credentials", details: error?.message },
        { status: 401 },
      );
    }

    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("is_admin")
      .eq("id", data.user.id)
      .maybeSingle();

    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: data.session.token_type ?? "bearer",
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      is_admin: profile?.is_admin ?? false,
    });
  } catch (error) {
    console.error("Test auth-token error:", error);
    return NextResponse.json(
      {
        error: "Failed to create auth token",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
