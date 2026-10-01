import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// jsdom does not implement scrolling; the router scrolls on every navigation, and each call
// would otherwise print "Not implemented: Window's scrollTo() method".
window.scrollTo = (() => {}) as typeof window.scrollTo;

// Each test renders into a document of its own.
afterEach(() => {
  cleanup();
});
