(() => {
  function normalizeName(name) {
    return String(name || "").normalize("NFKC").replace(/\s+/g, " ").trim().toLocaleLowerCase("en");
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else if (char === '"') {
          quoted = false;
        } else {
          field += char;
        }
      } else if (char === '"') {
        quoted = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field.replace(/\r$/, ""));
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += char;
      }
    }
    if (quoted) throw new Error("The CSV has an unclosed quotation mark.");
    if (field || row.length) {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
    }
    return rows;
  }

  function parseWishlist(text) {
    const cleaned = String(text || "").replace(/^\uFEFF/, "").trim();
    if (!cleaned) throw new Error("Paste your wishlist export first.");
    const entries = new Map();
    const firstLine = cleaned.split(/\r?\n/, 1)[0];
    const looksCsv = /(^|,)\s*"?(name|card name)"?\s*(,|$)/i.test(firstLine);

    function add(name, count) {
      const key = normalizeName(name);
      if (!key) return;
      const quantity = Number.parseInt(count, 10);
      if (!Number.isFinite(quantity) || quantity < 1) return;
      const prior = entries.get(key);
      entries.set(key, { name: prior?.name || name.trim(), count: (prior?.count || 0) + quantity });
    }

    if (looksCsv) {
      const rows = parseCsv(cleaned);
      const headers = rows.shift().map((header) => normalizeName(header));
      const nameIndex = headers.findIndex((header) => header === "name" || header === "card name");
      const countIndex = headers.findIndex((header) => ["count", "quantity", "qty"].includes(header));
      if (nameIndex < 0) throw new Error("The CSV needs a Name column.");
      for (const row of rows) add(row[nameIndex] || "", countIndex < 0 ? 1 : row[countIndex] || 1);
    } else {
      for (const rawLine of cleaned.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || /^(sideboard|commander|companion|maybeboard|mainboard):?$/i.test(line)) continue;
        const match = line.match(/^(\d+)\s*x?\s+(.+)$/i);
        const count = match ? match[1] : 1;
        let name = match ? match[2] : line;
        name = name.replace(/\s+\([A-Za-z0-9]{2,8}\)\s+\S+(?:\s+\*[A-Za-z]+\*)?\s*$/, "");
        name = name.replace(/\s+\*[A-Za-z]+\*\s*$/, "").trim();
        add(name, count);
      }
    }
    if (!entries.size) throw new Error("No cards were found in that export.");
    return [...entries.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  function makeBatches(entries, maxLength = 750) {
    const batches = [];
    let batch = [];
    let length = 2;
    for (const entry of entries) {
      const clause = `name:"${entry.name.replace(/["\\]/g, " ")}"`;
      const addition = clause.length + (batch.length ? 4 : 0);
      if (batch.length && length + addition > maxLength) {
        batches.push(batch);
        batch = [];
        length = 2;
      }
      batch.push({ ...entry, clause });
      length += clause.length + (batch.length > 1 ? 4 : 0);
    }
    if (batch.length) batches.push(batch);
    return batches;
  }

  function batchQuery(batch) {
    return `(${batch.map((entry) => entry.clause).join(" or ")})`;
  }

  const core = { normalizeName, parseWishlist, makeBatches, batchQuery };
  globalThis.WishlistCore = core;
  if (typeof module !== "undefined" && module.exports) module.exports = core;
})();
