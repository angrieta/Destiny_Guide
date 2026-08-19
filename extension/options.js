const tokenInput = document.getElementById("token");
const enabledInput = document.getElementById("enabled");
const statusBox = document.getElementById("status");
const saveButton = document.getElementById("save");
const runButton = document.getElementById("run");

function render(state) {
  if (!state?.lastResult) {
    statusBox.textContent = state?.token
      ? "No run yet. Press Run now to test it."
      : "Save a GitHub token to enable syncing.";
    return;
  }

  const result = state.lastResult;
  const lines = [`Checked: ${result.at}`];
  if (result.error) lines.push(`Error: ${result.error}`);
  for (const [label, outcome] of Object.entries(result.datasets ?? {})) {
    lines.push(`${label}: ${outcome}`);
  }
  statusBox.textContent = lines.join("\n");
}

async function load() {
  const synced = await chrome.storage.sync.get(["token", "enabled"]);
  const local = await chrome.storage.local.get(["lastResult"]);
  tokenInput.value = synced.token ?? "";
  enabledInput.checked = synced.enabled !== false;
  render({ ...synced, ...local });
}

saveButton.addEventListener("click", async () => {
  await chrome.storage.sync.set({ token: tokenInput.value.trim(), enabled: enabledInput.checked });
  saveButton.textContent = "Saved";
  setTimeout(() => {
    saveButton.textContent = "Save";
  }, 1200);
});

runButton.addEventListener("click", async () => {
  runButton.disabled = true;
  runButton.textContent = "Running...";
  statusBox.textContent = "Opening PlayPSO and reading the tables. This can take a minute.";
  try {
    const result = await chrome.runtime.sendMessage({ type: "run-now" });
    render({ lastResult: result?.skipped ? null : result, token: tokenInput.value });
    if (result?.skipped) statusBox.textContent = `Skipped: ${result.skipped}`;
  } catch (error) {
    statusBox.textContent = `Failed: ${error.message}`;
  } finally {
    runButton.disabled = false;
    runButton.textContent = "Run now";
  }
});

load();
