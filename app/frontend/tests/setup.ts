import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Each test renders into a document of its own.
afterEach(() => {
  cleanup();
});
