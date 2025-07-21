// content.js

let shortcuts = {};

// Load shortcuts on script initialization
loadShortcuts();

async function loadShortcuts() {
  try {
    const result = await browser.storage.local.get("customShortcuts");
    shortcuts = result.customShortcuts || {};
  } catch (err) {
    console.error("Failed to load shortcuts:", err);
  }
}

// Listen for storage changes to update shortcuts
browser.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.customShortcuts) {
    shortcuts = changes.customShortcuts.newValue || {};
  }
});

document.addEventListener("keydown", async (e) => {
  // Ignore if user is typing in input fields
  if (
    e.target.tagName === "INPUT" ||
    e.target.tagName === "TEXTAREA" ||
    e.target.contentEditable === "true"
  ) {
    return;
  }

  const combo = normalizeShortcut(formatCombo(e));

  if (shortcuts[combo]) {
    e.preventDefault();
    e.stopPropagation();

    try {
      const response = await browser.runtime.sendMessage({
        type: "triggerShortcut",
        combo: combo,
      });

      if (response?.error) {
        console.error("Shortcut execution failed:", response.error);
      }
    } catch (err) {
      console.error("Failed to send shortcut message:", err);
    }
  }
});

function formatCombo(e) {
  const keys = [];
  if (e.ctrlKey) keys.push("Ctrl");
  if (e.shiftKey) keys.push("Shift");
  if (e.altKey) keys.push("Alt");
  if (e.metaKey) keys.push("Meta");

  // Handle special keys
  let key = e.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();

  keys.push(key);
  return keys.join("+");
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "get_selected_text") {
    const selectedText = window.getSelection().toString().trim();
    sendResponse({ text: selectedText });
    return true;
  }
});
