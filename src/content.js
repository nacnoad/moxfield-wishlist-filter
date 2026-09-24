(() => {
  const { normalizeName, makeBatches, batchQuery } = WishlistCore;
  let entries = [];
  let batches = [];
  let currentBatch = 0;
  let active = false;
  let scheduled = false;
  let currentPath = window.location.pathname;

  const panel = document.createElement("section");
  panel.id = "mwf-panel";
  panel.classList.add("mwf-collapsed");
  panel.setAttribute("aria-label", "Moxfield wishlist filter");
  panel.innerHTML = `
    <div class="mwf-heading">
      <div class="mwf-title">Wishlist filter</div>
      <button type="button" class="mwf-close" aria-label="Close wishlist filter">×</button>
    </div>
    <div class="mwf-status" role="status" aria-live="polite"></div>
    <div class="mwf-controls">
      <button type="button" class="mwf-apply">Find matches</button>
      <button type="button" class="mwf-prev" aria-label="Previous wishlist batch">Previous</button>
      <button type="button" class="mwf-next" aria-label="Next wishlist batch">Next</button>
      <button type="button" class="mwf-clear">Clear filter</button>
    </div>
    <div class="mwf-note">Uses Moxfield search; existing collection filters still apply.</div>
    <button type="button" class="mwf-reopen" aria-label="Open wishlist filter" title="Wishlist filter">
      <svg data-prefix="fal" data-icon="filter" class="svg-inline--fa fa-filter mwf-icon" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M2.4 83.8C7.4 71.8 19.1 64 32 64l448 0c12.9 0 24.6 7.8 29.6 19.8s2.2 25.7-6.9 34.9L320 301.3 320 480c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-64-64c-6-6-9.4-14.1-9.4-22.6L192 301.3 9.4 118.6C.2 109.5-2.5 95.7 2.4 83.8zM480 96L32 96 219.3 283.3c3 3 4.7 7.1 4.7 11.3l0 121.4 64 64 0-185.4c0-4.2 1.7-8.3 4.7-11.3L480 96z"></path>
      </svg>
    </button>`;
  document.body.append(panel);
  const status = panel.querySelector(".mwf-status");
  const applyButton = panel.querySelector(".mwf-apply");
  const previousButton = panel.querySelector(".mwf-prev");
  const nextButton = panel.querySelector(".mwf-next");
  const clearButton = panel.querySelector(".mwf-clear");
  const closeButton = panel.querySelector(".mwf-close");
  const reopenButton = panel.querySelector(".mwf-reopen");
  closeButton.addEventListener("click", () => {
    panel.classList.add("mwf-collapsed");
    reopenButton.focus();
  });
  reopenButton.addEventListener("click", () => {
    panel.classList.remove("mwf-collapsed");
    closeButton.focus();
  });

  function syncPageVisibility() {
    const path = window.location.pathname;
    panel.classList.toggle("mwf-outside-collection", !/^\/(?:collection|binders)\/[^/]+\/?$/.test(path));
    if (path === currentPath) return;
    currentPath = path;
    active = false;
    document.querySelectorAll("tr.mwf-match, tr.mwf-nonmatch").forEach((row) => row.classList.remove("mwf-match", "mwf-nonmatch"));
    status.textContent = entries.length ? `${entries.length} wishlist card names ready.` : "Open the extension icon to import your wishlist.";
    updateControls();
  }

  function searchField() {
    return document.querySelector("#deckbox-search");
  }

  function submitSearch(value) {
    const field = searchField();
    const button = field?.parentElement?.querySelector("button");
    if (!field || !button) {
      status.textContent = "Moxfield search is not ready yet. Try again in a moment.";
      return false;
    }
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
    setter.call(field, value);
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
    window.setTimeout(() => button.click(), 0);
    return true;
  }

  function visibleMatches() {
    if (!active) return;
    const wanted = new Set(batches[currentBatch].map((entry) => normalizeName(entry.name)));
    let matchingRows = 0;
    let matchingCards = 0;
    for (const row of document.querySelectorAll("table tbody tr")) {
      const cardButton = row.querySelector("td:nth-child(2) [role=button]");
      const name = (cardButton?.firstChild?.nodeType === Node.TEXT_NODE
        ? cardButton.firstChild.textContent
        : cardButton?.textContent)?.trim();
      if (!name) continue;
      const match = wanted.has(normalizeName(name));
      row.classList.toggle("mwf-match", match);
      row.classList.toggle("mwf-nonmatch", !match);
      if (match) {
        matchingRows += 1;
        matchingCards += Number.parseInt(row.querySelector("td")?.textContent || "0", 10) || 0;
      }
    }
    status.textContent = `Batch ${currentBatch + 1}/${batches.length}: ${matchingRows} matching rows, ${matchingCards} copies on this page.`;
  }

  function updateControls() {
    applyButton.disabled = !entries.length;
    previousButton.disabled = !active || currentBatch === 0;
    nextButton.disabled = !active || currentBatch >= batches.length - 1;
    clearButton.disabled = false;
  }

  function runBatch(index) {
    currentBatch = index;
    active = true;
    if (!document.querySelector("table tbody") && document.querySelector("#tablemode1")) {
      document.querySelector("#tablemode1").click();
    }
    if (!submitSearch(batchQuery(batches[index]))) {
      active = false;
      updateControls();
      return;
    }
    status.textContent = `Searching batch ${index + 1}/${batches.length}…`;
    updateControls();
  }

  applyButton.addEventListener("click", () => {
    if (!entries.length) return;
    runBatch(0);
  });
  previousButton.addEventListener("click", () => runBatch(currentBatch - 1));
  nextButton.addEventListener("click", () => runBatch(currentBatch + 1));
  clearButton.addEventListener("click", () => {
    if (!submitSearch("")) return;
    active = false;
    document.querySelectorAll("tr.mwf-match, tr.mwf-nonmatch").forEach((row) => row.classList.remove("mwf-match", "mwf-nonmatch"));
    status.textContent = "Wishlist search cleared.";
    updateControls();
  });

  chrome.storage.local.get("wishlistEntries", ({ wishlistEntries = [] }) => {
    entries = wishlistEntries;
    batches = makeBatches(entries);
    status.textContent = entries.length ? `${entries.length} wishlist card names ready.` : "Open the extension icon to import your wishlist.";
    updateControls();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.wishlistEntries) return;
    const wasFiltering = active;
    entries = changes.wishlistEntries.newValue || [];
    batches = makeBatches(entries);
    document.querySelectorAll("tr.mwf-match, tr.mwf-nonmatch").forEach((row) => row.classList.remove("mwf-match", "mwf-nonmatch"));
    if (wasFiltering && entries.length) {
      runBatch(0);
      return;
    }
    if (wasFiltering) submitSearch("");
    active = false;
    status.textContent = entries.length
      ? `${entries.length} wishlist card names ready.`
      : "Wishlist is empty. Visit your Moxfield wishlist to sync it.";
    updateControls();
  });

  const observer = new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => !panel.contains(mutation.target))) return;
    syncPageVisibility();
    if (!active || scheduled) return;
    scheduled = true;
    window.setTimeout(() => {
      scheduled = false;
      visibleMatches();
    }, 80);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("popstate", syncPageVisibility);
  syncPageVisibility();
})();
