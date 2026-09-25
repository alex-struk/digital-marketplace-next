#!/usr/bin/env node
// Runs the Prisma CLI through its resolved entry point instead of through the
// `prisma` link npm drops in node_modules/.bin.
//
// npm links a package's binaries as symlinks where the filesystem allows it and as
// plain copies where it does not. Prisma's CLI loads its WebAssembly modules from
// `__dirname`, so when the link is a copy it looks for them in node_modules/.bin and
// dies with ENOENT on prisma_schema_build_bg.wasm — during `npm install`, before
// anything else can run. Resolving prisma/build/index.js and spawning that keeps
// `__dirname` inside node_modules/prisma/build on either kind of filesystem.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const cli = require.resolve("prisma/build/index.js");

const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
