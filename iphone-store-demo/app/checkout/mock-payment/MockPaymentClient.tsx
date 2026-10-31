"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type MockOrder = {
  id: string;
  order_code: number;
  total_amount: number;
  status: string;
  payment_method?: string;
  delivery_method?: string;
};

// Simulated payment gateway used only when PAYMENT_MODE=mock.
// Playwright can click either button to drive the order lifecycle
// without touching the real PayOS service.
export function MockPaymentClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") ?? "";

  const [order, setOrder] = useState<MockOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"success" | "failed" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Missing orderId in the URL");
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/orders/${orderId}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Could not load the order");
        }
        return data;
      })
      .then((data) => {
        if (!cancelled) setOrder(data.order);
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(
            fetchError instanceof Error ? fetchError.message : "Could not load the order",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleResult = async (result: "success" | "failed") => {
    if (!order || submitting) return;

    setSubmitting(result);
    setError("");

    try {
      const response = await fetch("/api/payment/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, result }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Mock payment failed");
      }

      router.push(`/orders/${orderId}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Mock payment failed",
      );
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p data-testid="mock-payment-loading" className="text-sm text-gray-500">
          Loading order...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-lg font-bold text-gray-900 mb-2">Mock payment</h1>
          <p data-testid="mock-payment-error" className="text-sm text-red-600 mb-4">
            {error || "Order not found"}
          </p>
          <Link
            href="/products"
            data-testid="mock-payment-back-link"
            className="inline-block bg-[#0071e3] text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
          >
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const isPending = order.status === "pending";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold tracking-widest text-[#0071e3] uppercase">
            Mock payment gateway
          </p>
          <h1 className="text-xl font-bold text-gray-900 mt-1">
            Simulated PayOS checkout
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            PAYMENT_MODE=mock — no real money is involved.
          </p>
        </div>

        <dl className="space-y-3 border-y border-gray-100 py-4 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Order code</dt>
            <dd data-testid="mock-payment-order-code" className="font-semibold text-gray-900">
              #{order.order_code}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Amount</dt>
            <dd data-testid="mock-payment-amount" className="font-bold text-[#0071e3]">
              {Number(order.total_amount).toLocaleString("vi-VN")}₫
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-gray-500">Status</dt>
            <dd
              data-testid="mock-payment-status"
              className={`font-semibold ${
                isPending ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {order.status}
            </dd>
          </div>
        </dl>

        {error && (
          <p data-testid="mock-payment-error" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        {!isPending && (
          <p className="mt-4 text-xs text-gray-500">
            This order has already been processed. You can go back to the order page.
          </p>
        )}

        <div className="mt-6 space-y-2">
          <button
            type="button"
            data-testid="mock-payment-success-button"
            onClick={() => handleResult("success")}
            disabled={!isPending || submitting !== null}
            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {submitting === "success" ? "Processing..." : "Pay successfully"}
          </button>
          <button
            type="button"
            data-testid="mock-payment-failure-button"
            onClick={() => handleResult("failed")}
            disabled={!isPending || submitting !== null}
            className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {submitting === "failed" ? "Processing..." : "Payment failed"}
          </button>
        </div>

        <Link
          href={`/orders/${order.id}`}
          data-testid="mock-payment-back-link"
          className="block text-center text-xs text-gray-400 hover:text-gray-600 mt-4"
        >
          Back to order
        </Link>
      </div>
    </div>
  );
}
