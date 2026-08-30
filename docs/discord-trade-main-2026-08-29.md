# Discord 거래·메인 채널 정리 — 2026-08-29

이전 감사(`discord-channel-inventory-2026-08-29.md`)에서 "동적 표본"으로만 처리하고 넘어간
`💰Trade Channels` 5개와 `🎮Main Channels` 9개를 채널별로 다시 읽은 결과다.

정리 기준
- 사이트 콘텐츠로 쓸 수 있는 **고정 정보**(규칙, 해결법, 도구, 수치, 목록)를 우선한다.
- 개인 거래 가격·닉네임·매물 목록은 시세가 계속 바뀌고 개인 정보라 원문을 복제하지 않는다.
  대신 **규칙과 구조**만 남긴다.
- 이미지는 콘텐츠에 쓸 만한 것만 원본 URL로 기록한다.

---

## 1. `✅guideline` — 거래 규칙 진입점

- 메시지 **1개**뿐인 안내 채널. 작성자 VEL(JP)(GM), 2025-02-01 작성, 2025-11-09 수정.
- 본문은 두 개의 채널 링크와 경고문뿐이다.
  - Trade Guideline → `💰trades` 포럼의 가이드라인
  - Auction Guideline → `🪙auctions` 포럼의 가이드라인
  - "Abusing rules may cause access block from this section."
  - "Not knowing is not an reason to evade penalty." (규칙을 몰랐다는 것은 면책 사유가 아님)
- 이미지·첨부 **없음**.

**사이트 적용**: `economy_page.html`의 거래 안내에 "규칙 위반 시 거래 채널 접근 차단, 미숙지는 면책되지 않음" 한 줄로 반영. 실제 규칙 본문은 아래 2~4번 포럼 가이드라인에서 가져온다.

## 2. `💰trades` — 거래 포럼 (게시물 732개 확인)

### 2-1. 고정 규칙 (Trades Guideline 전문)

포럼 상단 `포스트 가이드라인`에 고정되어 있다. 시세와 달리 바뀌지 않는 내용이라 그대로 옮긴다.

> The market section is intended to discuss trades for in game items, currency and Donation Tokens.

- **제목 접두사가 강제된다** — 판매 `S>`, 구매 `B>`, 교환 `T>`.
- **동시 거래글 최대 5개.**
- **글 끌어올리기(bump)는 하루 1회, 글 하나만.**
- 금지 행위
  - 남의 거래글 흐름 끊기 (derail)
  - 가격에 대해 공개적으로 불평·훈수 두기
  - 거래 의사 없이 거래글에 댓글 달기
- 위 행위는 스팸으로 간주되어 경고 또는 계정 조치 대상이다.
- 가격은 파는 사람 마음이다. 부당하다고 생각하면 공개 저격이 아니라 DM으로 정중히 말하거나, 규칙 위반이면 신고한다.
- 상세 규칙 원문: <https://playpso.net/forums/topic/1313-trade-and-auction-rules/>

**태그**: `buying` · `selling` · `trading` · `[Done]`

### 2-2. 통화 환산 (게시물에서 반복 확인된 기준)

여러 판매자가 글머리에 같은 비율을 적어 두어 사실상 서버 표준으로 굳어져 있다.

| 기준 | 확인 횟수 |
|---|---:|
| **10 PD = 2 PT** | 23 |
| **1 DT = 2 PT** | 9 |
| **1 DT = 10 PD** | 3 |
| **1 MPC = 5 DT** | 3 |
| 1 PT = 5 PD | 3 |
| 50 PD = 1 MPC | 1 |

정리하면 **1 MPC = 5 DT = 10 PT = 50 PD** 로 전부 맞아떨어진다.
(DT = Donation Token, PT = Photon Token, PD = Photon Drop, MPC = Millennium Photon Core)

### 2-3. 시세 관찰값 — **2026-08-29 기준 스냅샷**

가격은 계속 변한다. 아래는 위 732개 게시물에서 2회 이상 관찰된 값의 범위이며,
**"이 정도 자릿수"를 보는 용도**다. 확정 가격표가 아니다. 닉네임은 기록하지 않는다.

| 아이템 | 관찰 | 최저 | 중앙 | 최고 |
|---|---:|---:|---:|---:|
| Parasitic Armor 'Predator' | 2 | 225 DT | 225 | 225 |
| Chaos Engine | 10 | 60 DT | 80 | 110 |
| D-Virus Shield | 5 | 60 DT | 70 | 80 |
| Raster Scope | 4 | 60 DT | 60 | 65 |
| Prophet of Motav | 6 | 20 DT | 60 | 70 |
| Parasitic Gene "Flow" | 3 | 60 DT | 60 | 60 |
| Vector Scope | 3 | 50 DT | 60 | 65 |
| Astral Essence | 6 | 40 DT | 50 | 55 |
| Chaos Halo | 3 | 40 DT | 50 | 100 |
| Primal Photon Sphere | 3 | 30 DT | 30 | 50 |
| Red Crystal | 2 | 30 DT | 30 | 30 |
| Darkness Photon Sphere | 4 | 25 DT | 30 | 30 |
| Astral Dragon | 5 | 25 DT | 30 | 30 |
| Astral Dragon Blueprint | 3 | 30 DT | 30 | 30 |
| Paragon Frame | 4 | 13 DT | 20 | 20 |
| Cladding of Manipulator III | 4 | 15 DT | 20 | 20 |
| Orb of Illusions | 3 | 15 DT | 15 | 20 |
| Bat Wing | 5 | 12 DT | 15 | 25 |
| State/Maintenance | 2 | 5 DT | 5 | 5 |
| Proof of Sonic Team | 2 | 3 DT | 5 | 5 |
| Dark Matter | 2 | 15 PT | 20 | 20 |

**사이트 적용**: `economy_page.html`에 "환산표(고정)"와 "시세 참고(스냅샷·날짜 표기)"를 **분리**해서 넣는다.
환산표는 안정적이라 그대로 써도 되고, 시세표는 관측일과 "확정가 아님"을 반드시 병기한다.
개별 매물·닉네임은 옮기지 않는다.

