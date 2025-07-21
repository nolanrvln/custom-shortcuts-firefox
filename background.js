// background.js

// Listen for messages from content scripts
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "triggerShortcut") {
    const { customShortcuts } = await browser.storage.local.get(
      "customShortcuts"
    );
    const action = customShortcuts?.[message.combo];

    if (action) {
      try {
        await handleAction(action);
        return { success: true };
      } catch (err) {
        console.error("Error executing shortcut:", err);
        return { error: err.message };
      }
    }
    return { error: "No action found for shortcut" };
  }

  if (message.type === "get_selected_text") {
    // This will be handled in content script
    return true;
  }
});

// Handle extension installation
browser.runtime.onInstalled.addListener(() => {
  console.log("Custom Shortcuts extension installed");
});
