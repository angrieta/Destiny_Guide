"use client";

import { useCallback, useRef, useState } from "react";
import { REPO_BRANCH, fetchCurrentFiles, publishFiles, verifyToken } from "./github";
import { buildStatusFile, reviewSnapshot } from "./snapshot";
import type { SnapshotKind, SnapshotReview } from "./snapshot";
import type { FileChange } from "./types";
import styles from "./update.module.css";

const TOKEN_KEY = "destiny-guide-github-token";

const COLLECTORS: Record<SnapshotKind, { script: string; page: string; label: string }> = {
  database: {
    script: "scripts/collect-in-browser.js",
    page: "https://www.playpso.net/database",
    label: "Item Database",
  },
  "drop-tables": {
    script: "scripts/collect-drops-in-browser.js",
    page: "https://playpso.net/drop-tables",
    label: "Drop Tables",
  },
};

const STATUS_PATHS: Record<SnapshotKind, string> = {
  database: "data/database-sync-status.json",
  "drop-tables": "data/drop-sync-status.json",
};

type Phase = "idle" | "reviewing" | "publishing" | "done";

export default function UpdatePanel({ kind, onClose }: { kind: SnapshotKind; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [review, setReview] = useState<SnapshotReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [statusPrevious, setStatusPrevious] = useState<Record<string, unknown> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const collector = COLLECTORS[kind];

  // Read the saved token lazily so the value never lands in server-rendered HTML.
  const savedToken = () => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(TOKEN_KEY) ?? "";
  };

  const copyCollector = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`../${collector.script}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`could not read ${collector.script}`);
      await navigator.clipboard.writeText(await response.text());
      setNotice("Collector script copied. Paste it into the PlayPSO console.");
    } catch (copyError) {
      setError(
        `Could not copy automatically (${(copyError as Error).message}). ` +
          `Open ${collector.script} in the repository and copy it by hand.`,
      );
    }
  }, [collector.script]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setNotice(null);
      setCommitUrl(null);
      setPhase("reviewing");
      try {
        const snapshot = JSON.parse(await file.text());
        const paths =
          snapshot.categories?.map((entry: { type: number }) => `data/database-${entry.type}.json`) ??
          snapshot.difficulties?.map((entry: { difficulty: number }) => `data/drop-tables-${entry.difficulty}.json`) ??
          [];
        const current = await fetchCurrentFiles([...paths, STATUS_PATHS[kind]]);
        setStatusPrevious((current.get(STATUS_PATHS[kind]) as Record<string, unknown>) ?? null);
        const result = reviewSnapshot(snapshot, current);
        if (result.kind !== kind) {
          throw new Error(
            `This is a ${COLLECTORS[result.kind].label} snapshot. Open the ${COLLECTORS[result.kind].label} page to publish it.`,
          );
        }
        setReview(result);
        setToken(savedToken());
      } catch (parseError) {
        setReview(null);
        setError((parseError as Error).message);
      } finally {
        setPhase("idle");
      }
    },
    [kind],
  );

  const publish = useCallback(async () => {
    if (!review) return;
    setError(null);
    setPhase("publishing");
    try {
      await verifyToken(token);

      const files: FileChange[] = review.entries
        .filter((entry) => entry.changed && entry.content)
        .map((entry) => ({ path: entry.path, content: entry.content as string }));
      files.push(buildStatusFile(kind, review, statusPrevious));

      const label = kind === "database" ? "item database" : "drop tables";
      const message =
        review.changedCount > 0
          ? `chore: sync PlayPSO ${label}`
          : `chore: record ${label} check [skip deploy]`;

      const result = await publishFiles(token, files, message);
      setCommitUrl(result.url);
      setPhase("done");

      if (remember) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch (publishError) {
      setError((publishError as Error).message);
      setPhase("idle");
    }
  }, [review, token, remember, kind, statusPrevious]);

  const blocking = review?.problemCount ?? 0;

  return (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Update data"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className={styles.eyebrow}>{collector.label}</p>
            <h3>Update data</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className={styles.body}>
          <section>
            <h4>1. Collect from PlayPSO</h4>
            <p className={styles.hint}>
              PlayPSO blocks automated browsers, so the data has to be read inside a page you opened
              yourself. Open it, press F12, and paste the collector into the Console.
            </p>
            <div className={styles.actions}>
              <button type="button" onClick={copyCollector}>
                Copy collector script
              </button>
              <a href={collector.page} target="_blank" rel="noreferrer">
                Open PlayPSO ↗
              </a>
            </div>
          </section>

          <section>
            <h4>2. Drop the downloaded file</h4>
            <div
              className={dragging ? styles.dropZoneActive : styles.dropZone}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                const file = event.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInput.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") fileInput.current?.click();
              }}
            >
              {phase === "reviewing" ? (
                <span>Checking snapshot...</span>
              ) : (
                <span>
                  Drop <code>playpso-{kind === "database" ? "database" : "drops"}-snapshot.json</code> here,
                  or click to choose it
                </span>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = "";
              }}
            />
          </section>

          {review && (
            <section>
              <h4>3. Review</h4>
              <ul className={styles.reviewList}>
                {review.entries.map((entry) => (
                  <li key={entry.path} className={entry.problems.length > 0 ? styles.rejected : undefined}>
                    <strong>{entry.label}</strong>
                    <span>{entry.problems.length > 0 ? entry.problems.join("; ") : entry.summary}</span>
                  </li>
                ))}
              </ul>
              {blocking > 0 && (
                <p className={styles.warning}>
                  {blocking} {blocking === 1 ? "category looks" : "categories look"} wrong, so nothing will be
                  published. Collect again with every table fully loaded.
                </p>
              )}
              {blocking === 0 && review.changedCount === 0 && (
                <p className={styles.hint}>
                  Already up to date. Publishing records today&apos;s check without changing the site.
                </p>
              )}
            </section>
          )}

          {review && blocking === 0 && (
            <section>
              <h4>4. Publish</h4>
              <p className={styles.hint}>
                Needs a GitHub fine-grained token with <strong>Contents: Read and write</strong> on{" "}
                <code>Destiny_Guide</code>. It is stored only in this browser and never committed.
              </p>
              <label className={styles.tokenField}>
                <span>GitHub token</span>
                <input
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="github_pat_..."
                  autoComplete="off"
                  spellCheck={false}
                />
              </label>
              <label className={styles.checkbox}>
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span>Remember on this device (do not use on a shared computer)</span>
              </label>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primary}
                  onClick={publish}
                  disabled={!token || phase === "publishing"}
                >
                  {phase === "publishing"
                    ? "Publishing..."
                    : review.changedCount > 0
                      ? `Publish ${review.changedCount} change${review.changedCount === 1 ? "" : "s"} to ${REPO_BRANCH}`
                      : "Record check"}
                </button>
                <a
                  href="https://github.com/settings/personal-access-tokens/new"
                  target="_blank"
                  rel="noreferrer"
                >
                  Create a token ↗
                </a>
              </div>
            </section>
          )}

          {notice && <p className={styles.notice}>{notice}</p>}
          {error && <p className={styles.error}>{error}</p>}

          {phase === "done" && commitUrl && (
            <p className={styles.success}>
              Published.{" "}
              <a href={commitUrl} target="_blank" rel="noreferrer">
                View the commit ↗
              </a>{" "}
              GitHub Pages redeploys in about a minute if the data changed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
