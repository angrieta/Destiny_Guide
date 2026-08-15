import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PSOBB Destiny Guide",
  description: "Beginner routes, character stats, Destiny items, raids, and tools for Destiny PSOBB.",
  icons: {
    icon: "/images/common/favicon.jpg",
    shortcut: "/images/common/favicon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

