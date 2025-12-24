import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google"; // [NEW] fonts
import "./globals.css";

// [NEW] Configure Fonts
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YT Coach - Analítica Avanzada",
  description: "Analiza y optimiza tu canal de YouTube con estadísticas detalladas y puntos de acción.",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
