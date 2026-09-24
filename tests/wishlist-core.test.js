const assert = require("node:assert/strict");
const test = require("node:test");
const { parseWishlist, makeBatches, batchQuery } = require("../src/wishlist-core");

test("imports Moxfield text, combines copies, and ignores printings", () => {
  assert.deepEqual(parseWishlist("2 Sol Ring (CMM) 396\n1 Sol Ring (LTC) 284 *F*\n1 Rhystic Study (WOT) 25"), [
    { name: "Rhystic Study", count: 1 },
    { name: "Sol Ring", count: 3 }
  ]);
});

test("imports quoted CSV names and quantities", () => {
  assert.deepEqual(parseWishlist('Count,Name,Edition\n2,"Squee, Dubious Monarch",DMU\n1,"Squee, Dubious Monarch",DMU'), [
    { name: "Squee, Dubious Monarch", count: 3 }
  ]);
});

test("batches queries without losing cards", () => {
  const entries = parseWishlist("1 Abandon Hope\n1 Abrade\n1 Sol Ring");
  const batches = makeBatches(entries, 45);
  assert.equal(batches.flat().length, 3);
  assert.ok(batches.every((batch) => batchQuery(batch).length <= 45));
});
