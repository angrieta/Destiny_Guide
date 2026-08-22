import { spawn } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const outputDirectory = resolve(projectRoot, ".pages-output");
const clientDirectory = resolve(projectRoot, "dist/client");
const vinextCli = resolve(projectRoot, "node_modules/vinext/dist/cli.js");
const port = Number(process.env.PAGES_EXPORT_PORT ?? 4175);
const basePath = process.env.GITHUB_PAGES_BASE_PATH ?? "/Destiny_Guide";

async function waitForServer(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The production server is still starting.
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function rewriteCssAssetUrls(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await rewriteCssAssetUrls(path);
      continue;
    }
    if (!entry.name.endsWith(".css")) continue;
    const css = await readFile(path, "utf8");
    const rewritten = css
      .replaceAll('url("/images/', `url("${basePath}/images/`)
      .replaceAll("url('/images/", `url('${basePath}/images/`)
      .replaceAll("url(/images/", `url(${basePath}/images/`);
    if (rewritten !== css) await writeFile(path, rewritten, "utf8");
  }
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(clientDirectory, outputDirectory, { recursive: true });

const routes = ["drop-tables", "database", "calculator", "redeem"];
const server = spawn(process.execPath, [vinextCli, "start", "--port", String(port)], {
  cwd: projectRoot,
  env: { ...process.env, GITHUB_PAGES_BASE_PATH: basePath },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverError = "";
server.stderr.on("data", (chunk) => {
  serverError += chunk.toString();
});

try {
  for (const route of routes) {
    const response = await waitForServer(`http://127.0.0.1:${port}${basePath}/${route}`);
    const html = await response.text();
    const routeDirectory = resolve(outputDirectory, route);
    await mkdir(routeDirectory, { recursive: true });
    await writeFile(resolve(routeDirectory, "index.html"), html, "utf8");
    console.log(`Exported /${route}`);
  }
  await writeFile(resolve(outputDirectory, ".nojekyll"), "", "utf8");
  await rewriteCssAssetUrls(resolve(outputDirectory, "assets"));
  console.log(`Exported GitHub Pages site to ${outputDirectory}`);
} finally {
  server.kill("SIGTERM");
  if (serverError) process.stderr.write(serverError);
}
