const textarea = document.querySelector("#wishlist");
const fileInput = document.querySelector("#file");
const status = document.querySelector("#status");

chrome.storage.local.get(["wishlistEntries", "wishlistSource"], ({ wishlistEntries = [], wishlistSource }) => {
  status.textContent = wishlistEntries.length
    ? `${wishlistEntries.length} card names saved${wishlistSource === "Moxfield" ? " from your Moxfield wishlist" : ""}.`
    : "No wishlist saved yet.";
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  textarea.value = await file.text();
  status.textContent = `${file.name} loaded. Select Save wishlist to use it.`;
});

document.querySelector("#save").addEventListener("click", async () => {
  try {
    const entries = WishlistCore.parseWishlist(textarea.value);
    await chrome.storage.local.set({ wishlistEntries: entries, wishlistSource: "manual" });
    status.textContent = `${entries.length} card names saved. Open a Moxfield collection or binder.`;
  } catch (error) {
    status.textContent = error.message;
  }
});
