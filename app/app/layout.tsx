import type { Metadata } from "next";
import { Schibsted_Grotesk, Instrument_Sans } from "next/font/google";
import "./globals.css";

const fontDisplay = Schibsted_Grotesk({
  variable: "--font-display-loaded",
  subsets: ["latin"],
  display: "swap",
});

const fontBody = Instrument_Sans({
  variable: "--font-body-loaded",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fairsy.lat"),
  appleWebApp: { capable: true, title: 'Fairsy', statusBarStyle: 'default' },
  title: "Fairsy — Cuentas claras, sin discutir",
  description:
    "Registren gastos en 2 toques, vean el mismo saldo y ahorren en equipo. Un solo pago cubre a los dos. 7 días gratis.",
  openGraph: {
    type: "website",
    siteName: "Fairsy",
    locale: "es_LA",
    url: "https://fairsy.lat",
    title: "Fairsy — Cuentas claras entre los dos, sin discutir",
    description:
      "Registren gastos en 2 toques, vean el mismo saldo y ahorren en equipo. Un solo pago cubre a los dos. 7 días gratis.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fairsy — Cuentas claras entre los dos, sin discutir",
    description: "Registren gastos en 2 toques, vean el mismo saldo y ahorren en equipo. 7 días gratis.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${fontDisplay.variable} ${fontBody.variable} h-full antialiased`}
      style={
        {
          "--font-display": "var(--font-display-loaded), 'Archivo', sans-serif",
          "--font-body": "var(--font-body-loaded), 'Segoe UI', sans-serif",
        } as React.CSSProperties
      }
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
