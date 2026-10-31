import { NextResponse } from "next/server";

// Test API endpoints are only available when explicitly enabled.
// They must never be reachable on a production deployment.
export function isTestApiEnabled(): boolean {
  return process.env.ENABLE_TEST_API === "true" || process.env.NODE_ENV === "test";
}

// Returning 404 (instead of 403) hides the existence of the endpoints.
export function testApiNotFound(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

// PAYMENT_MODE=mock replaces the real PayOS redirect with a local
// mock payment page that automated tests can drive.
export function isMockPayment(): boolean {
  return process.env.PAYMENT_MODE === "mock";
}
