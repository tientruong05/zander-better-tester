import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MockPaymentClient } from "./MockPaymentClient";

export const dynamic = "force-dynamic";

// This page only exists when PAYMENT_MODE=mock. In real mode it behaves
// like any other unknown route (404), so it can never be reached in prod.
export default function MockPaymentPage() {
  if (process.env.PAYMENT_MODE !== "mock") {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <p className="text-sm text-gray-500">Loading mock payment...</p>
        </div>
      }
    >
      <MockPaymentClient />
    </Suspense>
  );
}
