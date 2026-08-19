# PlayPSO에 보낼 데이터 접근 요청 문안

PC가 꺼져 있어도 완전 자동으로 동기화하려면 PlayPSO 측의 협조가 필요합니다.
아래 문안을 Discord나 포럼(Help & Support)에 보내시면 됩니다.

상대가 승인하기 쉽도록 **용도 / 빈도 / 출처 표기 / 대안**을 모두 담았습니다.
`Destiny Guide` 링크와 Discord 아이디는 실제 값으로 바꿔주세요.

---

## 영어 (권장)

> **Subject: Request for data access for a Korean community guide site**
>
> Hi, thanks for running Destiny.
>
> I maintain a Korean-language guide site for Destiny players:
> https://angrieta.github.io/Destiny_Guide/
>
> It mirrors the item database and drop tables so Korean players can search them
> with a translated, mobile-friendly interface. The data is credited to PlayPSO
> and every page links back to the original at playpso.net.
>
> Right now I keep it up to date by hand, because automated requests to
> playpso.net receive a Cloudflare challenge. I want to be clear that I have not
> tried to work around that, and I do not intend to — that is why I am asking
> instead.
>
> Would any of these be possible?
>
> 1. A JSON endpoint (or a periodic data dump) for the item database and drop tables
> 2. Allowing a single GitHub Actions job to fetch `/database` and `/drop-tables`
>    once per day, from a fixed user agent I would identify clearly
> 3. Any existing data source I may have missed
>
> The load would be tiny: one request per category, once a day — four to nine
> page loads total, less than a single player browsing the site.
>
> If none of this is possible, that is completely fine and I will keep updating
> manually. I would just rather ask than assume.
>
> Thank you for your time.
>
> — angrieta (Discord: `<your-discord-id>`)

---

## 한국어 (참고용, 실제로는 영어로 보내는 것을 권장)

> 안녕하세요. Destiny 서버 운영에 감사드립니다.
>
> 저는 한국어 Destiny 공략 사이트를 운영하고 있습니다:
> https://angrieta.github.io/Destiny_Guide/
>
> 한국 유저들이 아이템과 드랍 정보를 더 쉽게 검색할 수 있도록
> PlayPSO의 데이터를 미러링하고 있으며, 모든 페이지에 출처와 원본 링크를 표기하고 있습니다.
>
> 현재는 수동으로 갱신하고 있습니다. playpso.net에 자동 요청을 보내면
> Cloudflare 확인 화면이 반환되기 때문입니다.
> 이를 우회하려는 시도는 하지 않았고 앞으로도 할 생각이 없어서,
> 대신 정식으로 요청드립니다.
>
> 혹시 다음 중 가능한 것이 있을까요?
>
> 1. 아이템 DB / 드랍 테이블의 JSON endpoint 또는 주기적 데이터 덤프
> 2. GitHub Actions 작업 1개가 하루 1회 `/database`, `/drop-tables`를
>    조회하도록 허용 (User-Agent를 명확히 식별 가능하게 설정하겠습니다)
> 3. 제가 놓친 기존 데이터 소스가 있다면 안내
>
> 부하는 매우 작습니다. 분류당 1회, 하루 1회로 총 4~9회 페이지 로드이며
> 유저 한 명이 사이트를 둘러보는 것보다 적습니다.
>
> 어렵다면 전혀 괜찮습니다. 계속 수동으로 갱신하겠습니다.
> 다만 임의로 판단하기보다 여쭤보는 것이 맞다고 생각했습니다.
>
> 감사합니다.

---

## 승인되면 할 일

이미 준비되어 있습니다. 상황별로:

- **JSON endpoint를 받은 경우** — `scripts/sync-item-database.mjs`의
  `extractCategory`를 `fetch(endpoint)`로 교체하면 됩니다. 검증·상태 기록·커밋·배포는
  그대로 동작합니다.
- **GitHub Actions IP를 허용받은 경우** — 아무것도 고칠 필요가 없습니다.
  `.github/workflows/sync-*.yml`이 이미 매일 00:05 KST에 돌고 있으며,
  차단이 풀리는 순간 자동으로 동기화가 재개됩니다.

두 경우 모두 PC를 켤 필요가 없어집니다.
