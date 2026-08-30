# Discord 기반 페이지 소재 배치표 — 2026-08-29

이 문서는 `DESTINY PSOBB` Discord의 채널 브라우저 120개 전수 감사 결과를 실제 사이트 편집 단위로 재배치한 작업표다. 채널 단위의 수치와 ID는 [`discord-channel-inventory-2026-08-29.md`](./discord-channel-inventory-2026-08-29.md), 기계 판독용 원본은 [`../data/discord-channel-audit-2026-08-29.json`](../data/discord-channel-audit-2026-08-29.json)을 기준으로 한다.

## 검증 범위

- 채널 브라우저에 노출된 120개 채널을 모두 열어 유형과 콘텐츠 존재 여부를 확인했다.
- 공지·패치·이벤트·퀘스트·레이드·가이드·영상처럼 기록이 고정된 채널은 시작점까지 확인했다.
- `🔔announcements`는 2018년 채널 시작점까지 326개 메시지를 확인했다.
- 포럼 9개는 게시물 색인과 규칙을 확인했다. 실시간 거래·가격 질문·개인 공략 스레드는 페이지 원문 소재로 복제하지 않는다.
- 실시간 대화·자동 알림 8개는 구조와 반복 패턴을 확인했다. 계속 증가하는 사용자 대화를 “전체 기록 확인”으로 표시하지 않는다.
- 감사 중 관찰한 수치는 메시지 1,774개, 렌더 이미지 225개, 첨부 링크 332개, 링크 1,091개다.

## 페이지별 소재 배치

| 사이트 편집 대상 | Discord 근거 채널 | 가져올 소재 | 이미지 처리 | 우선순위 |
| --- | --- | --- | --- | --- |
| `updates_page.html` | `🔔announcements`, `🆕destiny-0944-madams-bracelet`, `destiny-0943-toward-the-multiverse-lv3-and-new-item`, 0.942~0.94 패치 채널 | 0.944 현재 적용, 2026-09-01 확정 예고, 9주년/향후 개발 예고를 분리 | 최신 5개 원본을 `images/discord/2026-08/`에 저장 | 즉시 유지·갱신 |
| `beginner_page.html` | `✅how-to-start-destiny-psobb`, `✅ingame-commands`, `✅mag-material-maxstats-guide`, `📱difficulty-of-quests` | 설치·계정·백신 오탐, 명령어, MAG/Material 최대치, 난이도 안내 | 기존 설치·성장 스크린샷 우선 사용 | 높음 |
| `event_page.html` | Past Events 16개 전부, `✅quest-newitem-update-logs` | 2024~2026 이벤트 연표, 기간, 교환 아이템, 복각 여부 | 기존 Radiant Ring/Berserk Needle/Christmas Spirit 이미지와 대조 | 높음 |
| `endgame_page.html` | Raid/Endgame 15개, Newer Contents 9개, Limited Quest 3개 | 난이도·보스·핵심 보상·선행 조건·복각 상태 | 레이드 원본 12개를 `images/discord/archive/raids/`에 저장 | 높음 |
| `predator_raid.html` | `⚔raid3-the-ravenous-predator-★10` | Soul Butcher, 방 스킨, 보스 패턴과 보상 | 새 원본과 기존 `sb-*` 가이드 이미지 대조 | 높음 |
| `discontrolled_tower_raid.html` | Raid 2, Raid 2 EX 채널 | Manipulator, Golden Halo, Jointparts, 기믹·드롭 근거 | Raid 2 EX 원본 4개 보관, 기존 기믹 이미지 우선 | 높음 |
| 신규 Raid 4 페이지 후보 | `⚔raid4-the-starlight-tower-★10` | Administrator, Divine Blade, Divine Field, 와이드스크린 요구, 기믹 목록 | Administrator 1개, Divine Blade 3개, 공용 상자 1개 | 높음 |
| `tpd_page.html` | `the-phantasmal-dimension-★10`, 연계 영상 채널 | 3개 비밀 보스, 20-life enrage, 보상, 클리어 영상 | 기존 `tpd-*` 이미지 유지 | 중간 |
| `system_page.html` | 0.8133~0.8135, `✅destiny-psobb-features`, combo bonus, metascore | HP bar, attribute/hit pattern, dual casting, 서버 기능, 아이템 보정 | 기존 `feature-*`와 표 이미지 사용 | 중간 |
| `economy_page.html` | `✅about-bazaar-quest-and-currency`, trade guideline, Donation Token 안내 | Bazaar NPC/재화, 교환 규칙, 거래·경매 규칙 | 최신 Bazaar 원본과 기존 상점 이미지 사용 | 중간 |
| `quest_data_page.html` | `📱quest-monster-count`, `📱droptable-modified-quests`, 0.76~0.91 드롭표 패치 | 몬스터 수·수정 드롭표의 출처 연결과 기준일 | 표 중심, 이미지는 장식용으로만 사용 | 중간 |
| 영상 인덱스 후보 | `video-index`, `ep1`, `ep2`, `ep4`, `others` | 퀘스트·레이드별 영상 링크 연결 | 외부 썸네일은 직접 복제하지 않고 링크/임베드 정책 확인 | 낮음 |

