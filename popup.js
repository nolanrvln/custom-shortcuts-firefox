// popup.js

document.addEventListener("DOMContentLoaded", async () => {
  await loadShortcutCount();
  setupEventListeners();
});

async function loadShortcutCount() {
  try {
    const { customShortcuts } = await browser.storage.local.get(
      "customShortcuts"
    );
    const count = customShortcuts ? Object.keys(customShortcuts).length : 0;
    document.getElementById("shortcutCount").textContent = count;
  } catch (err) {
    console.error("Failed to load shortcuts count:", err);
    document.getElementById("shortcutCount").textContent = "?";
  }
}

function setupEventListeners() {
  // Open options page
  document.getElementById("openOptions").addEventListener("click", () => {
    browser.runtime.openOptionsPage();
    window.close();
  });

  // Refresh shortcuts (reload from storage)
  document
    .getElementById("refreshShortcuts")
    .addEventListener("click", async () => {
      await loadShortcutCount();

      // Send message to all content scripts to reload shortcuts
      try {
        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
          try {
            await browser.tabs.sendMessage(tab.id, {
              type: "reload_shortcuts",
            });
          } catch (err) {
            // Ignore errors for tabs that don't have content scripts
          }
        }
      } catch (err) {
        console.error("Failed to refresh shortcuts:", err);
      }

      // Show feedback
      const btn = document.getElementById("refreshShortcuts");
      const originalText = btn.textContent;
      btn.textContent = "✅ Refreshed";
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1500);
    });

  // View help
  document.getElementById("viewHelp").addEventListener("click", () => {
    browser.tabs.create({
      url: "https://github.com/nolanrvln/custom-shortcuts-firefox#usage",
    });
    window.close();
  });
}
