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
  title: "DuoSync — Cuentas claras, sin pelear",
  description:
    "DuoSync ordena el gasto del hogar y la conexión diaria de la pareja en un solo lugar, con un pago que cubre a los dos.",
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
