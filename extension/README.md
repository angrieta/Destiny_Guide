# Destiny Guide Sync (브라우저 확장)

PlayPSO를 확인해서 바뀐 데이터만 저장소에 커밋하는 Chrome / Edge 확장입니다.
설치 후에는 손댈 일이 없습니다.

## 왜 확장인가

PlayPSO는 Playwright 같은 자동화 브라우저를 차단합니다(headless든 아니든, IP와 무관).
GitHub Actions에서도, Claude API에서도 `403`이 돌아옵니다.
반면 **회원님이 실제로 쓰는 브라우저**는 정상적으로 열립니다.
이 확장은 그 브라우저 안에서 도는 것이라 차단되지 않습니다. 우회 코드는 없습니다.

## 언제 실행되나

PC가 꺼져 있는 시간이 많다는 전제로 **시각 고정이 아니라 브라우저 시작 기준**입니다.

- 브라우저를 켜고 30초 뒤 실행
- 마지막 확인이 **20시간 이내**면 건너뜀 (하루 한 번꼴)
- 브라우저를 며칠 켜두는 경우를 위해 6시간마다 한 번 더 확인

즉 **PC를 켜고 브라우저를 열면 알아서 돕니다.** 백그라운드 탭으로 잠깐 열렸다 닫히며,
작업 중인 화면을 가리지 않습니다.

## 설치

1. 이 저장소를 받습니다 (`git clone` 또는 GitHub에서 **Code → Download ZIP**).
2. Chrome/Edge 주소창에 `chrome://extensions` (Edge는 `edge://extensions`) 입력.
3. 우측 상단 **개발자 모드** 켜기.
4. **압축해제된 확장 프로그램을 로드** → 이 `extension` 폴더 선택.
5. 툴바에서 확장 아이콘 클릭 → **GitHub token** 입력 → **Save**.
6. **Run now**를 눌러 한 번 확인합니다.

### 토큰 만들기

<https://github.com/settings/personal-access-tokens/new>

- **Repository access** → Only select repositories → `Destiny_Guide`
- **Permissions** → Repository permissions → **Contents: Read and write**

## 포맷하거나 PC를 바꿨을 때

**중요한 건 아무것도 PC에만 있지 않습니다.**

| 항목 | 어디에 있나 | 포맷 후 |
| --- | --- | --- |
| 아이템·드랍 데이터 | GitHub 저장소 `data/` | 그대로 있음 |
| 확장 코드 | GitHub 저장소 `extension/` | 다시 받으면 됨 |
| GitHub 토큰 | 브라우저 프로필 동기화(`storage.sync`) | 같은 계정으로 로그인하면 **자동 복구** |
| 사이트 | GitHub Pages | 영향 없음 |

복구 절차는 **위 설치 1~4번을 다시 하는 것**이 전부입니다 (2분).
브라우저에 같은 Google/Microsoft 계정으로 로그인되어 있으면 토큰까지 따라오므로
5번은 건너뛸 수 있습니다. 아니면 토큰만 새로 만들어 넣으면 됩니다.

확장을 아예 설치하지 않아도 사이트는 정상 동작하고,
`/database`·`/drop-tables` 하단의 **Update data** 버튼으로 어느 PC에서든 갱신할 수 있습니다.
확장은 그걸 자동으로 해주는 것일 뿐, 없어도 막히는 건 없습니다.

## 안전장치

수집한 데이터가 이상하면 **아무것도 커밋하지 않습니다.**

- 5개 분류(또는 4개 난이도)가 전부 읽히지 않으면 중단
- 행이 0개 / `Name` 컬럼 없음 / 이름 있는 행 95% 미만
- 행 수가 이전 대비 80% 미만으로 감소
- 기존 컬럼이 사라짐

Cloudflare 확인 화면이 안 지나가거나 표가 안 뜨면 그냥 실패로 기록하고 다음 기회에 다시 시도합니다.
기존 데이터는 절대 덮어쓰지 않습니다. 결과는 확장 아이콘을 눌러 확인할 수 있습니다.

변경된 파일은 **커밋 하나**로 올라가고, 실제 데이터가 바뀐 경우에만 Pages가 재배포됩니다.

## 토큰 보관에 대해

토큰은 `chrome.storage.sync`에 저장됩니다. 브라우저 프로필을 따라다니므로 재설치에 강하지만,
그만큼 브라우저 계정 클라우드에 (암호화되어) 올라갑니다.
그게 마음에 걸리시면 `background.js`와 `options.js`의 `chrome.storage.sync`를
`chrome.storage.local`로 바꾸세요. 대신 포맷하면 토큰은 다시 넣어야 합니다.

**공용 PC에는 설치하지 마세요.**
