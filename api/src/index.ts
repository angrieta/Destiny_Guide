/**
 * 닉네임 명부 API — Cloudflare Worker
 *
 * 사이트는 GitHub Pages 정적 배포라 서버가 없다. 방문자가 남긴 글이 남으려면
 * 쓰기 가능한 곳이 따로 있어야 해서, 이 Worker 와 D1 을 별도로 띄운다.
 * 사이트 빌드에는 손대지 않는다 — 페이지가 이 Worker 를 fetch 할 뿐이다.
 *
 * 로그인이 없다. 글을 남길 때 정한 비밀번호를 아는 사람만 그 글을 고치고 지운다.
 * 그래서 이 비밀번호는 "내 글을 남이 못 지우게" 까지만 해준다 — 남의 디스코드 닉을
 * 적어 넣는 것은 막지 못한다. 그 점은 페이지에도 적어 두었고, 그런 글을 치우라고
 * 운영자 비밀번호를 따로 뒀다.
 *
 * 라우트
 *   GET  /api/entries?q=&cursor=   목록 (공개)
 *   POST /api/entries              등록
 *   POST /api/entries/:id/verify   비밀번호 확인 (수정 창을 열기 전에)
 *   POST /api/entries/:id/update   수정
 *   POST /api/entries/:id/delete   삭제
 *
 * 수정·삭제까지 POST 인 이유는 비밀번호를 본문에 담아야 하기 때문이다. 주소에 실으면
 * 브라우저 기록과 서버 로그에 그대로 남고, DELETE 의 본문은 떼어 버리는 중간 장비가 있다.
 */

export interface Env {
  DB: D1Database;
  /** 아무 글이나 지울 수 있는 비밀번호. `wrangler secret put ADMIN_PASSWORD` 로 넣는다. */
  ADMIN_PASSWORD: string;
  /** 페이지를 띄울 수 있는 출처. 쉼표로 구분. */
  ALLOWED_ORIGINS: string;
}

/* ── 한도 ────────────────────────────────────────────────────────────────── */

const MAX_DISCORD_NAME = 40;
// 캐릭터를 여러 개 적는 칸이다. "Foney(FOnewearl), Huma(HUmar)" 처럼 죽 쓴다.
const MAX_CHARACTER_NAME = 160;
const MAX_GUILD_CARD = 24;
const MAX_PLAY_HOURS = 80;
const MAX_COUNTRY = 32;
const MAX_NOTE = 120;
const MIN_PASSWORD = 4;
const MAX_PASSWORD = 72;

/** 한 아이피가 한 시간에 새로 남길 수 있는 글 수. */
const WRITES_PER_HOUR = 15;
/** 비밀번호를 틀릴 수 있는 횟수. 넘으면 한동안 시도 자체를 막는다. */
const FAILS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

const PAGE_SIZE = 50;
/**
 * Workers 의 WebCrypto 는 10만 회를 넘기면 거절한다
 * (NotSupportedError: iteration counts above 100000 are not supported).
 * 그래서 이 값이 여기서 쓸 수 있는 최대치다.
 */
const PBKDF2_ROUNDS = 100000;

/* ── 응답 도우미 ─────────────────────────────────────────────────────────── */

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = env.ALLOWED_ORIGINS.split(",").map((value) => value.trim()).filter(Boolean);
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

function json(body: unknown, status: number, request: Request, env: Env): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // 비밀번호가 오가는 응답이다. 중간 어디에도 남지 않게 한다.
      "Cache-Control": "no-store",
      ...corsHeaders(request, env),
    },
  });
}

const ok = (body: unknown, request: Request, env: Env) => json(body, 200, request, env);
const fail = (status: number, code: string, request: Request, env: Env) =>
  json({ error: code }, status, request, env);

/* ── 비밀번호 ────────────────────────────────────────────────────────────── */

const encoder = new TextEncoder();

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * PBKDF2 로 늘려서 해시만 남긴다.
 *
 * 사람들이 쓰던 비밀번호를 그대로 재사용한다는 전제로 다룬다. 표가 통째로 새어
 * 나가더라도 원래 값을 되돌릴 수 없어야 하고, 그러려면 한 번 계산하는 데 드는
 * 비용이 있어야 한다. 반복 횟수는 그 비용이다.
 */
async function hashPassword(password: string, saltHex: string): Promise<string> {
  const salt = new Uint8Array((saltHex.match(/../g) ?? []).map((h) => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ROUNDS },
    key,
    256,
  );
  return toHex(bits);
}

/**
 * 길이와 내용이 달라도 같은 시간이 걸리게 비교한다.
 *
 * 평범한 === 는 첫 글자가 틀리면 바로 끝나서, 응답 시간 차이로 앞에서부터
 * 한 글자씩 맞춰 볼 여지를 준다.
 */
