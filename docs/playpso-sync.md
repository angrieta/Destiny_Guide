# PlayPSO 데이터 동기화

`/drop-tables`와 `/database`는 PlayPSO에서 가져온 스냅샷 JSON을 빌드 시점에 읽어
정적으로 렌더링합니다. 방문자의 브라우저는 PlayPSO에 직접 요청하지 않습니다.

## 자동 갱신: 브라우저 확장 (권장)

[extension/](../extension/) 폴더의 Chrome/Edge 확장을 설치하면 갱신이 자동화됩니다.
브라우저를 켤 때마다 확인하고(마지막 확인 후 20시간 경과 시), 바뀐 데이터만 커밋합니다.
PC가 자주 꺼져 있어도 켤 때 알아서 돌기 때문에 시각 고정 스케줄보다 잘 맞습니다.

설치 방법과 **포맷 후 복구 절차**는 [extension/README.md](../extension/README.md)를 참고하세요.
확장 코드와 데이터 모두 저장소에 있으므로 PC를 밀어도 잃어버리는 것이 없습니다.

아래 수동 절차는 확장을 쓰지 않거나, 다른 PC에서 한 번만 갱신할 때의 방법입니다.

## 데이터 갱신 방법

PlayPSO는 자동화된 브라우저를 차단하므로(아래 [제약](#제약-playpso는-자동화-브라우저를-차단합니다) 참고),
데이터는 **직접 열어둔 브라우저 안에서** 수집합니다. 반영은 사이트의 버튼으로 합니다.
개발 도구 설치가 전혀 필요 없어서 아무 PC에서나 갱신할 수 있습니다.

### 준비: GitHub 토큰 (최초 1회)

<https://github.com/settings/personal-access-tokens/new> 에서 fine-grained token 생성:

- **Repository access**: Only select repositories → `Destiny_Guide`
- **Permissions** → Repository permissions → **Contents: Read and write**
- 만료일은 짧게 설정하는 것을 권장합니다

토큰은 브라우저의 localStorage에만 저장되고 저장소에 커밋되지 않습니다.
**공용 PC에서는 "Remember on this device" 체크를 해제**하세요.

### 갱신 절차

| 대상 | 갱신 버튼 위치 | 수집 스크립트 | PlayPSO 페이지 |
| --- | --- | --- | --- |
| 아이템 DB | `/database` 하단 "Update data" | `scripts/collect-in-browser.js` | `/database` |
| 드랍표 | `/drop-tables` 하단 "Update data" | `scripts/collect-drops-in-browser.js` | `/drop-tables` |

1. Destiny Guide에서 해당 페이지를 열고 하단의 **Update data**를 누릅니다.
2. **1단계** — "Copy collector script"로 스크립트를 복사하고, "Open PlayPSO ↗"로 원본을 엽니다.
3. PlayPSO 페이지에서 표가 보일 때까지 기다린 뒤 `F12` → **Console** → 붙여넣고 Enter.
   ```
   Weapons: 490 rows
      first row: {Name: "3RD ANNIVERSARY BLADE", Type: "Dagger", …}
   Armor: 111 rows
   ...
   Downloaded playpso-database-snapshot.json - 5 categories, 1022 items.
   ```
   일부 분류를 못 읽으면 열어야 할 주소를 알려줍니다. 진행 상황은 탭에 저장되므로
   해당 페이지에서 스니펫을 다시 실행하면 이어서 모입니다.
4. **2단계** — 다운로드된 JSON을 Update data 패널에 드래그하거나 클릭해서 선택합니다.
5. **3단계** — 분류별 변경 내역이 표시됩니다.
   ```
   Weapons    2 added or changed, 0 removed
   Armor      no changes
   ...
   ```
   검증에 걸린 항목이 하나라도 있으면 **4단계 자체가 나타나지 않습니다.**
6. **4단계** — 토큰을 넣고 **Publish** 클릭. 변경된 파일이 **하나의 커밋**으로 `landing`에
   올라가고, 데이터가 실제로 바뀐 경우에만 GitHub Pages가 재배포됩니다.

### 명령줄로 갱신하기 (선택)

Node와 저장소가 있는 환경이라면 아이템 DB는 CLI로도 가능합니다.

```bash
pnpm import:snapshot ~/Downloads/playpso-database-snapshot.json
git add data && git commit -m "chore: sync PlayPSO item database" && git push
```

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

`lastCheckedAt`은 확인에 성공할 때만 갱신되고, `lastChangedAt`은 PlayPSO의 실제 내용이
바뀐 경우에만 움직입니다. `status`는 `success` / `blocked` / `failed` 중 하나입니다.

## 데이터 검증

`import:snapshot`과 자동 sync 스크립트는 동일한 검증을 거칩니다. 아래 중 하나라도
걸리면 **기존 JSON을 그대로 두고** 해당 분류를 거부합니다.

- 파싱된 행이 0개
- `Name` 컬럼이 없음
- 이름이 있는 행이 95% 미만
- 행 수가 이전 대비 80% 미만으로 감소
- 기존에 있던 컬럼이 사라짐
- 분류 이름이 예상과 다름 (`type=2`인데 `Weapons` 등)
- (드랍표) Episode 1 / 2 / 4 중 누락, 실제 드랍이 하나도 없음

잘못 수집된 빈 데이터가 사이트를 망가뜨리지 않도록 하기 위한 장치입니다.

## 워크플로

| 워크플로 | 파일 | 역할 |
| --- | --- | --- |
| Sync Drop Tables | `.github/workflows/sync-drop-tables.yml` | 매일 접근 가능 여부 확인, 가능해지면 자동 수집 |
| Sync Item Database | `.github/workflows/sync-item-database.yml` | 위와 동일 |
| Deploy GitHub Pages | `.github/workflows/deploy-pages.yml` | 사이트 빌드 및 배포 |

두 sync 워크플로는 매일 `5 15 * * *` (UTC) = **한국시간 00:05**에 실행됩니다.
GitHub Actions의 cron은 UTC만 지원하며 `timezone` 키가 없으므로 UTC로 환산했습니다.

현재는 PlayPSO 차단 때문에 실제 수집이 되지 않지만, 워크플로는 그대로 유지합니다.
PlayPSO가 차단을 완화하면 **아무것도 고치지 않아도 자동으로 동기화가 재개**됩니다.

동시에 같은 브랜치로 push하지 않도록 두 워크플로는 `playpso-sync` concurrency 그룹을
공유하고, push 충돌 시 `git pull --rebase` 후 최대 3회까지 재시도합니다.

### 불필요한 재배포 방지

확인만 하고 변경이 없는 날에도 `lastCheckedAt` 갱신 때문에 커밋이 발생할 수 있습니다.
`deploy-pages.yml`은 `paths-ignore`로 상태 파일만 바뀐 push를 무시하므로,
사이트는 **실제 데이터가 바뀐 날에만** 다시 배포됩니다.

차단 상태(`status: "blocked"`)가 이어지는 동안에는 상태 파일이 매번 동일한 내용으로
기록되므로 git이 변경을 감지하지 않고, 따라서 커밋도 배포도 발생하지 않습니다.

사이트에 표시되는 "Last automatic check"는 빌드 시점 값에 묶이지 않도록
`raw.githubusercontent.com`에서 상태 파일을 직접 읽습니다.

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

`CLOUDFLARE_CHALLENGE`는 예상된 상태이므로 워크플로를 실패 처리하지 않고 경고만 남깁니다.
그 외의 원인은 실제 회귀이므로 워크플로가 빨간색으로 실패합니다.

## 제약: PlayPSO는 자동화 브라우저를 차단합니다

PlayPSO는 **모든 경로**(`/robots.txt` 포함)를 Cloudflare Managed Challenge 뒤에 둡니다.

```
$ curl -sI https://www.playpso.net/robots.txt
HTTP/1.1 403 Forbidden
Cf-Mitigated: challenge
```

측정 결과:

| 환경 | 결과 |
| --- | --- |
| GitHub Actions + headless Chromium | 403, `Just a moment...` (120초 대기 후 타임아웃) |
| 가정용 회선 + headless Edge | 403, 동일 |
| 가정용 회선 + **화면에 보이는** Edge (Playwright 제어) | 403, 동일 |
| 가정용 회선 + 직접 조작하는 브라우저 | **정상** |

즉 IP 문제가 아니라 **Playwright/CDP로 제어되는 브라우저 자체를 차단**합니다.
이 저장소는 그 차단을 우회하는 코드를 포함하지 않으므로, 자동 수집은 동작하지 않으며
이때도 **기존 데이터는 절대 덮어쓰지 않습니다.**

자동화를 되살리려면 PlayPSO 측의 협조가 필요합니다.
보낼 요청 문안은 [docs/playpso-request.md](playpso-request.md)에 준비해 두었습니다.
승인되면 워크플로는 고칠 필요 없이 그대로 동작합니다.
