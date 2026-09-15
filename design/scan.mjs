// Compiles the catalogue and runs an accessibility scan over every story in it, then
// writes what it found to `design/report.json`.
//
// This exists because a design gate can only be ruled on what somebody can check. A story
// naming a component the design system does not export, or a token it does not define, is
// indistinguishable from a correct one until something compiles it; and "no accessibility
// violations" is a claim about a rendered page, which nothing can make about source text.
// The report is the evidence the gate reads, so it records the failures as well as the
// zeroes — a run that could not compile writes a report saying so rather than no report.
//
//   node scan.mjs            typecheck, build, scan, write design/report.json
//   node scan.mjs --no-build reuse the existing storybook-static
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const require = createRequire(import.meta.url);
const here = import.meta.dirname;
const STATIC_DIR = join(here, "storybook-static");
const REPORT = join(here, "report.json");

const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".map": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".ico": "image/x-icon",
};

// A static server rather than `file://`: a built Storybook loads itself as ES modules, and
// a module graph served from the filesystem is refused by the browser's own origin rules.
function serve(dir) {
  const server = createServer((req, res) => {
    const rel = normalize(decodeURIComponent(new URL(req.url, "http://localhost").pathname)).replace(/^(\.\.[/\\])+/, "");
    let path = resolve(dir, `.${rel}`);
    if (!path.startsWith(resolve(dir))) { res.writeHead(403).end(); return; }
    if (existsSync(path) && rel.endsWith("/")) path = join(path, "index.html");
    if (!existsSync(path)) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(readFileSync(path));
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok({ server, port: server.address().port })));
}

// tsc and the Storybook build are both compilers and they do not catch the same thing: the
// build resolves every import and would fail on a component that does not exist, while the
// typecheck is what rejects a prop the component does not take.
async function compile(step, cmd, args) {
  try {
    await run(cmd, args, { cwd: here, maxBuffer: 64 * 1024 * 1024 });
    return { step, ok: true, output: "" };
  } catch (e) {
    return { step, ok: false, output: `${e.stdout ?? ""}${e.stderr ?? ""}`.trim().split("\n").slice(-40).join("\n") };
  }
}

function fail(report, message) {
  report.ok = false;
  report.messages.push(message);
  writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
  console.error(message);
  process.exit(1);
}

// What the report is a report about. A scan is evidence only for the catalogue it read, so
// the gate recomputes this and refuses a report whose stories have been edited since.
function catalogueDigest() {
  const dir = join(here, "catalogue");
  if (!existsSync(dir)) return null;
  const hash = createHash("sha256");
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".stories.tsx")).sort()) {
    hash.update(f).update("\0").update(readFileSync(join(dir, f))).update("\0");
  }
  return hash.digest("hex");
}

// A package's own executable, found through its manifest rather than by guessing a path
// inside it: Storybook does not publish its CLI in its exports map, so `require.resolve`
// of the file refuses it outright, and the entry point moves between major versions.
function binOf(pkg) {
  let manifest;
  try { manifest = require.resolve(`${pkg}/package.json`); }
  catch { manifest = join(here, "node_modules", pkg, "package.json"); }
  const bin = JSON.parse(readFileSync(manifest, "utf8")).bin;
  return resolve(manifest, "..", typeof bin === "string" ? bin : bin[pkg]);
}

// axe refuses to start while another run is in flight, and the Accessibility panel runs
// its own over the same document. The collision is a race rather than a finding, so it is
// waited out — reporting it as a story that would not render would be a false accusation
// against the design.
async function scan(page) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await page.evaluate(async () => {
        const r = await window.axe.run(document.querySelector("#storybook-root"), { resultTypes: ["violations"] });
        return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 5) }));
      });
    } catch (e) {
      if (attempt >= 10 || !/already running/i.test(String(e.message ?? e))) throw e;
      await new Promise((ok) => setTimeout(ok, 250));
    }
  }
}

const report = {
  generated: new Date().toISOString(),
  axe: require("axe-core/package.json").version,
  catalogue: catalogueDigest(),
  ok: true,
  messages: [],
  compile: [],
  stories: [],
  totals: { stories: 0, violations: 0, failed: 0 },
};

const build = !process.argv.includes("--no-build");

report.compile.push(await compile("typecheck", process.execPath, [require.resolve("typescript/bin/tsc"), "--noEmit", "--pretty", "false"]));
if (build) report.compile.push(await compile("build", process.execPath, [binOf("storybook"), "build", "-o", STATIC_DIR, "--quiet"]));
for (const c of report.compile) if (!c.ok) fail(report, `the catalogue does not ${c.step === "build" ? "build" : "typecheck"}:\n${c.output}`);

const indexPath = join(STATIC_DIR, "index.json");
if (!existsSync(indexPath)) fail(report, "storybook-static/index.json is missing; the catalogue was never built");
const entries = Object.values(JSON.parse(readFileSync(indexPath, "utf8")).entries ?? {}).filter((e) => e.type === "story");
if (!entries.length) fail(report, "the built catalogue contains no stories");

const { chromium } = await import("playwright");
const { server, port } = await serve(STATIC_DIR);
const browser = await chromium.launch();
// One page reused across the catalogue: a fresh context per story would triple the run for
// no isolation that matters, since a story is torn down with the iframe's own document.
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

for (const entry of entries) {
  const row = { id: entry.id, title: entry.title, file: entry.importPath, violations: [] };
  try {
    await page.goto(`http://127.0.0.1:${port}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=story`, { waitUntil: "load", timeout: 30000 });
    // Storybook reports a story that threw by rendering its own error page, which is a
    // perfectly accessible document and would otherwise be scanned and pass.
    await page.waitForFunction(() => {
      const root = document.querySelector("#storybook-root");
      return document.querySelector(".sb-show-errordisplay, #error-message") || (root && root.children.length > 0);
    }, null, { timeout: 30000 });
    const threw = await page.$eval("body", (b) => b.querySelector(".sb-show-errordisplay, #error-message")?.textContent?.trim().slice(0, 400) ?? null);
    if (threw) { row.error = threw; report.totals.failed += 1; report.stories.push(row); continue; }
    await page.addScriptTag({ content: axeSource });
    row.violations = await scan(page);
    report.totals.violations += row.violations.length;
  } catch (e) {
    row.error = String(e.message ?? e).split("\n")[0];
    report.totals.failed += 1;
  }
  report.stories.push(row);
}

await browser.close();
server.close();

report.totals.stories = report.stories.length;
report.ok = report.totals.violations === 0 && report.totals.failed === 0;
if (!report.ok) {
  for (const s of report.stories) {
    if (s.error) report.messages.push(`${s.id}: did not render — ${s.error}`);
    for (const v of s.violations) report.messages.push(`${s.id}: ${v.id} (${v.impact}) — ${v.help} [${v.nodes.join(", ")}]`);
  }
}
writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(`${report.totals.stories} stories · ${report.totals.violations} violations · ${report.totals.failed} did not render`);
process.exit(report.ok ? 0 : 1);