function sameSecret(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

/* ── 입력 정리 ───────────────────────────────────────────────────────────── */

/**
 * 보이지 않는 문자를 걷어낸다.
 *
 * 제어문자와 zero-width 는 눈에 안 보이면서 이름을 다르게 만든다. 그대로 두면
 * 같은 이름처럼 보이는 줄이 여러 개 생긴다.
 */
function clean(value: unknown, limit: number): string {
  if (typeof value !== "string") return "";

  // 정규식 대신 코드포인트로 거른다. 이 범위들은 화면에 아무것도 그리지 않아서
  // 소스에 리터럴로 박아 두면 다음 사람이 읽을 수도, 고칠 수도 없다.
  let kept = "";
  for (const ch of value.normalize("NFC")) {
    const code = ch.codePointAt(0) as number;
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) continue; // 제어문자 C0 · C1
    if (code >= 0x200b && code <= 0x200f) continue; // zero-width
    if (code >= 0x202a && code <= 0x202e) continue; // 방향 재정의
    if (code >= 0x2060 && code <= 0x2064) continue; // word joiner 등
    if (code === 0xfeff) continue; // BOM
    kept += ch;
  }

  return kept.replace(/\s+/g, " ").trim().slice(0, limit);
}

/** 비밀번호는 앞뒤 공백만 턴다. 가운데 공백도 사람이 정한 값이다. */
const cleanPassword = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/* ── 도배 · 무차별 대입 막기 ─────────────────────────────────────────────── */

const clientIp = (request: Request) => request.headers.get("CF-Connecting-IP") ?? "unknown";

async function countRecent(env: Env, ip: string, kind: string): Promise<number> {
  const row = await env.DB.prepare(`SELECT count(*) AS n FROM attempts WHERE ip = ? AND kind = ? AND at > ?`)
    .bind(ip, kind, Date.now() - HOUR_MS)
    .first<{ n: number }>();
  return row?.n ?? 0;
}

async function mark(env: Env, ip: string, kind: string): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO attempts (ip, kind, at) VALUES (?, ?, ?)`).bind(ip, kind, Date.now()),
    env.DB.prepare(`DELETE FROM attempts WHERE at < ?`).bind(Date.now() - HOUR_MS),
  ]);
}

/* ── 명부 ────────────────────────────────────────────────────────────────── */

type Row = {
  id: number;
  discord_name: string;
  character_name: string;
  guild_card: string;
  play_hours: string;
  country: string;
  note: string;
  pw_hash: string;
  pw_salt: string;
  created_at: number;
  updated_at: number;
};

/** 비밀번호 관련 열은 밖으로 절대 내보내지 않는다. */
const shape = (row: Row) => ({
  id: row.id,
  discordName: row.discord_name,
  characterName: row.character_name,
  guildCard: row.guild_card,
  playHours: row.play_hours,
  country: row.country,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** 그 줄의 비밀번호이거나 운영자 비밀번호이면 통과. */
async function passwordFits(row: Row, password: string, env: Env): Promise<boolean> {
  if (env.ADMIN_PASSWORD && sameSecret(password, env.ADMIN_PASSWORD)) return true;
  const attempt = await hashPassword(password, row.pw_salt);
  return sameSecret(attempt, row.pw_hash);
}

async function listEntries(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = clean(url.searchParams.get("q"), 40).toLowerCase();
  const cursor = Math.max(0, Number(url.searchParams.get("cursor") ?? "0") || 0);

  const statement = query
    ? env.DB.prepare(
        `SELECT * FROM entries
          WHERE lower(character_name) LIKE ?1 OR lower(discord_name) LIKE ?1
          ORDER BY created_at DESC LIMIT ?2 OFFSET ?3`,
      ).bind(`%${query}%`, PAGE_SIZE + 1, cursor)
    : env.DB.prepare(`SELECT * FROM entries ORDER BY created_at DESC LIMIT ?1 OFFSET ?2`).bind(
        PAGE_SIZE + 1,
        cursor,
      );

  const { results } = await statement.all<Row>();
  const rows = results ?? [];
  const hasMore = rows.length > PAGE_SIZE;
  const total = await env.DB.prepare(`SELECT count(*) AS n FROM entries`).first<{ n: number }>();

  return ok(
    {
      entries: rows.slice(0, PAGE_SIZE).map(shape),
      nextCursor: hasMore ? cursor + PAGE_SIZE : null,
      total: total?.n ?? 0,
    },
    request,
    env,
  );
}

async function createEntry(request: Request, env: Env, body: Record<string, unknown>): Promise<Response> {
  const discordName = clean(body.discordName, MAX_DISCORD_NAME);
  const characterName = clean(body.characterName, MAX_CHARACTER_NAME);
  const guildCard = clean(body.guildCard, MAX_GUILD_CARD);
  const playHours = clean(body.playHours, MAX_PLAY_HOURS);
  const country = clean(body.country, MAX_COUNTRY);
  const memo = clean(body.note, MAX_NOTE);
  const password = cleanPassword(body.password);

  if (!discordName) return fail(400, "discord_required", request, env);
  if (!characterName) return fail(400, "character_required", request, env);
  if (password.length < MIN_PASSWORD) return fail(400, "password_short", request, env);
  if (password.length > MAX_PASSWORD) return fail(400, "password_long", request, env);

  const ip = clientIp(request);
  if ((await countRecent(env, ip, "write")) >= WRITES_PER_HOUR) return fail(429, "slow_down", request, env);

  // 같은 캐릭터명이 이미 있으면 알려만 준다. 동명이인이 실제로 있을 수 있어 막지는 않는다.
  const clash = await env.DB.prepare(`SELECT id FROM entries WHERE lower(character_name) = ?`)
    .bind(characterName.toLowerCase())
    .first<{ id: number }>();

  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  const hash = await hashPassword(password, salt);
  const now = Date.now();

  const row = await env.DB.prepare(
    `INSERT INTO entries
       (discord_name, character_name, guild_card, play_hours, country, note,
        pw_hash, pw_salt, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
  )
    .bind(discordName, characterName, guildCard, playHours, country, memo, hash, salt, now, now)
    .first<Row>();

  await mark(env, ip, "write");
  return json({ entry: shape(row as Row), duplicateName: Boolean(clash) }, 201, request, env);
}

