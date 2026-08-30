# Discord 포럼형 정보 채널 본문 보강 — 2026-08-29

왼쪽 사이드바 교차검증 후, 단순 포럼 색인만으로는 페이지 소재가 부족한 고정 정보 포럼을 게시물 본문과 답글까지 다시 읽은 결과다. 개인 거래·가격 질문은 개인정보와 시세 변동 때문에 공개 페이지 데이터로 복제하지 않는다.

## `✅destiny-psobb-features`

고정 게시물 `Destiny PSOBB Features`의 본문 4개를 확인했다. 페이지에 쓸 수 있는 핵심 내용:

- 기본 경험치 5배, 이벤트 등에서 10배.
- 이벤트 중 무료 Section ID 변경, `/sectionid 0-9` 사용.
- 무한 MAG 급식, 시작 Meseta 150,000, Training Room 무료 Meseta.
- Ultimate Multi에서 드롭률 2배, 개인 드롭 시스템.
- Daily Quest Crate와 약 15.5시간 간격의 Happy Hour. Happy Hour는 Rare Drop Rate 3배.
- Material·Photon 드롭 증가, 도구류 최대 99 또는 250 스택.
- Common Bank, 넘어짐 제거, 클래스·테크닉 밸런스 조정.
- Photon Drop/Photon Token으로 무기 Hit 최대 80 및 Special을 추가하는 Bazaar.
- Floor Reader, rare sound, minimap item 표시.
- 연중 custom quest·custom enemy·raid/endgame 콘텐츠.
- 아이템 손실·도난·전송 중 연결 종료에 대한 로그 확인 및 복구 지원 안내.
- 연 6개 주요 시즌 이벤트: Christmas, Valentine, Easter, Summer, Anniversary, Halloween.
- Enemy HP bar, EP2/EP4 Area% 패턴 재조정, 다수 커스텀·버프 아이템.

페이지 적용 위치: `system_page.html`, `beginner_page.html`, `economy_page.html`의 서버 특징 요약.

## `✅strategy-information-sharing`

포럼 목록을 끝까지 내려 **17개 게시물**을 확인했다.

1. What's this forum?
2. Manung’s Destiny Guide Site
3. 1250 legendary crate
4. Gear list for TPD secret BOSS
5. [Raid] Gimmick Timeline for Manipulator III
6. TPD Wave
7. Gear list: Racast/HUcaseal for Phantasmal Dimension
8. [Raid] How to Soul Butcher
9. Tips for Beyond the Nightmare
10. Gear list for BtN
11. Gear list for TRP
12. [Raid] Timeline for Soul Butcher
13. How to play Android character well
14. Tips VR TEST EXTRA: Singularity
15. Tips for The Phantasmal Dimension
16. Gear list: RAmarl for Phantasmal Dimension
17. Gear list: Fomar for Phantasmal Dimension

### 페이지에 바로 쓸 수 있는 내용

- Manipulator III: 일반 구간과 Overclock의 전체 기믹 순서.
- Soul Butcher: 파티 코너 배정, 좌·우 같은 쪽의 임시 위치 교환, 0~27 공격 타임라인.
- TPD secret boss별 HUcast·FOmar 권장 무기, 방어구, 유닛, MAG.
- TPD 고정 피해: Lavaross 1846, Dark Nebulas 1643, Pazuzu laser 1294/gliding 1528, Dubchich beam 1339, Astark spawn 1154, Varazopt missile 1248, Epsilon Rafoie 2105/505/736 조건별 값.
- Demon이 통하지 않는 적 표시 규칙과 TPD Area 1·4·Secret Area 1 웨이브 도식.
- Beyond the Nightmare: 약 2,100 HP 운용, HUcaseal 중심 조합, Jellen/무Deband 조건에서 Belra arm을 이용한 MAG 무적 발동 팁.
- VR TEST EXTRA Singularity: 보스는 불 이외 속성 면역, 일반 몬스터에는 Demon 유효.
- Android 공통: 적정 캐릭터 크기, Twin Blaze·handgun·Twin Rika's Claw·Dragon Sword/Tsumikiri J-Sword 운용, 트랩 슈팅·웨이브 암기.

