-- 건의사항
--
-- 명부와 같은 방식이다. 로그인이 없고, 글을 남길 때 정한 비밀번호를 아는 사람만
-- 그 글을 고치고 지운다. 운영자 비밀번호는 아무 글에나 통한다.
--
-- 적용:
--   npx.cmd wrangler d1 execute destiny-roster --remote --file=./suggestions.sql
--
-- ⚠ 맨 위에서 기존 표를 지운다. 이미 글이 쌓였다면 돌리지 말 것.

DROP TABLE IF EXISTS suggestions;

CREATE TABLE suggestions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,

  -- 익명으로 남겨도 된다. 비우면 화면에 "익명" 으로 나온다.
  nickname     TEXT    NOT NULL DEFAULT '',
  title        TEXT    NOT NULL,
  body         TEXT    NOT NULL,

  -- 쓴 사람의 언어와, 나머지 언어로 옮겨 둔 것. 명부의 한 줄 소개와 같은 방식이다.
  lang         TEXT    NOT NULL DEFAULT '',
  title_i18n   TEXT    NOT NULL DEFAULT '{}',
  body_i18n    TEXT    NOT NULL DEFAULT '{}',

  -- open · planned · done · declined. 운영자만 바꿀 수 있다.
  status       TEXT    NOT NULL DEFAULT 'open',
  -- 운영자가 남기는 한 줄. 왜 반영했는지 · 왜 안 하는지.
  reply        TEXT    NOT NULL DEFAULT '',

  votes        INTEGER NOT NULL DEFAULT 0,

  pw_hash      TEXT    NOT NULL,
  pw_salt      TEXT    NOT NULL,

  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL
);

CREATE INDEX suggestions_created ON suggestions (created_at DESC);
-- 표를 정렬해 보여주는 두 가지 기준. 많이 눌린 순이 이 페이지의 본래 쓸모다.
CREATE INDEX suggestions_votes ON suggestions (votes DESC, created_at DESC);
CREATE INDEX suggestions_status ON suggestions (status, created_at DESC);

-- 한 사람이 같은 글에 여러 번 못 누르게 한다.
-- 아이피로만 막으므로 완벽하지는 않다. 로그인이 없는 이상 이게 한계다.
DROP TABLE IF EXISTS votes;

CREATE TABLE votes (
  suggestion_id INTEGER NOT NULL,
  ip            TEXT    NOT NULL,
  at            INTEGER NOT NULL
);

CREATE UNIQUE INDEX votes_once ON votes (suggestion_id, ip);
