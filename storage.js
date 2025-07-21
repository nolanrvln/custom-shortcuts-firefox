// storage.js

const STORAGE_KEY = "customShortcuts";

/**
 * Get all stored shortcuts as object { shortcut: action }
 */
async function getShortcuts() {
  const data = await browser.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] || {};
}

/**
 * Save or update one shortcut-action pair
 * @param {string} shortcut
 * @param {object} action
 */
async function saveShortcut(shortcut, action) {
  const all = await getShortcuts();
  all[shortcut] = action;
  await browser.storage.local.set({ [STORAGE_KEY]: all });
}

/**
 * Delete a shortcut entry by key
 * @param {string} shortcut
 */
async function deleteShortcut(shortcut) {
  const all = await getShortcuts();
  if (all.hasOwnProperty(shortcut)) {
    delete all[shortcut];
    await browser.storage.local.set({ [STORAGE_KEY]: all });
  }
}
