import type { Metadata } from "next";
import { Questrial, Abril_Fatface } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const questrial = Questrial({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-body",
});

const abrilFatface = Abril_Fatface({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "CLBB — Comissão Lina Bo Bardi · Unifil",
  description: "Semana acadêmica de Arquitetura, Urbanismo e Engenharia Civil da Unifil, Londrina.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${questrial.variable} ${abrilFatface.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