TPD 웨이브 원본 2개는 `images/discord/archive/strategy/`에 저장했다. 기존 `tpd_page.html`의 정리된 WebP와 대조 자료로 사용한다.

## `📝list-of-combo-bonus-buffed-items`

5개 게시물과 각 답글을 확인했다.

| 게시물 | 확인 메시지 | 주요 항목 |
| --- | ---: | --- |
| Information | 3 | 타격 수 A-B-C 표기, 필요 장비/HP/직업 조건, 커스텀 애니메이션, Battle 속도 중첩 규칙 |
| Others Buffed Gear | 2 | Gael Giel, Devil's/Angel's Wing, Elenor, Dreamcast, Mother Garb+, Three Seals, Samurai Armor |
| Technique | 4 | Dark Bridge, Prophets of Motav, The Sigh of a God |
| Melee | 5 | Orotiagito, NEI'S CLAW, Kunai, Flight Cutter, Excalibur, Valkyrie, Zanba, Slicer of Fanatic, Yunchang |
| Ranged | 5 | Gal Wind, Guld Milla, Mille Marteaux, Dual Bird, L&K38, Anorifle, Tension Blaster, Yasminkov 9000M/2000H/7000V/3000R, Heaven Striker, Cannon Rouge, Snow Queen, Power Maser |

이 포럼에는 원본 첨부 이미지가 없고 텍스트 수치가 핵심이다. `item_page.html`과 `system_page.html`의 버프/콤보 표에 연결한다.

## `📱quest-monster-count`

3개 게시물 본문을 확인했다.

- Episode 1 > Special: Beyond the Mainframe, Silent Nightmare, Beyond the Veil의 몬스터별 수량.
- Episode 2 > Destiny: New MSB의 전체 몬스터·보스 수량.
- Episode 1 > Destiny: Mines Offensive, Forest Offensive, Maximum Attack S, Harmony of Despair I/II, Tyrell's Last Hope 등 퀘스트별·맵별 수량.

이미지 없이 텍스트 표로 구성돼 있으므로 `quest_data_page.html`에서 검색 가능한 표 데이터로 옮기는 것이 적합하다.

## `📱droptable-modified-quests`

3개 게시물, 총 20개 렌더 메시지를 확인했다. 원본 첨부 이미지는 없으며 텍스트 드롭표가 핵심이다.

- EP1 Quests: Silent Nightmare, The Ravenous Predator, Beyond the Mainframe 등.
- EP2 Quests: Underground, The Discontrolled Tower, Catastrophe, The Phantasmal Dimension, Extra Singularity 등.
- Event Quests: Xmas, Easter, Summer, Halloween 퀘스트와 보스·아이템·확률·Section ID 조건.

예시로 확인된 고정 데이터에는 Silent Nightmare의 Girtablulu·Pazuzu·Goran Detonator·Dark Falz·Nightmare Chaser XII, Discontrolled Tower의 Mericus·Astark·Dorphon Eclair·Pazuzu·Manipulator III 드롭이 포함된다. 실제 반영 시 각 행에 Discord 기준일을 함께 기록한다.

## 거래·가격 포럼

- `❓price-check`, `📝players-tradelist`, `💰trades`, `🪙auctions`는 사이드바와 포럼 목록 포함 여부를 확인했다.
- 사이트에는 거래 가이드라인만 사용한다.
- 진행 중 가격, 판매자·구매자 이름, GC 번호, 개별 경매·거래 이미지는 수집·게시하지 않는다.

## 이미지 보강

| 파일 | 출처 | 용도 |
| --- | --- | --- |
| `images/discord/archive/strategy/tpd-wave-area1-area4.png` | TPD Wave | Area 1·4의 15단계 웨이브 도식 |
| `images/discord/archive/strategy/tpd-wave-secret-area1.png` | TPD Wave 답글 | Secret Area 1의 20단계 웨이브 도식 |

두 파일 모두 원본 첨부 경로에서 내려받은 정상 PNG이며 열람 검증을 마쳤다.

