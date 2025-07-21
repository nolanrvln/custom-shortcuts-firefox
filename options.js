// options.js

const shortcutForm = document.getElementById("shortcutForm");
const actionTypeSelect = document.getElementById("actionType");
const paramsContainer = document.getElementById("paramsContainer");
const savedShortcutsList = document.getElementById("savedShortcuts");
const shortcutInput = document.getElementById("shortcut");

function clearParams() {
  paramsContainer.innerHTML = "";
}

function createInput(
  labelText,
  inputType = "text",
  id = "",
  placeholder = "",
  defaultValue = ""
) {
  const wrapper = document.createElement("div");
  wrapper.style.marginTop = "10px";

  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = labelText;
  wrapper.appendChild(label);

  let input;
  if (inputType === "textarea") {
    input = document.createElement("textarea");
    input.rows = 4;
    input.style.width = "100%";
    input.style.fontFamily = "monospace";
  } else if (inputType === "number") {
    input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.max = "10";
  } else {
    input = document.createElement("input");
    input.type = inputType;
  }

  if (id) input.id = id;
  if (placeholder) input.placeholder = placeholder;
  if (defaultValue) input.value = defaultValue;

  wrapper.appendChild(input);
  return wrapper;
}

function renderParamsForAction(actionType, savedParams = {}) {
  clearParams();

  switch (actionType) {
    case "open_url":
      paramsContainer.appendChild(
        createInput(
          "Enter URL(s) (one per line):",
          "textarea",
          "urlsInput",
          "https://youtube.com\nhttps://github.com",
          savedParams.urls ? savedParams.urls.join("\n") : ""
        )
      );

      paramsContainer.appendChild(
        createInput(
          "Number of times to repeat (1-10):",
          "number",
          "countInput",
          "1",
          savedParams.count || 1
        )
      );
      break;

    case "run_js":
      paramsContainer.appendChild(
        createInput(
          "JavaScript code to run:",
          "textarea",
          "jsCodeInput",
          "alert('Hello World!');\nconsole.log('Custom shortcut executed');",
          savedParams.code || ""
        )
      );
      break;

    case "detach_tab":
    case "search_selected_text":
      const infoDiv = document.createElement("div");
      infoDiv.style.marginTop = "10px";
      infoDiv.style.padding = "10px";
      infoDiv.style.backgroundColor = "#f0f0f0";
      infoDiv.style.borderRadius = "4px";
      infoDiv.style.fontSize = "0.9em";

      if (actionType === "detach_tab") {
        infoDiv.textContent =
          "This action will move the current tab to a new window.";
      } else {
        infoDiv.textContent =
          "This action will search for the currently selected text in a new tab.";
      }

      paramsContainer.appendChild(infoDiv);
      break;

    default:
      break;
  }
}

async function saveShortcut(shortcut, action) {
  const normalized = normalizeShortcut(shortcut);
  let { customShortcuts } = await browser.storage.local.get("customShortcuts");
  customShortcuts = customShortcuts || {};

  customShortcuts[normalized] = action;
  await browser.storage.local.set({ customShortcuts });
}

async function loadShortcuts() {
  const { customShortcuts } = await browser.storage.local.get(
    "customShortcuts"
  );
  return customShortcuts || {};
}

async function deleteShortcut(shortcut) {
  let { customShortcuts } = await browser.storage.local.get("customShortcuts");
  if (customShortcuts && customShortcuts[shortcut]) {
    delete customShortcuts[shortcut];
    await browser.storage.local.set({ customShortcuts });
  }
}

async function renderSavedShortcuts() {
  savedShortcutsList.innerHTML = "";
  const shortcuts = await loadShortcuts();

  if (Object.keys(shortcuts).length === 0) {
    const li = document.createElement("li");
    li.textContent = "No custom shortcuts saved yet.";
    li.style.fontStyle = "italic";
    li.style.color = "#666";
    savedShortcutsList.appendChild(li);
    return;
  }

  for (const [shortcut, action] of Object.entries(shortcuts)) {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.justifyContent = "space-between";
    li.style.alignItems = "center";
    li.style.padding = "8px 0";
    li.style.borderBottom = "1px solid #eee";

    const shortcutInfo = document.createElement("div");
    const shortcutSpan = document.createElement("strong");
    shortcutSpan.textContent = shortcut;
    shortcutSpan.style.color = "#2c5aa0";

    const actionSpan = document.createElement("span");
    actionSpan.textContent = ` → ${getActionDescription(action)}`;
    actionSpan.style.color = "#666";

    shortcutInfo.appendChild(shortcutSpan);
    shortcutInfo.appendChild(actionSpan);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.style.backgroundColor = "#dc3545";
    deleteBtn.style.color = "white";
    deleteBtn.style.border = "none";
    deleteBtn.style.padding = "4px 8px";
    deleteBtn.style.borderRadius = "4px";
    deleteBtn.style.cursor = "pointer";

    deleteBtn.onclick = async () => {
      if (
        confirm(`Are you sure you want to delete the shortcut "${shortcut}"?`)
      ) {
        await deleteShortcut(shortcut);
        await renderSavedShortcuts();
      }
    };

    li.appendChild(shortcutInfo);
    li.appendChild(deleteBtn);
    savedShortcutsList.appendChild(li);
  }
}

