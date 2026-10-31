import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import TrackVisit from "@/components/TrackVisit";
import { Analytics } from "@vercel/analytics/react";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "iPhone Store — Demo",
  description:
    "Demo iPhone store for learning UI automation and API/load testing with Playwright and JMeter.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${beVietnamPro.variable} antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <TrackVisit />
              {children}
              <Analytics />
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
