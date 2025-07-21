// utils.js

/**
 * Normalize shortcut string for consistent comparison
 */
function normalizeShortcut(shortcut) {
  if (!shortcut) return "";

  const parts = shortcut
    .toLowerCase()
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);

  const modifiersOrder = ["ctrl", "shift", "alt", "meta"];
  const mods = [];
  let key = "";

  for (const part of parts) {
    if (modifiersOrder.includes(part)) {
      mods.push(part);
    } else {
      key = part;
    }
  }

  // Sort modifiers in consistent order
  mods.sort((a, b) => modifiersOrder.indexOf(a) - modifiersOrder.indexOf(b));

  return (
    mods.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join("+") +
    (mods.length && key ? "+" : "") +
    key.charAt(0).toUpperCase() +
    key.slice(1)
  );
}

function isShortcutFormatValid(shortcut) {
  if (!shortcut) return false;
  // Must have at least one modifier + a key
  const parts = shortcut.split("+");
  if (parts.length < 2) return false;

  const validModifiers = ["ctrl", "shift", "alt", "meta"];
  const modifiers = parts.slice(0, -1).map((p) => p.toLowerCase());
  const key = parts[parts.length - 1];

  // Check if all modifiers are valid
  if (!modifiers.every((mod) => validModifiers.includes(mod))) return false;

  // Key should be non-empty
  return key && key.length > 0;
}

/**
 * Extended list of Firefox reserved shortcuts
 */
const reservedShortcuts = new Set([
  // Navigation
  "Alt+Left",
  "Ctrl+[",
  "Backspace",
  "Alt+Right",
  "Ctrl+]",
  "Shift+Backspace",
  "Alt+Home",
  "Ctrl+Home",
  "F5",
  "Ctrl+R",
  "Ctrl+F5",
  "Ctrl+Shift+R",

  // Page navigation
  "Tab",
  "Shift+Tab",
  "PageDown",
  "Space",
  "PageUp",
  "Shift+Space",
  "End",
  "Ctrl+Down",
  "Home",
  "Ctrl+Up",
  "F6",
  "Shift+F6",

  // Basic actions
  "Ctrl+P",
  "Alt+Enter",
  "Ctrl+S",
  "Ctrl++",
  "Ctrl+-",
  "Ctrl+0",
  "Ctrl+C",
  "Ctrl+X",
  "Delete",
  "Ctrl+Backspace",
  "Ctrl+Delete",
  "Ctrl+Left",
  "Ctrl+Right",
  "Ctrl+End",
  "Ctrl+V",
  "Ctrl+Shift+V",
  "Ctrl+Y",
  "Ctrl+Shift+Z",
  "Ctrl+A",
  "Ctrl+Z",

  // Search
  "Ctrl+F",
  "F3",
  "Ctrl+G",
  "Shift+F3",
  "Ctrl+Shift+G",
  "Ctrl+K",
  "Ctrl+E",

  // Bookmarks and history
  "Ctrl+J",
  "Ctrl+H",
  "Ctrl+Shift+H",
  "Ctrl+Shift+Delete",
  "Ctrl+D",
  "Ctrl+B",
  "Ctrl+Shift+B",
  "Ctrl+Shift+O",

  // Tabs and windows
  "Ctrl+W",
  "Ctrl+F4",
  "Ctrl+Shift+W",
  "Alt+F4",
  "Ctrl+Tab",
  "Ctrl+Q",
  "Ctrl+PageUp",
  "Ctrl+Shift+Tab",
  "Ctrl+PageDown",
  "Alt+1",
  "Alt+2",
  "Alt+3",
  "Alt+4",
  "Alt+5",
  "Alt+6",
  "Alt+7",
  "Alt+8",
  "Alt+9",
  "Ctrl+Shift+PageUp",
  "Ctrl+Shift+PageDown",
  "Ctrl+M",
  "Ctrl+T",
  "Ctrl+N",
  "Ctrl+Shift+P",
  "Ctrl+Shift+T",
  "Ctrl+Shift+N",

  // Developer tools
  "F12",
  "Ctrl+Shift+I",
  "Ctrl+Shift+K",
  "Ctrl+Shift+C",
  "Ctrl+Shift+S",
  "Shift+F7",
  "Ctrl+Shift+E",
  "Ctrl+Shift+M",
  "Ctrl+U",
  "Ctrl+Shift+J",
  "Ctrl+I",

  // Address bar
  "Ctrl+L",
  "Alt+D",
  "F4",

  // Other
  "Escape",
  "Enter",
  "Ctrl+Enter",
  "Shift+Enter",
  "Ctrl+Shift+Enter",
  "Ctrl+Shift+A",
  "Ctrl+Shift+Y",
]);

function isReservedShortcut(shortcut) {
  const normalized = normalizeShortcut(shortcut);
  return reservedShortcuts.has(normalized);
}

/**
 * Action handlers - these functions execute the actual shortcuts
 */
async function handleAction(action) {
  switch (action.type) {
    case "open_url":
      return openTabs(action);
    case "detach_tab":
      return detachCurrentTab();
    case "run_js":
      return runCustomScript(action.code);
    case "search_selected_text":
      return searchSelectedText();
    default:
      throw new Error("Unknown action type: " + action.type);
  }
}

async function openTabs(action) {
  const count = action.count || 1;
  const urls = Array.isArray(action.url) ? action.url : [action.url];

  for (let i = 0; i < count; i++) {
    for (const url of urls) {
      if (url && url.trim()) {
        // Ensure URL has protocol
        let finalUrl = url.trim();
        if (!finalUrl.match(/^https?:\/\//)) {
          finalUrl = "https://" + finalUrl;
        }
        await browser.tabs.create({ url: finalUrl });
      } else {
        await browser.tabs.create({}); // Create blank tab
      }
    }
  }
}

async function detachCurrentTab() {
  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.id) {
      await browser.windows.create({ tabId: tab.id });
    }
  } catch (err) {
    throw new Error("Failed to detach tab: " + err.message);
  }
}

async function runCustomScript(code) {
  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.id && code) {
      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: (codeToRun) => {
          try {
            eval(codeToRun);
          } catch (err) {
            console.error("Script execution error:", err);
          }
        },
        args: [code],
      });
    }
  } catch (err) {
    throw new Error("Failed to run custom script: " + err.message);
  }
}

async function searchSelectedText() {
  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab || !tab.id) return;

    const response = await browser.tabs.sendMessage(tab.id, {
      type: "get_selected_text",
    });

    if (response && response.text) {
      await browser.search.search({ query: response.text });
    }
  } catch (err) {
    throw new Error("Could not search selected text: " + err.message);
  }
}

// Export functions for use in other contexts
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    normalizeShortcut,
    isShortcutFormatValid,
    isReservedShortcut,
    handleAction,
  };
}
