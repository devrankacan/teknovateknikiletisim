import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Teknovateknik | İletişim Merkezi",
  description: "Teknovateknik çoklu platform iletişim merkezi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