## 3. `🪙auctions` — 경매 포럼 (게시물 111개 확인, 종료 96개)

### 3-1. 고정 규칙 (Auction Guideline 전문)

포럼 가이드라인과 별도로 VEL(JP)의 고정 게시물 `✅Auction Guideline (Eng/JP)`이 같은 내용을 영·일 2개 국어로 안내한다.

- 제목은 **`A>` 로 시작**. 동시 경매 **최대 2건**.
- 경매글에 반드시 있어야 하는 4가지
  1. **시작가(start bid)**
  2. **종료일 또는 첫 입찰로부터의 카운트다운**
  3. **리셋 시간 — 최소 24시간** (안 적으면 24시간 자동 적용)
  4. **최소 입찰 단위** (안 적으면 1 PD 자동 적용)
- **리셋 규칙**: 종료 24시간 안에 새 입찰이 들어오면 종료일이 24시간 연장된다. 시간대가 다른 사람들에게 공평하게 하려는 장치다.
- 시작가에 팔 생각이 없는 물건은 올리지 않는다. **경매가 끝나면 최고가 입찰자에게 넘어간다, 예외 없음.**
- 스캠 또는 스팸으로 간주되는 행위
  - 없는 물건을 경매에 올리는 것
  - 최고 입찰을 거부하는 것
  - 없는 아이템·재화로 입찰하는 것
  - 종료 후 발을 빼는 것
- **금지**
  - 입찰이 들어온 뒤 경매 취소 (입찰이 하나도 없을 때만 취소 가능)
  - 입찰 취소·수정
  - **DM 입찰** — 반드시 경매글에 공개 입찰
  - 입찰이 들어온 뒤 경매 규칙 수정

### 3-2. 실제 관행 (96건 종료 경매에서 집계)

규칙은 최소값만 정하고 나머지는 관행으로 굳어져 있다. 처음 경매 여는 사람에게 이 분포가 규칙보다 실용적이다.

| 항목 | 가장 흔한 값 | 분포 |
|---|---|---|
| 시작가 | **5 PD** (38건) | 1 PD(25) · 5 PD(41) · 10 PD(16) |
| 최소 입찰 단위 | **5 PD** (59건) | 2 PD(8) · 3 PD(12) · 5 PD(59) · 10 PD(15) |
| 카운트다운 | **48시간** (57건) | 48h(57) · 72h(36) · 96h(3) |

즉 **"시작가 5 PD · 단위 5 PD · 48시간"이 이 서버의 표준 경매 양식**이다.

### 3-3. 낙찰가 관찰 (제목의 `CHB` = Current Highest Bid)

| 아이템 | 최고 입찰 |
|---|---|
| Parasitic Armor 'Predator' [슬롯 4 / def 0 / evp 0] | **255 DT** |
| XMAS SPIRIT 2정 + 4th Anniversary Orb 묶음 | 56 DT |
| EXCALIBUR [0/0/90/90\|0] | 9 PT |

Parasitic Armor 'Predator'는 `trades` 쪽 관찰(225 DT)과 합쳐 보면 **225~255 DT 구간**으로, 현재 서버 최고가 장비군이다.

**사이트 적용**: `economy_page.html`에 "경매 여는 법" 절을 신설. 규칙 4가지 + 표준 양식(5PD/5PD/48h)을 넣으면 신규 유저가 바로 쓸 수 있다. `CHB` 약어도 용어집에 넣는다.

## 4. `📝players-tradelist` — 상시 거래목록 포럼 (26개)

거래글이 아니라 **플레이어별 상설 목록**이다. 한 사람이 게시물 하나를 파고 계속 수정한다.
개별 매물은 계속 바뀌므로 옮기지 않되, 목록 머리에 각자 적어 둔 **환율 선언**은 자료 가치가 있다.

- 포럼 가이드라인 패널은 **없다** (규칙은 `✅guideline` → `💰trades` 쪽을 따른다).
- 다수가 `GC#`(게임 캐릭터 번호)와 접속 가능 시간대를 함께 적어 둔다.

### 환율 선언 집계 (26개 목록 + trades 732개 교차)

| 기준 | tradelist | trades | 판정 |
|---|---:|---:|---|
| 10 PD = 2 PT | 9 | 23 | **고정** |
| 1 DT = 10 PD | 3 | 3 | **고정** |
| 1 DT = 2 PT | 2 | 9 | **고정** |
| 1 DT = 2 Crate | 5 | – | 고정으로 보임 |
| 99 PD = 1 PS (Photon Sphere) | 1 | – | 관찰 1건, 참고만 |
| **1 MPC = 8 DT** | 5 | – | **불일치** |
| **1 MPC = 5 DT** | – | 3 | **불일치** |

**정리 결론**:
- 안정 구간 — **1 DT = 2 PT = 10 PD = 2 Crate**. 이건 표로 못 박아도 된다.
- 변동 구간 — **MPC는 5~8 DT로 관측이 갈린다.** 사이트에 단일 숫자로 적으면 안 되고 "5~8 DT, 시세 변동 큼"으로 적어야 한다. MPC가 조합 재료(IGNIS ENGINE 등 7종)라 수요가 몰릴 때 튀는 것으로 보인다.
- `PS`(Photon Sphere)는 표본이 1건뿐이라 참고만.