## 채널 묶음별 사용 판단

### 즉시 페이지 본문에 사용

- 공지·패치 40개: 적용 버전, 변경점, 예고 상태, 날짜 근거.
- 과거 이벤트 16개: 이벤트 연표, 기간, 교환 목록, 복각 관계.
- 레이드/엔드게임 15개와 신규 콘텐츠 9개: 난이도, 보스, 보상, 입장·플레이 조건.
- 제한 퀘스트 3개: 운영 기간과 복각 여부.
- 가이드/DB의 고정 채널 7개: 설치, 명령어, MAG, 메타 점수, 무기 우선순위, PGF, Donation Token.
- `🔔announcements`: 2018년부터의 서버 변화 연표와 최신 확정 공지.

### 규칙만 사용

- 거래 가이드와 `players-tradelist`, `trades`, `auctions`, `price-check`: 게시 규칙만 요약하고 작성자·GC 번호·개별 가격·진행 중 거래는 제외.
- `strategy-information-sharing`, combo bonus, monster count, modified drop table, server features 포럼: 색인 구조와 운영자 고정 정보만 사용하고 사용자별 스레드는 별도 검증 후 반영.

### 페이지 소재에서 제외

- `general-chat`, `accomplishments`, `help-and-support`, `party-finder`, `music`, `off-topic`, `game-modifications`: 실시간 사용자 대화와 개인 정보.
- 음성 채널 7개: 텍스트 콘텐츠 없음.
- Happy Hour 개별 알림 로그: 반복 알림 원문 대신 운영 패턴과 현재 상태만 사용.

## 이미지 소재 현황

- Discord 원본 보관: 17개 파일.
- 최신 업데이트: 5개 파일.
- Raid 2 EX: 4개 파일.
- Raid 3: 3개 파일.
- Raid 4: 5개 파일.
- `raid3-overview.png`와 `raid4-overview.png`는 Discord에서 재사용된 동일한 공용 보상 상자 원본이다.
- `announcements-roadmap-preview.png`와 `v0944-madams-bracelet-model.png`도 같은 원본이 재첨부된 중복 쌍이다.
- 파일별 크기·용도·중복 관계는 [`../images/discord/README.md`](../images/discord/README.md)에 기록했다.
- 왼쪽 사이드바의 83개 표시 채널 대조는 [`discord-sidebar-crosscheck-2026-08-29.md`](./discord-sidebar-crosscheck-2026-08-29.md), 정보형 포럼 본문 보강은 [`discord-forum-deep-dive-2026-08-29.md`](./discord-forum-deep-dive-2026-08-29.md)를 사용한다.

## 게시 전 체크리스트

1. 공지의 `현재 적용`, `확정 예고`, `개발 예고` 상태를 섞지 않는다.
2. 드롭률과 교환 수량에는 Discord 채널 및 기준일을 함께 둔다.
3. 숨김 값, `?????`, TBA 항목은 추정하지 않는다.
4. 이미지 캡션에 보스·아이템·퀘스트명을 적고 장식 이미지와 근거 이미지를 구분한다.
5. 사용자 이름, GC 번호, 개인 거래 내용은 공개 페이지에 옮기지 않는다.
6. 다음 패치 적용 시 예고 카드를 현재 적용으로 이동하고 실제 드롭표와 다시 대조한다.
