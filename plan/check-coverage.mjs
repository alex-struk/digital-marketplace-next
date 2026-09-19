// Check that every accepted, non-superseded criterion appears in exactly one slice of plan/tasks.md.
import { readFileSync } from "node:fs";

const root = process.argv[2] ?? ".";
const index = JSON.parse(readFileSync(`${root}/spec/criteria-index.json`, "utf8")).criteria;
const wanted = new Set(index.filter((c) => c.state === "accepted" && !c.supersededBy).map((c) => c.id));
const known = new Set(index.map((c) => c.id));

const seen = new Map();
const slices = [];
let current = null;
for (const line of readFileSync(`${root}/plan/tasks.md`, "utf8").split("\n")) {
  const h = line.match(/^### (Slice \d+)/);
  if (h) { current = h[1]; slices.push(current); continue; }
  const m = line.match(/^- criteria:\s*(.*)$/);
  if (m && current) for (const id of m[1].match(/R-\d+\.\d+/g) ?? []) seen.set(id, (seen.get(id) ?? 0) + 1);
}

const placed = new Set(seen.keys());
const dupes = [...seen].filter(([, n]) => n > 1).map(([c]) => c).sort();
const missing = [...wanted].filter((c) => !placed.has(c)).sort();
const extra = [...placed].filter((c) => !wanted.has(c)).map((c) => `${c} (${known.has(c) ? "not accepted or superseded" : "unknown"})`);
const total = [...seen.values()].reduce((a, b) => a + b, 0);

console.log(`slices: ${slices.length}`);
console.log(`accepted, non-superseded criteria in index: ${wanted.size}`);
console.log(`distinct criteria placed in tasks.md: ${placed.size} (placements: ${total})`);
console.log(`placed more than once: ${dupes.join(", ") || "none"}`);
console.log(`accepted but placed nowhere: ${missing.join(", ") || "none"}`);
console.log(`placed but not accepted/non-superseded: ${extra.join(", ") || "none"}`);
const ok = !(dupes.length || missing.length || extra.length);
console.log(`RESULT: ${ok ? "PASS" : "FAIL"}`);
process.exit(ok ? 0 : 1);
