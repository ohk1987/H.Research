import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";

const notoSansKR = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "H.Research — 통계 분석 플랫폼",
  description: "한국 사회과학 연구자를 위한 통계 분석 SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} antialiased bg-background`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
