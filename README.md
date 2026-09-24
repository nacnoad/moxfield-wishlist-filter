# Moxfield Wishlist Filter

Author: Dogancan Tufekcioglu

A small Chrome/Edge extension for finding wishlist cards in public Moxfield collections and binders. Your wishlist is saved in browser storage. The extension uses Moxfield's own search and does not request an API token.

## Project layout

- `src/` contains the complete unpacked extension, including `manifest.json`. This is the folder to load in your browser or pack for distribution.
- `tests/` contains the source tests and is not part of the extension package.
- `README.md` documents setup and usage.

## Install locally

1. In Chrome or Edge, open the Extensions page and enable Developer mode.
2. Choose **Load unpacked** and select the `src` folder (the one containing `manifest.json`), not the repository root.
3. Visit [your Moxfield wishlist](https://moxfield.com/wishlist) while signed in. In Text view, clear its search and expand all card groups. The extension saves the names and quantities when the visible copies equal Moxfield's total.
4. Open a public Moxfield collection or binder, select the filter icon in the bottom-right corner, then select **Find matches**.

If you previously loaded the repository root as an unpacked extension, remove that old entry and load `src` instead. Your browser may treat the new folder as a different extension; revisit your wishlist to sync it again, or import it through the popup.

If automatic sync cannot see every card, the wishlist page shows what to change. You can also use **More → Export → Copy for Moxfield** and paste the result into the extension popup, or select a CSV or text file there.

When you change your wishlist, visit or reload its Moxfield page in Text view. The extension replaces the saved list once every card is visible. Collection tabs with an active wishlist filter then rerun the search with the new list. If a collection tab is not currently filtering, select **Find matches** to use the updated list.

The panel shows matches for the current search page. For large wishlists, use **Next** and **Previous** to search further batches. Moxfield's own pagination is still available within each batch. The extension matches by card name, regardless of printing, foil, or language. Its row count is for the visible page, not the entire collection. Other filters already set on Moxfield still apply.

**Clear filter** empties the current wishlist search, including after a page reload. Other Moxfield filters stay as they are. Moxfield may change its page layout or search behavior; if that happens, the extension may need updating.

Select **×** to close the filter panel. The filter icon stays in the corner so you can reopen it. Closing the panel does not change the current search. The icon and panel only appear on public collection and binder pages.

## Test and package

Run `node tests/wishlist-core.test.js` from the repository root to check the wishlist parser and search batching. No dependencies need to be installed.

To make a Chrome package, open **Extensions → Pack extension** and set **Extension root directory** to `src`. If you already have a signing key, choose its `.pem` file as the private key. Otherwise, Chrome generates a new one; it may place the new key in the repository root, so move it outside the repository before publishing. Never commit or share a `.pem` file. The generated `.crx` is the packaged extension and can be distributed separately. After changing files in `src`, reload the unpacked extension in your browser or pack it again.