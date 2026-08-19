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
| `dn.html` | Destiny 던전 공략 |
| `discontrolled_tower_raid.html` | Discontrolled Tower 레이드 공략 |
| `dmc_page.html` | DMC 페이지 |
| `Psobb_tool.html` | 계산 도구 |
| `/drop-tables` | 난이도·Section ID·에피소드·지역·아이템 종류별 드랍 검색 |
| `/database` | 무기·방어구·실드·유닛·마그 통합 검색 (PlayPSO Item Database 미러) |
| `header.html` | 공통 헤더 (`scripts/include.js`가 런타임에 주입) |

## 디렉터리

```
app/       Next.js(vinext) 진입점 — /index.html 로 리다이렉트
build/     정적 파일 준비 스크립트 및 Vite 플러그인
images/    이미지 에셋
scripts/   페이지별 클라이언트 스크립트, 헤더 인클루드, 테마 토글
styles/    reset / common / index / responsive CSS
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

PlayPSO가 자동화 브라우저를 차단하므로, 데이터 갱신은 직접 연 브라우저에서
콘솔 스니펫으로 수집한 뒤 가져옵니다. 전체 절차는
[docs/playpso-sync.md](docs/playpso-sync.md)를 참고하세요.

1. <https://www.playpso.net/database> 를 열고 표가 보일 때까지 대기
2. `F12` → Console에 `scripts/collect-in-browser.js` 내용 붙여넣기 → JSON 다운로드
3. 저장소에서 가져오기

```bash
pnpm import:snapshot ~/Downloads/playpso-database-snapshot.json
```