/** 수정·삭제·확인이 모두 거치는 관문. 비밀번호가 맞으면 그 줄을 돌려준다. */
async function unlock(
  id: number,
  request: Request,
  env: Env,
  body: Record<string, unknown>,
): Promise<Row | Response> {
  const ip = clientIp(request);
  if ((await countRecent(env, ip, "fail")) >= FAILS_PER_HOUR) return fail(429, "too_many_tries", request, env);

  const row = await env.DB.prepare(`SELECT * FROM entries WHERE id = ?`).bind(id).first<Row>();
  if (!row) return fail(404, "not_found", request, env);

  const password = cleanPassword(body.password);
  if (!password || !(await passwordFits(row, password, env))) {
    await mark(env, ip, "fail");
    return fail(403, "wrong_password", request, env);
  }
  return row;
}

async function updateEntry(row: Row, request: Request, env: Env, body: Record<string, unknown>) {
  const discordName = clean(body.discordName, MAX_DISCORD_NAME) || row.discord_name;
  const characterName = clean(body.characterName, MAX_CHARACTER_NAME) || row.character_name;

  /*
   * 선택 항목은 "안 보냈다" 와 "비웠다" 를 구분해야 한다. 문자열이 왔으면 비운 것도
   * 뜻대로 반영하고, 아예 없으면 원래 값을 지킨다. 그러지 않으면 지우고 싶어도
   * 계속 되살아난다.
   */
  const optional = (value: unknown, current: string, limit: number) =>
    typeof value === "string" ? clean(value, limit) : current;

  const guildCard = optional(body.guildCard, row.guild_card, MAX_GUILD_CARD);
  const playHours = optional(body.playHours, row.play_hours, MAX_PLAY_HOURS);
  const country = optional(body.country, row.country, MAX_COUNTRY);
  const memo = optional(body.note, row.note, MAX_NOTE);

  const ip = clientIp(request);
  if ((await countRecent(env, ip, "write")) >= WRITES_PER_HOUR) return fail(429, "slow_down", request, env);

  const updated = await env.DB.prepare(
    `UPDATE entries SET discord_name = ?, character_name = ?, guild_card = ?, play_hours = ?,
       country = ?, note = ?, updated_at = ? WHERE id = ? RETURNING *`,
  )
    .bind(discordName, characterName, guildCard, playHours, country, memo, Date.now(), row.id)
    .first<Row>();

  await mark(env, ip, "write");
  return ok({ entry: shape(updated as Row) }, request, env);
}

/* ── 라우팅 ──────────────────────────────────────────────────────────────── */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (path === "/api/entries" && request.method === "GET") return listEntries(request, env);

    if (request.method === "POST") {
      const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!body) return fail(400, "bad_body", request, env);

      if (path === "/api/entries") return createEntry(request, env, body);

      const match = path.match(/^\/api\/entries\/(\d+)\/(verify|update|delete)$/);
      if (match) {
        const id = Number(match[1]);
        const action = match[2];

        const found = await unlock(id, request, env, body);
        if (found instanceof Response) return found;

        if (action === "verify") return ok({ entry: shape(found) }, request, env);
        if (action === "update") return updateEntry(found, request, env, body);

        await env.DB.prepare(`DELETE FROM entries WHERE id = ?`).bind(id).run();
        return ok({ deleted: id }, request, env);
      }
    }

    return fail(404, "not_found", request, env);
  },
};
