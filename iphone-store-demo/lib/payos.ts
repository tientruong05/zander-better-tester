import { PayOS } from "@payos/node";

// PayOS is created lazily so mock payment mode (PAYMENT_MODE=mock)
// can run locally without PayOS credentials. The real integration is
// unchanged: callers just use getPayOS() instead of the old singleton.
let payosClient: PayOS | null = null;

export function getPayOS(): PayOS {
  if (!payosClient) {
    payosClient = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID!,
      apiKey: process.env.PAYOS_API_KEY!,
      checksumKey: process.env.PAYOS_CHECKSUM_KEY!,
    });
  }
  return payosClient;
}
