import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mutual NDA | prelegal",
  description:
    "Create a Common Paper Mutual Non-Disclosure Agreement from a short form.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
