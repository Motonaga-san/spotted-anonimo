import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Spotted Anônimo | Envie mensagens de forma segura",
  description: "Envie mensagens anônimas de forma segura e sem preconceito. Spotteds são moderados para garantir um ambiente saudável.",
  keywords: ["spotted", "anônimo", "mensagem", "confesssão", "universidade"],
  openGraph: {
    title: "Spotted Anônimo",
    description: "Envie mensagens anônimas de forma segura",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">{children}</body>
    </html>
  );
}
