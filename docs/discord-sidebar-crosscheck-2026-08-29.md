# Discord 왼쪽 사이드바 교차검증 — 2026-08-29

첨부 화면에 보이는 Discord 왼쪽 채널 목록을 실제 로그인 세션에서 맨 아래까지 스크롤하고, 기존 `channel-browser` 전수 감사 결과와 채널 ID로 대조했다.

## 결론

- 왼쪽 사이드바에 현재 표시된 텍스트·포럼 채널: **83개**.
- 기존 120개 감사표와 일치한 사이드바 채널: **83/83개**.
- 사이드바에만 있고 기존 감사표에 없던 채널: **0개**.
- 사이드바 맞춤 설정으로 현재 숨겨진 텍스트 채널: **30개**. 이 채널도 `channel-browser` 감사표에서 이미 확인했다.
- 음성 채널: **7개**.
- 따라서 서버 전체 범위는 `83 + 30 + 7 = 120개`다.
- 추천 영역의 `❓price-check`와 `✅destiny-psobb-features`도 모두 포함됐다.

전체 120개 이름·ID·메시지·이미지·첨부·링크 수는 [`discord-channel-inventory-2026-08-29.md`](./discord-channel-inventory-2026-08-29.md)에 있다.

## 사이드바에 표시된 83개 집계

| 카테고리 | 채널 | 메시지 | 이미지 | 첨부 | 링크 | 시작점 확인 | 포럼 | 동적 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Trade Channels | 5 | 6 | 0 | 0 | 0 | 1 | 4 | 0 |
| Main Channels | 9 | 312 | 16 | 22 | 74 | 1 | 1 | 7 |
| Events / Updates / Happy Hour | 5 | 225 | 11 | 11 | 83 | 4 | 0 | 1 |
| Patch notes | 33 | 260 | 24 | 98 | 143 | 33 | 0 | 0 |
| Past Events | 9 | 107 | 9 | 42 | 51 | 9 | 0 | 0 |
| Raid / Endgame | 3 | 24 | 2 | 6 | 58 | 2 | 1 | 0 |
| Newer Contents | 9 | 42 | 1 | 10 | 13 | 9 | 0 | 0 |
| Limited Quest | 3 | 18 | 0 | 4 | 4 | 3 | 0 | 0 |
| Guides / Database | 3 | 3 | 0 | 0 | 102 | 0 | 3 | 0 |
| PSOBB Videos | 4 | 205 | 68 | 2 | 275 | 4 | 0 | 0 |
| **합계** | **83** | **1,202** | **131** | **195** | **803** | **66** | **9** | **8** |

위 수치는 최초 채널 감사 때 관찰한 양을 사이드바 표시 채널에만 다시 합산한 값이다. 이후 포럼 본문 보강분은 별도 문서에 기록하며 이 표의 원래 감사 수치에 중복 가산하지 않는다.

## 사이드바에 표시되지 않지만 포함된 채널

사이드바는 사용자가 팔로우한 채널만 표시하는 맞춤 목록이다. 현재 숨겨져 있지만 전수 감사에 포함된 주요 채널은 다음과 같다.

- 최신: `destiny-0943-toward-the-multiverse-lv3-and-new-item`.
- 2026 이벤트: Summer, 8th Anniversary, Halloween revival, Easter, White Day, Valentine, Photon Token.
- 엔드게임/레이드: TTM Lv.III, OMEGA Oblivion, TPD, Hallowed World, Beyond the Nightmare, Catastrophe, Beyond the Mainframe Extreme, Raid 1·1 EX·2·2 EX·4.
- 메인/가이드: `announcements`, quest difficulty, guides/tutorials, commands, MAG/material, metascore, weapon priority, PGF, Donation Token.
- 영상: `others`.

## 확인 상태 해석

- `시작점 확인`: 패치·이벤트·공략처럼 고정된 기록을 채널 시작점까지 확인.
- `포럼`: 포럼 전체 색인과 고정 정보 확인. 페이지에 필요한 고정 포럼은 본문·답글까지 추가 확인.
- `동적`: 실시간 대화나 자동 알림. 페이지 소재를 찾기 위해 구조와 내용을 확인했지만 계속 증가하는 사용자 대화를 고정 기록처럼 표현하지 않음.
- 음성 채널은 텍스트 자료가 없으며 현재 접속자 정보는 페이지 소재로 수집하지 않음.

## 연결 자료

- [포럼 본문 보강 결과](./discord-forum-deep-dive-2026-08-29.md)
- [전체 채널 근거표](./discord-channel-inventory-2026-08-29.md)
- [페이지별 소재 배치표](./discord-page-materials-2026-08-29.md)
- [이미지 원본 목록](../images/discord/README.md)

