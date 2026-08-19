/**
 * Commits snapshot files to the repository. Same Git Data API flow as the
 * Update data panel on the site: every changed file lands in one commit so a
 * refresh triggers a single Pages build.
 */
export const REPO_OWNER = "angrieta";
export const REPO_NAME = "Destiny_Guide";
export const REPO_BRANCH = "landing";

const API = "https://api.github.com";
const RAW = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}`;

async function call(path, token, init) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    let message = `GitHub API ${response.status}`;
    try {
      const parsed = JSON.parse(await response.text());
      if (parsed.message) message += `: ${parsed.message}`;
    } catch {
      // Keep the status-only message.
    }
    if (response.status === 401) message = "Token rejected. Check that it has not expired.";
    if (response.status === 403) message = "Token needs Contents: Read and write on this repository.";
    if (response.status === 404) message = "Token cannot see Destiny_Guide. Check its repository access.";
    throw new Error(message);
  }
  return response.json();
}

export async function fetchCurrentFiles(paths) {
  const entries = await Promise.all(
    paths.map(async (path) => {
      try {
        const response = await fetch(`${RAW}/${path}`, { cache: "no-store" });
        if (!response.ok) return null;
        return [path, await response.json()];
      } catch {
        return null;
      }
    }),
  );
  return new Map(entries.filter(Boolean));
}

// btoa is latin1 only, and item descriptions contain non-ASCII characters.
function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function verifyToken(token) {
  const repo = await call(`/repos/${REPO_OWNER}/${REPO_NAME}`, token);
  if (!repo.permissions?.push) throw new Error("Token can read the repository but cannot write to it.");
  return repo.full_name;
}

export async function publishFiles(token, files, message) {
  if (files.length === 0) throw new Error("Nothing to publish.");

  const ref = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${REPO_BRANCH}`, token);
  const baseSha = ref.object.sha;
  const baseCommit = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/commits/${baseSha}`, token);

  const tree = await Promise.all(
    files.map(async (file) => {
      const blob = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/blobs`, token, {
        method: "POST",
        body: JSON.stringify({ content: toBase64(file.content), encoding: "base64" }),
      });
      return { path: file.path, mode: "100644", type: "blob", sha: blob.sha };
    }),
  );

  const newTree = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/trees`, token, {
    method: "POST",
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree }),
  });

  const commit = await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/commits`, token, {
    method: "POST",
    body: JSON.stringify({ message, tree: newTree.sha, parents: [baseSha] }),
  });

  await call(`/repos/${REPO_OWNER}/${REPO_NAME}/git/refs/heads/${REPO_BRANCH}`, token, {
    method: "PATCH",
    body: JSON.stringify({ sha: commit.sha, force: false }),
  });

  return { sha: commit.sha, url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/commit/${commit.sha}` };
}
