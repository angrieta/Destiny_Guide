# PSOBB Destiny Guide

Phantasy Star Online Blue Burst - Destiny 서버 공략 사이트입니다.
초보자 루트, 캐릭터 정보, 아이템 도감, 레이드 공략, 계산 도구를 제공합니다.

## 페이지 구성

| 파일 | 내용 |
| --- | --- |
| `index.html` | 메인 랜딩 페이지 |
| `beginner_page.html` | 초보자 가이드 / 육성 루트 |
| `character_aria.html` | 캐릭터별 정보 |
| `item_page.html` | 아이템 도감 |
| `updates_page.html` | Discord 공지 기반 최신 패치 / 다음 업데이트 허브 |
| `dn.html` | Destiny 던전 공략 |
| `discontrolled_tower_raid.html` | Discontrolled Tower 레이드 공략 |
| `dmc_page.html` | DMC 페이지 |
| `Psobb_tool.html` | 계산 도구 |
| `/drop-tables` | 난이도·Section ID·에피소드·지역·아이템 종류별 드랍 검색 |
| `/database` | 무기·방어구·실드·유닛·마그 통합 검색 (PlayPSO Item Database 미러) |
| `header.html` | 공통 헤더 (`scripts/include.js`가 런타임에 주입) |

## 헤더 검색

모든 페이지의 헤더에 검색 버튼이 있습니다. `Ctrl`/`⌘` + `K` 또는 `/` 로도 열립니다.
사이트 안의 페이지와 아이템 1000여 개를 한 번에 찾고, 아이템은 상세 화면으로 바로 보냅니다.

- Destiny 전용 아이템 → `item_page.html?item=<id>` (도감 상세창이 열립니다)
- 그 외 아이템 → `/database/?item=<id>`

검색 인덱스는 `scripts/build-search-index.mjs` 가 `data/database-*.json` 과
`scripts/destiny_catalog.js` 에서 뽑아 `data/search-index.json` 으로 만듭니다.
`pnpm dev` / `pnpm build` 가 `build/prepare-static.mjs` 를 거치며 매번 다시 만들기 때문에
아이템 데이터를 동기화한 뒤 따로 챙길 것은 없습니다. 직접 만들려면:

```bash
node scripts/build-search-index.mjs
```

UI 는 정적 페이지(`scripts/site_search.js`)와 React 라우트(`app/components/SiteSearch.tsx`)에
한 벌씩 있습니다. 헤더 자체가 `header.html` 과 `app/components/SiteHeader.tsx` 로 나뉘어 있어
같은 구조를 따랐습니다. **한쪽을 고치면 반대쪽도 고쳐야 합니다.** 인덱스와
스타일(`styles/search.css`)은 공유하므로 결과 모양과 순위는 저절로 같이 갑니다.

## 디렉터리

```
app/       Next.js(vinext) 진입점 — /index.html 로 리다이렉트
build/     정적 파일 준비 스크립트 및 Vite 플러그인
images/    이미지 에셋
scripts/   페이지별 클라이언트 스크립트, 헤더 인클루드, 테마 토글, 헤더 검색
styles/    reset / common / index / responsive / search CSS
worker/    Cloudflare Worker 엔트리
```

## 실행 방법

Node.js 22.13 이상과 pnpm이 필요합니다.

```bash
pnpm install
pnpm dev      # 개발 서버
pnpm build    # 프로덕션 빌드
pnpm start    # 빌드 결과 실행
```

`pnpm dev` / `pnpm build`는 먼저 `build/prepare-static.mjs`를 실행해
`images`, `scripts`, `styles`와 루트의 HTML 파일을 `.sites-static/`으로 복사합니다.
(`test.html`과 모든 `.gif`는 이 과정에서 제외됩니다.)

## 이미지에 대한 참고

`images/index/`의 배경 애니메이션은 `.webp`로 제공됩니다.
원본 `.gif` 파일은 용량이 커서 저장소에 포함하지 않았으며,
빌드 스크립트와 `.gitignore` 모두 `.gif`를 제외하도록 설정되어 있습니다.

## 기술 스택

- Next.js 16 (vinext) + React 19
- Vite 8
- Cloudflare Workers (`wrangler`)
- TypeScript 5.9


## PlayPSO 데이터 동기화

PlayPSO가 자동화 브라우저를 차단하므로 서버에서는 수집할 수 없습니다.
데이터는 직접 연 브라우저에서 수집한 뒤 명령줄로 반영합니다.

1. PlayPSO 페이지를 열고 표가 보일 때까지 대기
2. `F12` → Console에 수집 스크립트 붙여넣기 → JSON 다운로드
   - 아이템 DB: `scripts/collect-in-browser.js`
   - 드랍표: `scripts/collect-drops-in-browser.js`
3. 저장소에 반영

```bash
pnpm import:snapshot ~/Downloads/playpso-database-snapshot.json
```

검증에 걸리면 기존 파일을 그대로 두고 거부합니다.
자세한 내용은 [docs/playpso-sync.md](docs/playpso-sync.md)를 참고하세요.

## Discord 콘텐츠 감사 자료

- [전체 120개 채널 근거표](docs/discord-channel-inventory-2026-08-29.md)
- [왼쪽 사이드바 83개 채널 교차검증](docs/discord-sidebar-crosscheck-2026-08-29.md)
- [정보형 포럼 본문·답글 보강](docs/discord-forum-deep-dive-2026-08-29.md)
- [사이트에 사용할 정보 요약](docs/discord-content-audit-2026-08-29.md)
- [페이지별 소재 배치표](docs/discord-page-materials-2026-08-29.md)
- [선별 원본 이미지 목록](images/discord/README.md)
- [기계 판독용 감사 데이터](data/discord-channel-audit-2026-08-29.json)
