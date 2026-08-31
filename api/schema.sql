-- 닉네임 명부 (디스코드 닉 ↔ 캐릭터명)
--
-- 한 사람이 한 줄이다. 캐릭터를 여러 개 쓰는 게 보통이라 클래스별로 characters 에 담는다.
-- 로그인이 없으므로 "내 글" 을 증명하는 것은 등록할 때 정한 비밀번호뿐이다.
--
-- 처음 설치할 때:
--   npx.cmd wrangler d1 execute destiny-roster --remote --file=./schema.sql
--
-- ⚠ 맨 위에서 기존 표를 지운다. 이미 글이 쌓인 뒤에 컬럼만 더하고 싶다면
--   이 파일을 돌리지 말고 ALTER TABLE 을 쓸 것. 예:
--   ALTER TABLE entries ADD COLUMN country TEXT NOT NULL DEFAULT '';

DROP TABLE IF EXISTS entries;

CREATE TABLE entries (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,

  discord_name    TEXT    NOT NULL,

  -- 클래스별 이름을 담은 JSON. {"HUmar":"Huma","FOnewearl":"Foney"} 꼴.
  characters      TEXT    NOT NULL DEFAULT '{}',
  -- 위에서 만들어 내는 검색·표시용 평문. 서버가 채우며 따로 받지 않는다.
  character_name  TEXT    NOT NULL,

  -- 아래 셋은 전부 선택. 안 적으면 비어 있고 화면에도 안 나온다.
  guild_card      TEXT    NOT NULL DEFAULT '',
  -- IANA 시간대(예: Asia/Seoul). 보는 사람 시계로 바꾸는 데 쓴다.
  timezone        TEXT    NOT NULL DEFAULT '',
  -- [{"start":600,"end":720}] — 자정으로부터 몇 분인지. 문자열로 두면 변환이 안 된다.
  play_windows    TEXT    NOT NULL DEFAULT '[]',

  note            TEXT    NOT NULL DEFAULT '',

  -- 비밀번호는 절대 그대로 담지 않는다. PBKDF2 로 늘린 해시와, 줄마다 다른 소금만
  -- 남긴다. 표가 통째로 새어 나가도 원래 비밀번호를 되돌릴 수 없어야 한다.
  pw_hash         TEXT    NOT NULL,
  pw_salt         TEXT    NOT NULL,

  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- 목록은 항상 최신순으로 읽는다.
CREATE INDEX entries_created_at ON entries (created_at DESC);

-- 캐릭터명으로 찾는 게 이 페이지의 본래 용도다.
CREATE INDEX entries_character ON entries (lower(character_name));
CREATE INDEX entries_discord ON entries (lower(discord_name));

-- 도배와 비밀번호 무차별 대입을 막기 위한 기록.
-- kind 는 'write'(등록·수정) 또는 'fail'(비밀번호 틀림).
DROP TABLE IF EXISTS attempts;

CREATE TABLE attempts (
  ip    TEXT    NOT NULL,
  kind  TEXT    NOT NULL,
  at    INTEGER NOT NULL
);

CREATE INDEX attempts_lookup ON attempts (ip, kind, at DESC);
