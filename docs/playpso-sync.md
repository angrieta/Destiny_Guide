# PlayPSO 데이터 동기화

`/drop-tables`와 `/database`는 PlayPSO에서 가져온 스냅샷 JSON을 빌드 시점에 읽어
정적으로 렌더링합니다. 방문자의 브라우저는 PlayPSO에 직접 요청하지 않습니다.

## 데이터 파일

| 파일 | 내용 | 사용처 |
| --- | --- | --- |
| `data/drop-tables-0..3.json` | Normal / Hard / Very Hard / Ultimate 드랍표 | `app/drop-tables/data.ts` |
| `data/database-1..5.json` | Weapons / Armor / Shields / Units / Mags | `app/database/data.ts` |
| `data/drop-sync-status.json` | 드랍표 마지막 확인·변경 시각 | 로그 및 상태 확인 |
| `data/database-sync-status.json` | 아이템 DB 마지막 확인·변경 시각, 총 아이템 수 | `/database` 하단 표시 |

상태 파일 구조:

```json
{
  "lastCheckedAt": "2026-08-20T00:05:13+09:00",
  "lastChangedAt": "2026-08-19T18:20:11+09:00",
  "status": "success",
  "itemCount": 1022
}
```

`lastCheckedAt`은 확인에 성공할 때마다 갱신되고, `lastChangedAt`은 PlayPSO의 실제
내용이 바뀐 경우에만 움직입니다. 따라서 "오늘 확인은 했지만 변경은 없었다"를 구분할 수 있습니다.

## 워크플로

| 워크플로 | 파일 | 역할 |
| --- | --- | --- |
| Sync Drop Tables | `.github/workflows/sync-drop-tables.yml` | 드랍표 확인 → 검증 → 변경 시에만 커밋 |
| Sync Item Database | `.github/workflows/sync-item-database.yml` | 아이템 DB 확인 → 검증 → 변경 시에만 커밋 |
| Deploy GitHub Pages | `.github/workflows/deploy-pages.yml` | 사이트 빌드 및 배포 |

두 sync 워크플로는 매일 `5 15 * * *` (UTC) = **한국시간 00:05**에 실행됩니다.
GitHub Actions의 cron은 UTC만 지원하며 `timezone` 키가 없으므로 UTC로 환산해 두었습니다.

동시에 같은 브랜치로 push하지 않도록 두 워크플로는 `playpso-sync` concurrency 그룹을
공유하고, push 충돌 시 `git pull --rebase` 후 최대 3회까지 재시도합니다.

### 불필요한 재배포 방지

확인만 하고 변경이 없는 날에도 `lastCheckedAt` 갱신 때문에 커밋이 발생합니다.
`deploy-pages.yml`은 `paths-ignore`로 상태 파일만 바뀐 push를 무시하므로,
사이트는 **실제 데이터가 바뀐 날에만** 다시 배포됩니다.

사이트에 표시되는 "Last automatic check"는 빌드 시점 값에 묶이지 않도록
`raw.githubusercontent.com`에서 상태 파일을 직접 읽습니다. 따라서 재배포 없이도
매일의 확인 시각이 최신으로 보입니다.

## 데이터 검증

`scripts/sync-*.mjs`는 새 데이터를 기존 스냅샷과 비교해 아래 중 하나라도 걸리면
**기존 JSON을 그대로 두고 워크플로를 실패**시킵니다.

- 파싱된 행이 0개
- `Name` 컬럼이 없음
- 이름이 있는 행이 95% 미만
- 행 수가 이전 대비 80% 미만으로 감소
- 기존에 있던 컬럼이 사라짐
- (드랍표) Episode 1 / 2 / 4 중 누락, 실제 드랍이 하나도 없음

잘못 수집된 빈 데이터가 사이트를 망가뜨리지 않도록 하기 위한 장치입니다.

## 실패 진단

수집 실패 시 로그에 아래 항목이 출력되고, 스크린샷·HTML 스냅샷·진단 JSON이
Actions artifact(`drop-tables-failure`, `item-database-failure`)로 업로드됩니다.

```
Reason              : CLOUDFLARE_CHALLENGE
Requested URL       : https://playpso.net/database?type=1
Current URL         : https://playpso.net/database?type=1
HTTP Status         : 403
document.title      : Just a moment...
Detected table count: 0
Error message       : page.waitForFunction: Timeout 120000ms exceeded.
Timestamp           : 2026-08-19T13:24:53.010Z
```

`Reason` 값: `CLOUDFLARE_CHALLENGE`, `TIMEOUT_WAITING_FOR_CONTENT`, `NO_TABLE_FOUND`,
`NETWORK_ERROR`, `UPSTREAM_SERVER_ERROR`, `HTTP_<code>`, `UNEXPECTED_DOM_STRUCTURE`,
`VALIDATION_FAILED`.

## 알려진 제약: PlayPSO의 데이터센터 IP 차단

PlayPSO는 **모든 경로**(`/robots.txt` 포함)를 Cloudflare Managed Challenge 뒤에 두고
있습니다. GitHub Actions 러너(Azure 데이터센터 IP)에서는 이 검증이 통과되지 않고
HTTP 403 + `Just a moment...`가 계속 반환됩니다. 일반 가정용 회선에서는 정상 접속됩니다.

이 저장소는 검증을 우회하는 코드를 포함하지 않습니다. 따라서 GitHub 호스팅 러너에서는
수집이 실패하며, 이때도 **기존 데이터는 절대 덮어쓰지 않습니다.**

### 데이터를 갱신하는 방법

가정용 회선이 있는 환경에서 실행하면 정상 동작합니다.

```bash
pnpm install
pnpm exec playwright install chromium
pnpm sync:drops
pnpm sync:database
git add data && git commit -m "chore: sync PlayPSO data" && git push
```

PC가 꺼져 있어도 자동으로 돌리려면 다음 중 하나가 필요합니다.

1. **PlayPSO 측에 허용 요청** — Discord로 GitHub Actions IP 허용 또는 공식 API 제공을 문의
2. **가정용 회선의 self-hosted runner** — 항상 켜져 있는 미니 PC / 라즈베리파이에
   GitHub self-hosted runner를 등록하고 워크플로의 `runs-on`을 바꾸면 됩니다
