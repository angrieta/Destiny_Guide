-- 기존 명부와 건의사항을 건드리지 않고 익명 이용 집계만 추가한다.
-- npx.cmd wrangler d1 execute destiny-roster --remote --file=./migrations/0002-analytics.sql

CREATE TABLE IF NOT EXISTS analytics_daily (
  day     TEXT    NOT NULL,
  event   TEXT    NOT NULL,
  path    TEXT    NOT NULL,
  target  TEXT    NOT NULL DEFAULT '',
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, path, target)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS analytics_daily_lookup
  ON analytics_daily (event, day, count DESC);
