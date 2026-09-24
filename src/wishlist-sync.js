(() => {
  const { normalizeName } = WishlistCore;
  let lastSaved = "";
  let scheduled = false;

  const notice = document.createElement("div");
  notice.id = "mwf-sync-status";
  notice.setAttribute("role", "status");
  notice.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:2147483647;max-width:300px;padding:10px 12px;border-radius:8px;background:#1b2029;color:#f4f6fa;box-shadow:0 5px 22px #0007;font:13px system-ui,sans-serif";
  document.body.append(notice);

  async function sync() {
    const main = document.querySelector("#maincontent, [id=maincontent], main");
    const text = main?.innerText || document.body.innerText;
    if (!/\bWish List\b/i.test(text)) return;
    const total = text.match(/(\d+)\s+main deck\s*\/\s*(\d+)\s+sideboard/i);
    if (!total) return;
    if (document.querySelector("#deckbox-search")?.value?.trim()) {
      notice.textContent = "Clear the wishlist search to sync all cards.";
      return;
    }

    const expected = Number(total[1]) + Number(total[2]);
    const entries = new Map();
    let visibleCopies = 0;
    for (const row of document.querySelectorAll("li[data-hash]")) {
      const name = row.querySelector('a[href^="/cards/"]')?.textContent?.trim();
      const count = Number.parseInt(row.querySelector('input[title*="quantity"]')?.value || "", 10);
      if (!name || !Number.isFinite(count) || count < 1) continue;
      visibleCopies += count;
      const key = normalizeName(name);
      const prior = entries.get(key);
      entries.set(key, { name: prior?.name || name, count: (prior?.count || 0) + count });
    }
    if (visibleCopies !== expected) {
      notice.textContent = "Show all wishlist groups in Text view to sync every card.";
      return;
    }

    const wishlistEntries = [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
    const signature = JSON.stringify(wishlistEntries);
    if (signature === lastSaved) return;
    await chrome.storage.local.set({ wishlistEntries, wishlistSource: "Moxfield", wishlistSyncedAt: Date.now() });
    lastSaved = signature;
    notice.textContent = `Wishlist Filter synced ${wishlistEntries.length} card names.`;
  }

  const observer = new MutationObserver((mutations) => {
    if (scheduled || !mutations.some((mutation) => !notice.contains(mutation.target))) return;
    scheduled = true;
    window.setTimeout(() => {
      scheduled = false;
      sync().catch(() => { notice.textContent = "Wishlist sync failed. Try reloading this page."; });
    }, 120);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener("input", () => { window.setTimeout(sync, 120); }, true);
  sync().catch(() => { notice.textContent = "Wishlist sync failed. Try reloading this page."; });
})();
