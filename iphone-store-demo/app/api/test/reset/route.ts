import { NextRequest, NextResponse } from "next/server";
import { isTestApiEnabled, testApiNotFound } from "@/lib/test-mode";
import { resetTestData } from "@/lib/test-data";

export async function POST(request: NextRequest) {
  if (!isTestApiEnabled()) return testApiNotFound();

  try {
    const body = await request.json().catch(() => ({}));
    const keepUsers = body?.keepUsers === true;
    const deleted = await resetTestData({ keepUsers });

    return NextResponse.json({
      success: true,
      keepUsers,
      deleted,
    });
  } catch (error) {
    console.error("Test reset error:", error);
    return NextResponse.json(
      {
        error: "Failed to reset test data",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
