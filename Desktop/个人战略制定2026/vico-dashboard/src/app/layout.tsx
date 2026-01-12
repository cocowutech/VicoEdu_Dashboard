import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@/components/layout/MainLayout";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vico Education 战略仪表盘",
  description: "事业战略顶层设计 · 动态财务计算 · 产品矩阵",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${inter.className} antialiased bg-gray-50`}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}
