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
    // translate="no" 는 브라우저 자동 번역을 막는다. 사이트가 en/ko/ja/es/fr 사전을
    // 직접 들고 있어 중복이기도 하지만, 진짜 이유는 따로 있다: 구글 번역은 텍스트 노드를
    // <font> 로 갈아끼우는데 그러면 React 가 자기 노드를 잃어버려 갱신이 먹지 않는다.
    // 파티 인원을 4P 로 바꿔도 DAR 표시가 100% 에서 굳던 증상이 그것이었다.
    <html lang="en" translate="no">
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}

