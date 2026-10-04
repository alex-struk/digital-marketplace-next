import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Each end-to-end file runs PostgreSQL in process (PGlite). With a worker per core they starve
    // one another and a file's setup or a query can time out; half the cores keeps them apart.
    maxWorkers: "50%",
    // A cold run (the first after an install) is several times slower than a warm one: a file that
    // passes in 6s warm took 15s cold and one of its tests overran the default 5s limit.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
