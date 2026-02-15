import type { Metadata } from "next";
import { Crimson_Text } from "next/font/google";
import "./globals.css";

const display = Crimson_Text({
  weight: ["600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Narrador — RPG com IA",
  description: "MVP para narrar RPG de mesa auxiliado por IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${display.variable} font-sans min-h-screen bg-rpg-dark text-gray-100`}>
        {children}
      </body>
    </html>
  );
}
