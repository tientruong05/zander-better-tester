'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PaymentVerifierProps {
  orderId: string;
  orderStatus: string;
  paymentStatus?: string;
  orderCode?: string;
  onConfirmed?: () => void; // callback to re-fetch order data in parent
}

export default function PaymentVerifier({ 
  orderId, 
  orderStatus, 
  paymentStatus, 
  orderCode,
  onConfirmed,
}: PaymentVerifierProps) {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    // Only fire once, only when PayOS returns with PAID status and order is still pending
    if (attempted) return;
    if (paymentStatus === 'PAID' && orderCode && orderStatus === 'pending') {
      setIsVerifying(true);
      setAttempted(true);

      const confirmPayment = async () => {
        try {
          const res = await fetch('/api/orders/confirm-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderCode: Number(orderCode) }),
          });

          if (res.ok) {
            // Tell parent to re-fetch so UI updates without a full reload
            if (onConfirmed) {
              onConfirmed();
            } else {
              // Fallback: strip the PayOS query params and hard-reload
              window.location.href = `/orders/${orderId}`;
            }
          }
        } catch (error) {
          console.error('Confirmation error', error);
        } finally {
          setIsVerifying(false);
        }
      };

      confirmPayment();
    }
  }, [paymentStatus, orderCode, orderStatus, orderId, attempted, onConfirmed]);

  if (!isVerifying) return null;

  return (
    <div data-testid="payment-verifier-overlay" className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 shadow-xl border border-gray-100 text-center max-w-sm mx-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#0071e3] mx-auto mb-4"></div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Đang xác thực thanh toán</h3>
        <p className="text-gray-500 text-sm">Vui lòng đợi trong giây lát...</p>
      </div>
    </div>
  );
}
