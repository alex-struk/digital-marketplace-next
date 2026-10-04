import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // Each end-to-end file runs PostgreSQL in process (PGlite). With a worker per core they starve
    // one another and a file's setup or a query can time out; half the cores keeps them apart.
    maxWorkers: "50%",
  },
});
