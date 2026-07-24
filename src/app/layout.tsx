import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://panconnect.by'),
  title: {
    default: "PanConnect — Купить телефон в Минске",
    template: "%s | PanConnect",
  },
  description: "Магазин мобильных телефонов Apple, Samsung, Xiaomi с гарантией и доставкой по Минску. Лучшие цены!",
  keywords: ["телефон", "смартфон", "iPhone", "Samsung", "Xiaomi", "Минск", "купить"],
  openGraph: {
    title: "PanConnect — Купить телефон в Минске",
    description: "Магазин мобильных телефонов с гарантией и доставкой",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased text-gray-900 bg-white">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
