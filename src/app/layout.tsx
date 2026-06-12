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
  title: "Spotted 2.0 | Because true love never dies",
  description: "Envie mensagens anônimas de forma segura. Spotted 2.0 - O sistema de mensagens anônimas mais seguro e moderno.",
  keywords: ["spotted", "anônimo", "mensagem", "confesssão", "universidade", "amor", "2.0"],
  openGraph: {
    title: "Spotted 2.0 - Because true love never dies",
    description: "Envie mensagens anônimas de forma segura e livre de toxicidade",
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
