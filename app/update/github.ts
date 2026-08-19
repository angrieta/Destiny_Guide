/**
 * Commits snapshot files straight to the repository from the browser.
 *
 * Uses the Git Data API rather than the Contents API so all changed files land in
 * a single commit; six separate Contents calls would produce six commits and six
 * Pages builds. The token never leaves this origin and is never written to the repo.
 */
import type { FileChange, Json } from "./types";

export const REPO_OWNER = "angrieta";
export const REPO_NAME = "Destiny_Guide";
export const REPO_BRANCH = "landing";

const API = "https://api.github.com";
const RAW = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}`;

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

async function call(path: string, token: string, init?: RequestInit) {
  const response = await fetch(`${API}${path}`, { ...init, headers: headers(token) });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    let message = `GitHub API ${response.status}`;
    try {
      const parsed = JSON.parse(detail);
      if (parsed.message) message += `: ${parsed.message}`;
    } catch {
      if (detail) message += `: ${detail.slice(0, 200)}`;
    }
    if (response.status === 401) message = "Token rejected. Check that it has not expired.";
    if (response.status === 403) {
      message = "Token lacks permission. It needs Contents: Read and write on this repository.";
    }
    if (response.status === 404) {
      message = "Repository not visible to this token. Check the token has access to Destiny_Guide.";
    }
    throw new Error(message);
  }
  return response.json();
}

/** Reads the files currently on the branch so changes can be diffed before publishing. */
export async function fetchCurrentFiles(paths: string[]): Promise<Map<string, Json>> {
  const entries = await Promise.all(
    paths.map(async (path) => {
      try {
        const response = await fetch(`${RAW}/${path}`, { cache: "no-store" });
        if (!response.ok) return null;
        return [path, (await response.json()) as Json] as const;
      } catch {
        return null;
      }
    }),
  );
  return new Map(entries.filter((entry): entry is readonly [string, Json] => entry !== null));
}

// btoa only handles latin1, and item descriptions contain non-ASCII characters.
function toBase64(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function verifyToken(token: string) {
  const repo = await call(`/repos/${REPO_OWNER}/${REPO_NAME}`, token);
  if (!repo.permissions?.push) {
    throw new Error("Token can read this repository but cannot write to it.");
  }
  return repo.full_name as string;
}

export async function publishFiles(token: string, files: FileChange[], message: string) {
  if (files.length === 0) throw new Error("Nothing to publish.");

  const ref = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${REPO_BRANCH}`, token);
  const baseSha = ref.object.sha as string;

  const baseCommit = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${baseSha}`, token);
  const baseTree = baseCommit.tree.sha as string;

  const blobs = await Promise.all(
    files.map(async (file) => {
      const blob = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({ content: toBase64(file.content), encoding: "base64" }),
      });
      return { path: file.path, mode: "100644", type: "blob", sha: blob.sha as string };
    }),
  );

  const tree = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseTree, tree: blobs }),
  });

  const commit = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }),
  });

  await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${REPO_BRANCH}`, token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return {
    sha: commit.sha as string,
    url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/commit/${commit.sha}`,
  };
}
