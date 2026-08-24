import type { Metadata } from "next";
import "./globals.css";
import "../styles/design-system.css";
import { I18nProvider } from "./i18n/i18n";

// next.config.ts 와 같은 값을 쓴다. 절대 경로로 두면 GitHub Pages 의
// basePath(/Destiny_Guide) 아래에서 도메인 루트를 찾아가 404 가 난다.
const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "PSOBB Destiny Guide",
  description: "Beginner routes, character stats, Destiny items, raids, and tools for Destiny PSOBB.",
  icons: {
    icon: `${basePath}/images/common/favicon.jpg`,
    shortcut: `${basePath}/images/common/favicon.jpg`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}