function getActionDescription(action) {
  switch (action.type) {
    case "open_url":
      const urls = Array.isArray(action.url) ? action.url : [action.url];
      const urlText = urls.length > 1 ? `${urls.length} URLs` : urls[0];
      return `Open ${urlText}${action.count > 1 ? ` (×${action.count})` : ""}`;
    case "detach_tab":
      return "Detach current tab to new window";
    case "run_js":
      return "Run custom JavaScript";
    case "search_selected_text":
      return "Search selected text";
    default:
      return action.type;
  }
}

function gatherActionFromForm() {
  const actionType = actionTypeSelect.value;
  if (!actionType) return null;

  switch (actionType) {
    case "open_url":
      const urlsText = document.getElementById("urlsInput")?.value || "";
      const urls = urlsText
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0);

      if (urls.length === 0) {
        alert("Please enter at least one URL.");
        return null;
      }

      const count = Number(document.getElementById("countInput")?.value) || 1;

      return {
        type: actionType,
        url: urls.length === 1 ? urls[0] : urls,
        count: Math.max(1, Math.min(10, count)), // Limit between 1-10
      };

    case "run_js":
      const code = document.getElementById("jsCodeInput")?.value || "";
      if (!code.trim()) {
        alert("Please enter JavaScript code to run.");
        return null;
      }
      return {
        type: actionType,
        code: code.trim(),
      };

    case "detach_tab":
    case "search_selected_text":
      return { type: actionType };

    default:
      return null;
  }
}

// Event listeners
actionTypeSelect.addEventListener("change", () => {
  renderParamsForAction(actionTypeSelect.value);
});

shortcutForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const shortcut = shortcutInput.value.trim();
  if (!shortcut) {
    alert("Please enter a shortcut.");
    return;
  }

  if (!isShortcutFormatValid(shortcut)) {
    alert(
      "Invalid shortcut format. Please use modifier keys (Ctrl, Shift, Alt, Meta) plus a regular key.\nExample: Ctrl+Shift+Y"
    );
    return;
  }

  const normalized = normalizeShortcut(shortcut);

  if (isReservedShortcut(normalized)) {
    alert(
      `The shortcut "${normalized}" is reserved by Firefox. Please choose a different combination.`
    );
    return;
  }

  // Check if shortcut already exists
  const existingShortcuts = await loadShortcuts();
  if (existingShortcuts[normalized]) {
    if (
      !confirm(
        `The shortcut "${normalized}" already exists. Do you want to replace it?`
      )
    ) {
      return;
    }
  }

  const action = gatherActionFromForm();
  if (!action) {
    return; // Error already shown in gatherActionFromForm
  }

  try {
    await saveShortcut(shortcut, action);
    alert("Shortcut saved successfully!");
    shortcutForm.reset();
    clearParams();
    await renderSavedShortcuts();
  } catch (err) {
    alert("Failed to save shortcut: " + err.message);
  }
});

// Shortcut input handler - captures key combinations
shortcutInput.addEventListener("keydown", (e) => {
  e.preventDefault();

  const keys = [];
  if (e.ctrlKey) keys.push("Ctrl");
  if (e.altKey) keys.push("Alt");
  if (e.shiftKey) keys.push("Shift");
  if (e.metaKey) keys.push("Meta");

  // Only add the key if it's not a modifier by itself
  if (!["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
    let key = e.key;
    if (key === " ") key = "Space";
    else if (key.length === 1) key = key.toUpperCase();
    keys.push(key);
  }

  if (keys.length > 0) {
    shortcutInput.value = keys.join("+");
  }
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", async () => {
  await renderSavedShortcuts();
  renderParamsForAction(actionTypeSelect.value);
});