**사이트 적용**: `economy_page.html` 환산표 + 용어집(DT/PT/PD/PS/MPC/Crate/GC#/CHB).

---

# Main Channels

## 5. `game-modifications` — 스킨·모드 배포 (메시지 994개, 2022-10-03 ~ 2026-08-26)

**이 채널이 Main Channels 중 콘텐츠 가치가 가장 높다.** 이미지 370개, 외부 링크 48개.
채널 시작점까지 확인했다. 사실상 **Destiny 서버 비공식 모드 저장소**다.

### 5-1. 정식 정리처 (여기부터 링크할 것)

- **Cherry's Mods & Customization** — <https://playpso.net/forums/topic/1198-cherrys-mods-customization/>
  Discord에 흩어진 Cherry의 모드를 포럼에 모아 둔 글. 2024-04-15 HammaHead9000이 "인기 모드라 여기 정리해 둔다"며 안내.
- **PSOBB 개발 포럼** — <https://playpso.net/forums/forum/12-development/> (리스킨 입문 문의 시 안내되는 곳)
- **ogg 루프 요청 스레드** — <https://playpso.net/forums/topic/1187-ogg-loop-request-thread/> (EtchYourSketch, 2022-11-12). 커스텀 BGM 루프를 요청받아 만들어 주는 창구.

### 5-2. 외부 모드 아카이브 (채널에서 반복 추천)

- **Univers-PS 스킨 목록** — <http://universps.online.fr/pso/bb/skin/listeSkinUS.php5>
- **Pioneer2.net Skins & Mods 포럼** — <https://www.pioneer2.net/community/forums/skins-and-mods.11/>

### 5-3. 배포된 모드 목록 (제작자 · 날짜순)

**Cherry ❀ — 이 채널 최대 제작자.** 대부분 MediaFire 배포.

| 분류 | 모드 | 날짜 |
|---|---|---|
| 캐릭터 스킨 | Red/Black · Yin/Yang · White/Black(어두운 드레스) · Purple/Black · Dark Purple · Fire Orange · Pink Momoka | 2022-10 ~ 2024-03 |
| 캐릭터 스킨 | Blue/Red Nurse Recolor · Bloody Nurse | 2022-10, 2023-05 |
| 캐릭터 스킨 | Magma HUcaseal(빨강) · Violet HUcaseal | 2022-12, 2023-10 |
| 캐릭터 스킨 | Hunewearl Galaxy Outfit · Huney Red Summer · Foney Skin 01(2종 포함) | 2024-10 |
| 이펙트 | Cherry's PSOBB Effects (Momoka 의상 + HUD 포함) | 2022-10-04 |
| 이펙트 | Alternate effects + techs (컬러풀) | 2022-10-11 |
| 이펙트 | **Transparent Dark Flow Wave** — 이 채널 최고 인기 모드, 재게시 2회 | 2023-01, 2024-03 |
| 이펙트 | Dark Flow Emerald Wave | 2023-01 |
| 이펙트 | Transparent Flow + MA85 Fury bullets (수정판) | 2025-02 |
| 이펙트 | Cherry PSOBB Ice Pack | 2023-06 |
| 이펙트 | Updated Cherry Efx Version 3 — 파이프·로딩화면 등 수정 | 2024-03-24 |
| UI | custom HD HUD (Rainbow Text 포함) | 2022-11 |
| UI | PSOBB Font Recolor | 2024-03 |
| 오브젝트 | Mosaic Boxes (Depassage 요청으로 Destiny 서버용 재작업) · item_boxes · Galaxy Item Pack | 2022-11 ~ 2024-03 |
| 배경 | PSO Splash Screen · Lofi PSOBB Background · Castle Courtyard Lobby | 2023-04 ~ 2024-10 |

**그 외 제작자**

- **Roland** (2025-01-01) — Episode 3 Custom HUD + Member Numbers. Univers-PS의 EP3 HUD에 파티원 번호를 추가한 소폭 수정판.
- **Shiva** (2023-12, Cherry 대리 게시) — MEGA 배포.
- **Linis** (2025-01) — Magic Bazooka 영상. 이 클라이언트에서 16:9 비율이 안 나온다는 기록이 남아 있다.
- **Blue** (2025-04) — 'Bibbles 제작 영상.

### 5-4. 게임 외 도구·참고

- **RAcast 발소리 오디오 모드** — Reddit r/PSO (2024-03-24 공유, 변경 범위 미확인)
- **Lossless Scaling** (Steam, 2026-08-01 Rang3r) — 저해상도 클라이언트 업스케일링용 외부 유틸.
- PSOBB 디컴파일 프로젝트 존재 여부 문의(2024-04, JayD) — **없다는 결론**. Zelda OOT 같은 디컴파일 레포는 PSOBB엔 없음.

### 5-5. 사이트 적용 판단

- **신규 페이지 `mods_page.html` 후보로 충분하다.** 지금 사이트에 모드/스킨 항목이 아예 없다.
- 구성 제안: ① 모드 적용법(파일 교체 위치) ② 인기 모드 표 ③ 공식 정리처 링크 ④ 주의사항.
- **파일은 재호스팅하지 않는다.** MediaFire/MEGA 원본 링크로만 연결하고, 가능하면 포럼 정리글(topic/1198)을 1순위로 건다. 링크 만료 가능성을 명시할 것.
- 이미지 370개 중 모드 적용 전/후 스크린샷이 다수라, 페이지에 쓸 대표 컷 선별이 필요하다(별도 작업).
- 제작자 크레딧(Cherry, Roland, Shiva, EtchYourSketch)을 반드시 표기한다.

## 6. `❓help-and-support` — 문제 해결 (메시지 1,394개, 2024-02-25 ~ 2025-03-16)

시작점까지 확인. **마지막 글이 2025-03-16이라 사실상 정지 상태**다. 이후 질문은 `general-chat` 등으로 옮겨간 것으로 보인다.
이미지 40개. 주요 응답자는 Roland(96) · Oguri Cap(93) · Linis(87) · Hudo(87) · Orgodemirk(83) · HammaHead9000(56) · VEL(JP)(51).

### 6-1. 운영진 공식 문제 해결 안내 — RedEyes, 2024-02-25 (채널 개설 글)

> Destiny와 다른 PSOBB 서버는 안전하며 PC를 감염시키려 하지 않는다. 백신 관련 문제는 게임에 적용된 수정 때문에 일부 백신이 그 **동작**을 트로이목마로 오탐하는 것이다.

**증상별 해결 (원문 그대로 옮김)**

| 증상 | 해결 |
|---|---|
| 설치 프로그램이 동작하지 않음 | 다운로드·실행 전에 **백신을 끈다.** 오탐으로 분류돼 있음에도 위협으로 잡는 백신이 있다. |
| 설치했는데 게임이 실행되지 않음 | 백신을 다시 켜기 **전에** `C:\Program Files\PSOBB Destiny` 폴더를 백신과 Windows Defender 예외에 등록한다. 격리함(quarantine)에 들어가 있지 않은지도 확인한다. |
| Windows Defender 예외 등록 경로 | 설정 → 개인 정보 및 보안 → Windows 보안 → 바이러스 및 위협 방지 → 설정 관리 → 제외 추가 또는 제거 → `C:\Program Files\PSOBB Destiny` 추가 |
| 런처에서 Play를 누르면 켜졌다 바로 꺼짐 | **런처 옵션의 해상도가 모니터 최대 해상도를 넘지 않게 한다.** 넘으면 그냥 열렸다 닫힌다. 안 되면 해상도를 바꿔가며 되는 값을 찾는다. |
| 무작위 접속 끊김 | 라우터가 좋지 않다면 **무선 연결을 피한다.** |
| 아이디를 잊음 | **길드카드 번호가 필요하다.** `C:\Program Files\PSOBB Destiny\log` 폴더의 채팅 로그에서 찾거나, 계정 인증 메일을 찾는다. 아니면 GC나 DT를 주고받은 플레이어에게 물어본다. 그 정보를 들고 운영진에게 문의. |

### 6-2. 그 밖에 반복된 문제와 답 (운영진 답변 기준)

- **와이드스크린에서 실행 안 될 때** (Orgodemirk, 2025-02-01) — 런처에서 **사운드를 끄고** 와이드스크린으로 실행 → 게임 종료 → **사운드를 켜고** 다시 와이드스크린으로 실행.
- **구버전 받기** (Orgodemirk, 2024-09-15) — 최신 클라이언트에서 크래시가 나면 **포럼에서 예전 버전을 받을 수 있다.**
- **보스가 안 죽는 것처럼 보일 때** (Orgodemirk, 2024-10-26) — 클라이언트 간 디싱크. 다시 싸우면 대체로 정상. 반복되면 신고 요청.
- **공용 은행** (Hudo, 2024-06-10) — 게임에서 `/bank` 입력 시 "character"와 "common" 은행이 전환된다. common은 계정의 4캐릭터 공용.
- **Floor Reader** — Windows Defender가 오탐한다. 미니맵 표시 항목을 필터로 줄일 수 있고(Orgodemirk, 2024-11-26), 리더/맵에 마우스를 올리면 FPS가 크게 떨어진다는 보고가 있다.

### 6-3. ★ 서버 규칙: 매크로·자동화

> **키 리매핑 도구(예: AutoHotkey)는 허용된다. 다만 어떤 방식으로든 게임플레이를 자동화하는 것은 안 된다.**
> — Orgodemirk, 2024-11-27

이건 사이트에 **반드시 명시해야 할 규칙**이다. 지금 어느 페이지에도 없다.

### 6-4. 질문 전 확인 순서 (VEL(JP), 2024-03-11 · 2024-11-11 반복 안내)

1. `✅guides-links-tutorials` 채널 확인
2. Destiny 포럼 확인
3. 그래도 모르면 질문

### 6-5. 신규 유저용 사냥 팁 (VEL(JP), 2024-05-30)

- EP4 `MA4DM`에서 **Dorphon Eclair** 고정 스폰을 1분 안에 잡을 수 있다. VH~Ult에서 Heavenly/Battle, H/Arms 등 초반에 도움 되는 유닛이 나온다. **VH 난이도 blue/purple ID 추천.**
- EP1 Hildebear → Centurion/Arms **1/301**, Hildetorr → Centurion/Battle **1/16**.
- (VEL(JP), 2025-02-10) **무과금으로도 Photon Token으로 Hit%를 붙일 수 있다.** 일본 유저 상당수가 무과금으로 장비를 완성했고, DT는 아이템 거래·판매로도 얻을 수 있다.

**사이트 적용**
- `beginner_page.html` — 6-1 표를 "설치 문제 해결" 절로 그대로. 지금 사이트의 백신 안내보다 훨씬 구체적이다.
- `system_page.html` 또는 신규 규칙 절 — 6-3 매크로 규칙.
- `beginner_page.html` — 6-5를 "레벨 초반 뭘 노릴까"로.
- 이 채널은 정지 상태라 **아카이브 성격**으로 한 번만 반영하면 된다.

## 7. `🏆special-roles-and-leader-board` — 도전 과제 시스템 (메시지 16개, 2024-12-21 ~ 2026-05-07)

**메시지 수는 적지만 밀도는 이 문서에서 가장 높다.** 전부 VEL(JP)가 관리하는 고정 정보이고,
사이트에 아직 없는 **서버 공식 도전 과제(Special Role) 체계** 전체가 여기 있다. 이미지·링크 없음.

### 7-1. 획득 방법

조건 달성 후 **`🎮accomplishments` 채널에 증거 스크린샷을 올리면** 역할이 부여된다.
역할마다 전용 아이콘이 붙는다.

### 7-2. Special Role 전체 목록과 조건

| 역할 | 조건 |
|---|---|
| **The Peerless** | The Starlight Tower [Raid]에서 **Administrator** 격파 |
| **The Extraplanar** | The Phantasmal Dimension을 **50분 이내** 클리어 |
| **The Ravenous** | The Ravenous Predator [Raid]에서 **Soul Butcher** 격파 |
| **Dr. Robotonik** | Phantasmal World 3 [Extreme]을 **40분 이내, 팀 사망 20회 이하** 클리어 |
| **The Prophet** | Lost Soul Ripper [Extreme/미니이벤트]를 **35분 이내** 클리어 |
| **The Grim Reaper** [할로윈] | Hallowed World [Extreme]의 Tower 1&2를 **30분 이내, 팀 사망 20회 이하** 클리어 + 비밀의 **Barbaray** 격파 |
| **The Manipulator III Ver.2** | The Manipulated Tower [Raid]에서 Manipulator III를 **보스방 전멸 없이** 격파 |
| **The Manipulator III** | The Discontrolled Tower [Raid]에서 Manipulator III를 **보스방 전멸 없이, 25분 이내** 격파 |
| **The Hundred** | Trial of The Eternal Age [EP2]에서 **Epsilon 100마리** 처치 |
| **The Nightmare Dominator** | Beyond the Nightmare [EP1]에서 Nightmare Dominator VI를 **전멸 없이 11분 이내** 격파 |
| **The Multiverse** | Toward the Multiverse [Lv.II] **솔로** 클리어 |
| **The Nightmare Chaser** | Distorted Nightmare [Raid]에서 Nightmare Chaser XII를 **보스방 전멸 없이** 격파 |
| **Nightmare Survivor** | Silent Nightmare [Raid]에서 Nightmare Chaser XII를 **보스방 전멸 없이** 격파 |

### 7-3. ★ 실측 난이도 순위 (달성자 수, 2026-07-26 기준)

VEL(JP)가 "달성 인원과 난이도에 따라 순서가 바뀔 수 있다"고 밝힌 공식 집계다.
**이게 곧 서버의 실제 난이도 표다.**

| 순위 | 역할 | 달성자 |
|---:|---|---:|
| 1 (최난) | The Peerless | **0명** |
| 2 | Dr. Robotonik | 4 |
| 3 | The Extraplanar | 8 |
| 4 | The Ravenous | 10 |
| 5 | The Grim Reaper | 11 |
| 5 | The Hundred | 11 |
| 7 | The Prophet | 12 |
| 8 | The Manipulator III Ver.2 | 14 |
| 9 | The Nightmare Dominator | 23 |
| 10 | The Manipulator III | 25 |
| 11 | The Nightmare Chaser | 36 |
| 12 (최이) | Nightmare Survivor | 51 |

`The Multiverse`는 1명으로 표기돼 있으나 목록 순서상 예외로 보인다(솔로 조건이라 도전자 자체가 적음).
**The Peerless는 아직 아무도 못 했다** — Starlight Tower의 Administrator가 현재 서버 최고 난도다.

### 7-4. 이름 색상 랭크 (2025-08-27 게시, 2025-10-22 수정)

| 랭크 | 이름 색상 |
|---|---|
| Rank IV | 보라 + 빨강 |
| Rank III | 에메랄드 |
| Rank II | 대체 색상 |
| Rank I | 기본 색상 |

각 랭크의 아이콘 이미지가 첨부돼 있었으나 현재 렌더 목록에서는 이미지 URL이 잡히지 않았다(별도 수집 필요).

### 7-5. 리더보드 (2025-09-09 개설, 진행 중)

- 역할별 달성자 명단
- **Raid/Extreme 보스 솔로 클리어** — 영상 제출 필수. 현재 The Discontrolled Tower · Distorted Nightmare · Silent Nightmare · Beyond the Nightmare 4종 기록 보유자 존재.
- **Most TA Records Holder** 부문 존재.
- **SS Rank Clear (8주년 퀘스트)** 명단 별도 (2026-05-07).
- *개인 닉네임은 이 문서에 옮기지 않는다.*

**사이트 적용 — 우선순위 높음**
- **신규 절 `endgame_page.html` → "도전 과제(Special Roles)"** 로 7-2 표를 그대로.
- 7-3 달성자 수는 **엔드게임 콘텐츠 난이도 정렬의 근거 데이터**다. 지금 사이트의 ★3~★10 표기와 교차 검증할 것.
- 솔로 클리어·TA 기록은 영상 인덱스와 연결하면 자연스럽다.

## 8. `🎮accomplishments` — 성과 인증 (메시지 5,120개, 2021-01-17 ~ 2026-08-29)

채널 시작 표식까지 확인. 채널 설명은 "Feel free to post anything you achieved in game!"
**이미지 1,457개** — 이 서버에서 이미지가 가장 많은 채널이다. `🏆special-roles`의 증거 제출처이기도 하다.

### 8-1. 연도별 활동량 (서버 성장 곡선)

| 연도 | 메시지 | 이미지 |
|---|---:|---:|
| 2021 | 11 | 3 |
| 2022 | 1 | 0 |
| 2023 | 131 | 27 |
| 2024 | 952 | 179 |
| 2025 | 1,712 | 578 |
| 2026 (8월까지) | **2,313** | **670** |

2024년부터 급증했고 2026년이 최고치다. 서버가 지금 가장 활발하다.

### 8-2. ★ 기록 갱신 이력 — 사이트에 없는 데이터

대부분 스크린샷 인증이라 **시간이 실측치**다. 퀘스트 난이도 체감을 보여 주는 가장 좋은 자료다.

**Solo RT (Ruins/Tower 계열) — 2년에 걸친 단축 과정**

| 시점 | 기록 | 비고 |
|---|---|---|
| 2024-11-11 | 20분 벽 근처 | |
| 2024-11-30 | 19분 미만 | |
| 2024-12-02 | 18분 미만 | 새 Dark Meteor 적용 |
| 2025-02-17 | 17분 미만 | |
| 2025-06-22 | **16분 미만** | "PHANTASMAL FIELD OP" — 장비가 기록을 바꿈 |
| 2025-09-17 | 15:56 | |
| 2025-10-02 | 15:49 → 15:37 | 같은 날 2회 갱신 |
| 2026-02-08 | **14:48** | PB(Photon Blast) 없이 |

- Ramarl 솔로 첫 17분 미만: 2025-05-16
- FOmar 솔로 RT 기록 갱신: 2026-07-17

**Distorted Nightmare (DN) — 파티**

| 시점 | 기록 |
|---|---|
| 2025-11-30 | 5분 미만 |
| 2025-12-01 | **4:36 (당시 서버 기록)** → 같은 날 4분 미만 |
| 2026-02-01 | 6:04 (2인) |
| 2026-03-11 | **3분 미만 (최초)** |

**그 외 퀘스트**

- **The Phantasmal Dimension 솔로 — 1:51:44** (2025-06-08). Seabed 구간만 sub-40분, 최고 약 37분(2025-05-27).
- **Phantasmal World 3 [Extreme] 솔로 0데스** (2025-07-25).
- **MP3** — 15:07(2026-04-24) → **14:36 (4인, 2026-04-27)**.
- **Silent Nightmare** 17분 미만 (2025-06-13).
- **BTM Extreme 2인 기록** (2026-06-05).
- **8-3 Olga 솔로 최초 클리어** (2026-03-04) · BTV 솔로 47분 (같은 날).
- TPD 보스 enrage(타임업) 공격을 처음 목격 (2025-07-05). **보스 HP바에 디싱크가 있어 실제 잔여량과 다르다**는 관찰 기록.

### 8-3. ★ 파밍 실측 — 드랍률 체감 자료

공식 확률표와 별개로 **실제 몇 판 돌았는지**가 남아 있다. 사이트의 드랍표를 보완하는 현실 데이터다.

| 목표 | 실제 소요 |
|---|---|
| TTM 드랍 | **Lv1 83판 + Lv2 8판** (2025-11-12) |
| Darkness Photon Sphere (VR Cata) | **43판**, 일주일 (2025-05-19) |
| Nei's Claw (DTMR) | **Happy Hour 15회** (2026-04-03) |
| 8-3 특정 드랍 | **113판** (2026-05-24) |
| 첫 100 Hit 아이템 | **크레이트 400개 이상** (2026-02-22) |
| 두 번째 90+ Hit (100 Hit Excalibur) | **크레이트 600개** (2026-08-13) |
| Wrath of the Forest 크레이트 100개 | **13시간 59분** 연속 파밍 (2026-02-12) |
| 1/39 확률 드랍 | 약 100판 (2025-01-14) |
| Hit 0% → 80% 강화 | 주말 내내, **마지막 5%가 가장 고통** (2024-09-08) |

**Parasitic Armor 'Predator' 집중 공략 그룹 기록** — 12판에 3개(2026-03-26), 4판에 4개(2026-04-08), 누적 25판(2026-08-29). 위 시세표의 225~255 DT와 함께 보면 왜 비싼지 설명된다.

### 8-4. 서버 최초 기록

- **Astral Saber 서버 최초 제작** — 2026-05-30 ("Far as I know this is the first one on the server")
- Ignis Engine 제작 인증 다수 (2025-12-26, 2026-04-11, 2026-07-01) — **다인 협력 없이는 불가능**하다는 게 공통 증언
- Forbidden Grimoire 제작 (2026-04-02), Jointparts 제작 (2025-06-29, 2026-02-11), Astral Cloak (2026-02-07)
- Millennium Shop 전 품목 완주 (2025-09-27, 2025-12-16)
- MPC 상점 전 품목 완주, 매그 셀 컬렉션 완성 (2026-05-26)
- 첫 계정 4캐릭터 전원 200레벨 (2026-01-01)

### 8-5. 이미지 처리 방침

- 이미지 1,457개 전부를 사이트로 옮기지 않는다. 기록·희귀드랍이 명시된 **후보 123건**을 걸러 그중 중복을 뺀 **80건**의 원본 URL을 [`discord-raw/accomplishments-images.tsv`](./discord-raw/accomplishments-images.tsv)에 저장했다.
- Discord CDN URL은 만료될 수 있으므로, 실제로 쓸 컷은 `images/discord/archive/`로 내려받아야 한다.
- 인물 닉네임이 찍힌 스크린샷은 사용 전 확인이 필요하다.

**사이트 적용 — 우선순위 높음**
- **신규 절 "서버 기록(Records)"** — 8-2를 퀘스트별 표로. 지금 사이트에 클리어 타임 기준이 전혀 없다.
- **`quest_data_page.html` / 드랍표에 "실측 파밍량"** — 8-3은 확률표만으로는 못 주는 감각을 준다.
- `endgame_page.html`의 조합 아이템 절에 "서버 최초/난이도 체감" 근거로 8-4.

## 9. `🌎party-finder-for-quests` — 파티 모집 (메시지 2,129개, 2025-01-23 ~ 2026-08-27)

시작점까지 확인. **이미지 6개, 링크 8개뿐**이라 원문 자체는 사이트 소재가 아니다.
다만 모집글을 집계하면 **"지금 이 서버에서 실제로 뭘 돌고 있나"** 가 나온다. 이건 다른 채널에 없는 정보다.

### 9-1. 퀘스트별 모집 빈도 (인기 순위)

| 순위 | 퀘스트 | 모집 언급 |
|---:|---|---:|
| 1 | **The Phantasmal Dimension (TPD)** | **154** |
| 2 | **Phantasmal World 3 / MP3** | **76** |
| 3 | Ruins/Tower (RT) | 25 |
| 4 | Distorted Nightmare (DN) | 22 |
| 5 | Lost Soul Ripper (LSR) | 18 |
| 6 | Toward the Multiverse (TTM) | 13 |
| 7 | Beyond the Nightmare (BTN) | 9 |
| 8 | The Ravenous Predator (TRP) | 8 |
| 9 | Silent Nightmare (SN) | 7 |
| 10 | Hallowed World · Towards the Future | 6 |
| 12 | The Discontrolled Tower | 2 |
| 13 | The Manipulated Tower | 1 |

**TPD가 압도적 1위**다. 사이트의 `tpd_page.html` 우선순위를 "중간"으로 잡아 둔 기존 판단은 재검토가 필요하다 — 사람들이 가장 많이 도는 콘텐츠다.
반대로 Discontrolled/Manipulated Tower는 모집이 거의 없다. 고정 팀끼리만 돈다는 뜻으로 보인다.

### 9-2. 채널 활동량 추이 (월별)

| 월 | 모집글 |
|---|---:|
| 2025-05 | 60 |
| 2025-11 | 45 |
| 2026-02 | 234 |
| 2026-03 | 247 |
| 2026-05 | 190 |
| 2026-06 | 371 |
| 2026-07 | 250 |
| **2026-08** | **483** |

2026-02부터 자리를 잡았고 지금이 최고치다. `accomplishments`의 성장 곡선과 일치한다.

### 9-3. 파티가 잘 잡히는 시간대 (UTC 기준 게시량)

| UTC | KST | 게시량 |
|---:|---:|---:|
| 21시 | 06시 | 163 |
| 00시 | 09시 | 164 |
| 22시 | 07시 | 158 |
| 20시 | 05시 | 150 |
| 16시 | 01시 | 143 |
| 04시 | 13시 | 142 |

**주 피크는 UTC 20~00시(한국 새벽 05~09시)** — 미주권 저녁 시간이다.
**보조 피크가 UTC 04시(한국 오후 1시)** 로 아시아권 시간대다.
한국 유저 기준으로는 **오후~저녁보다 새벽·이른 아침에 파티가 훨씬 잘 잡힌다.**

**사이트 적용**
- `player_tools.html` 또는 신규 "지금 서버 상황" 절에 9-1 인기 순위 + 9-3 시간대. Happy Hour 일정과 함께 두면 자연스럽다.
- 9-1은 `endgame_page.html`의 콘텐츠 정렬 근거로도 쓸 수 있다(난이도 ≠ 인기).
- 개별 모집글은 옮기지 않는다.

## 10. `💬general-chat` — 일반 대화 (2018년 개설, 확인 범위 2026-06-28 ~ 08-29 / 3,822개)

**전량 아카이브 대상이 아니다.** 2018년부터 8년치 실시간 대화라 끝까지 스크롤하는 것이 비현실적이고,
대화 원문은 개인 정보와 잡담이 섞여 사이트 소재로도 부적합하다.
대신 **고정 메시지 전부**와 **최근 2개월 구간의 운영진 답변·링크**를 확보했다. 확인 구간은 위에 명시했다.

### 10-1. 고정 메시지 (4개 전부 — 이 채널의 영구 콘텐츠)

| 날짜 | 작성자 | 내용 |
|---|---|---|
| 2023-11-19 | Cherry | **DestinyReader v0.9.5** 다운로드 링크 (MediaFire) |
| 2024-02-22 | Orgodemirk (Developer) | **정확도(ATA) 계산기** — <https://pso.rollandrate.com/atacalc.php> |
| 2026-01-04 | VEL(JP) (GM) | 2024~2025년 Special Role 달성자 수 |
| 2026-01-27 | **Manung** | **이 사이트 공개 공지** — <https://angrieta.github.io/Destiny_Guide/> |

### 10-2. Special Role 달성자 — 2024~2025 vs 2026 비교

7-3의 2026-07 집계와 대조하면 **1년간 얼마나 늘었는지**가 나온다.

| 역할 | 2024~2025 | 2026-07 | 증가 |
|---|---:|---:|---:|
| The Extraplanar | 4 | 8 | +4 |
| The Ravenous | 7 | 10 | +3 |
| Dr. Robotonik | 4 | 4 | 0 |
| The Prophet | 4 | 12 | **+8** |
| The Manipulator III Ver.2 | 10 | 14 | +4 |
| The Grim Reaper | 10 | 11 | +1 |
| The Manipulator III | 19 | 25 | +6 |
| The Hundred | 10 | 11 | +1 |
| The Nightmare Dominator | 20 | 23 | +3 |
| The Multiverse | 1 | 1 | 0 |
| The Nightmare Chaser | 20 | 36 | **+16** |
| Nightmare Survivor | 49 | 51 | +2 |

당시 기록: **11/12 역할 달성자는 2명뿐**, `The Multiverse`는 단 1명, `The Extraplanar`(TPD)는 **단 한 파티만** 달성.

### 10-3. ★ GM(VEL(JP)) 답변에서 나온 게임 수치 — 다른 곳에 없는 정보

- **JOINTPARTS 실수치** (2026-08-23) — 미장착 사거리/각도 `100.0 / 26.0`, 타깃 8. 장착 시 `135.0 / 35.0`, **타깃 10, 속도 +15%, ATA +20, 리자드 관통.**
  *(사이트 클래스 빌드 페이지에 넣은 수치와 일치 — 교차 검증됨)*
- **Spirit 계열 스페셜** (2026-08-20) — TP가 0~2일 때는 빗나간다. Spirit 스페셜로는 **TP가 4 미만으로 내려가지 않는다.**
- **Whitill Ultimate의 P arms 드랍** (2026-08-25) — Ult에서만 드랍되고 Whitill은 파츠 형태로 나온다. **arms 자체는 HARD에서 더 쉽게 구할 수 있다.** 의도된 것인지 GM도 불확실하다고 밝힘.
- **Elenor + Photon Blast** (2026-08-28) — PB가 붙은 Elenor는 특정 경로가 유일하다. **크레이트·레어 드랍으로 나온 Elenor에는 PB가 없다.**
- **Wrath of the Forest 버그** (2026-08-25) — 버그 발생 시 대부분 **첫 번째 판이 플레이 불가** 상태가 된다.
- **일일 퀘스트 로테이션** (2026-08-22) — TTM Lv.III에서 **Cavern of Gloom [EP1>Destiny]** 로 교체.
- **미구현 콘텐츠 예고** (2026-08-13) — **아직 구현되지 않은 신규 Slicer 3종**이 있다.
- **Chaos Engine 위상 변화** (2026-08-15) — 레이드에 적응한 인원이 늘어 예전보다 구하기 쉬워졌다는 GM 판단.
- 조합은 **Ultimate에서 시도할 것** (2026-08-18) — 하위 난이도에는 항상 하위 티어 아이템이 섞인다.

### 10-4. 참고 자료 링크 (채널에서 공유)

- **몬스터 수 (구자료)** — <https://playpso.net/forums/topic/146-monster-count/>
- **몬스터 수 (rollandrate)** — <https://pso.rollandrate.com/oldsite/monstercounts.php>
- **Orgodemirk의 퀘스트 정보** — <https://playpso.net/forums/topic/654-orgodemirks-quests-and-information/>
- 영상 녹화용 OBS 안내 — <https://obsproject.com/>

### 10-5. 이 사이트 관련 커뮤니티 반응

Manung(사이트 운영자)이 이 채널에 갱신을 공지해 왔다. 2026-08 한 달에만 4회.

| 날짜 | 공지 내용 |
|---|---|
| 2026-01-27 | 사이트 최초 공개 (고정됨). 초기엔 bazaar·캐릭터 정보·초보 가이드 중심 |
| 2026-08-15 | 그동안 작업분 일괄 업로드 |
| 2026-08-16 | **드랍 테이블** 공개 |
| 2026-08-20 | 기능 추가 안내 |
| 2026-08-21 | 다수 기능 추가 |
| 2026-08-22 | **교환 계산기** 공개 |

2026-08-21 대화에서 **"퀘스트마다 영상이 하나씩은 있었으면 좋겠다"**는 요청과, 직접 만들려면 OBS를 쓰라는 답이 오갔다.
→ 기존 감사표의 "영상 인덱스 후보(우선순위 낮음)"를 **재검토할 근거**다. 수요가 확인됐다.

**사이트 적용**
- 10-3은 즉시 반영 가치가 있다. 특히 Spirit 스페셜 TP 규칙, Elenor PB, Whitill P arms는 어느 페이지에도 없다.
- 10-1의 ATA 계산기·DestinyReader는 `player_tools.html` 외부 도구 절에 링크.
- 10-2는 `endgame_page.html` 난이도 근거 보강.

## 11. `music` — 음악 공유 (메시지 317개, 2018-07-04 ~ 2026-08-29)

시작점까지 확인. 링크 105개(대부분 YouTube 329건 · Rythm 봇 37건 · Spotify 2건), 이미지 5개.

**사이트 소재 없음.** PSO 관련 언급은 317개 중 **5개**뿐이고 그나마 잡담이다.
유일하게 연결되는 건 2025-11-26의 "PSO III 곡으로 직접 .ogg를 만들었다"는 글 —
`game-modifications`의 ogg 루프 요청 스레드(5-1)와 이어진다. 그 외에는 다루지 않는다.

## 12. `off-topic` — 잡담 (메시지 1,588개, 2017-10-01 ~ 2026-08-29)

시작점까지 확인. **이 서버에서 가장 오래된 채널**이다(2017-10). 이미지 211개, 링크 102개.

**대부분 사이트 소재가 아니다.** 게임 외 잡담·밈이 주류이고, PSO 관련 글은 1,588개 중 58개인데 그것도 감상 위주다.
다만 하나는 가치가 있다.

### ★ PW3 6박스 파밍 기대 시간 계산 (Rang3r, 2026-06-26)

한 판 약 20초 가정, **Skyly ID** 기준(좋은 무기 = Calibur, Raygun, Arms):

| 목표 | 기대 소요 |
|---|---|
| 원하는 무기 + **100 Hit** | **487시간** |
| 원하는 무기 + **85 Hit 이상** | **74.5시간** |
| 아무 무기 + **100 Hit** | **146.1시간** |

같은 글에서 GM에게 **신규 무기 분포**, **area% 패턴이 여전히 롤당 Hit 5%인지**, **스페셜이 붙을 실제 확률**을 물었다(업데이트로 바뀐 뒤 공개된 적 없음). 공개 답변은 확인되지 않았다.

**사이트 적용**: 위 계산은 `accomplishments`의 실측(크레이트 400~600개)과 같은 결론을 다른 방식으로 보여 준다.
"100 Hit은 현실적 목표가 아니다, 85+를 노려라"는 조언의 근거로 쓸 수 있다. **추정치임을 명시할 것.**

---

# 종합 — 무엇을 사이트에 넣을 것인가

## 확인 범위

| 카테고리 | 채널 | 확인 메시지 | 이미지 | 시작점 |
|---|---:|---:|---:|---|
| Trade | 4개 | 게시물 869 + 메시지 1 | 0 | 전부 |
| Main | 8개 | 16,878 | 2,141 | 7/8 (general-chat 제외) |

`💬general-chat`만 2018년부터 8년치라 전량 확인이 불가능해 **고정 메시지 전부 + 최근 2개월**로 한정했다. 나머지 11개는 채널 시작 표식까지 확인했다.

## 즉시 반영 가치가 있는 것 (우선순위 순)

1. **도전 과제 13종 + 실측 난이도** (7절) — 서버 공식 체계인데 사이트에 통째로 없다. `The Peerless` 달성자 0명이라는 사실만으로도 엔드게임 페이지의 축이 된다.
2. **설치 문제 해결 표** (6-1) — 운영진이 직접 쓴 증상별 해결. 지금 사이트 안내보다 구체적이다.
3. **서버 기록과 파밍 실측** (8-2, 8-3) — 클리어 타임·"몇 판 돌아야 나오나". 확률표가 못 주는 정보다.
4. **통화 환산표** (2-2, 4) — `1 DT = 2 PT = 10 PD = 2 Crate`는 고정. **MPC만 5~8 DT로 갈리니 단일 숫자로 쓰면 안 된다.**
5. **경매 규칙 + 표준 양식** (3) — 시작가 5 PD · 단위 5 PD · 48시간.
6. **매크로·자동화 규칙** (6-3) — AutoHotkey 리매핑은 허용, 게임플레이 자동화는 금지. 어느 페이지에도 없다.
7. **GM이 답한 게임 수치** (10-3) — Spirit 스페셜 TP 하한 4, Elenor PB, Whitill P arms, WoF 버그, 미구현 Slicer 3종.
8. **모드/스킨 카탈로그** (5) — 신규 페이지 하나가 나올 분량이다.
9. **퀘스트 인기 순위와 파티 시간대** (9) — TPD가 압도적 1위. 한국 기준 새벽 5~9시에 파티가 잘 잡힌다.

## 반영하지 않기로 한 것

- 개별 매물·가격 호가·닉네임 — 시세 변동과 개인 정보.
- 파티 모집글 원문, 잡담, 음악 링크.
- `off-topic`·`music`의 이미지 216개 — 게임과 무관.

## 주의

- 시세(2-3)와 낙찰가(3-3)는 **2026-08-29 스냅샷**이다. 페이지에 넣을 때 관측일과 "확정가 아님"을 반드시 병기한다.
- Discord CDN 이미지 URL은 만료된다. 실제로 쓸 컷은 `images/discord/archive/`로 내려받아야 한다.
- 모드 파일은 재호스팅하지 않고 원본 링크와 포럼 정리글로 연결한다. 제작자 크레딧을 표기한다.
