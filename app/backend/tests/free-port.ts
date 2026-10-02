import { createServer } from "node:net";

/**
 * A port nothing on this machine is listening on, for a test's in-process database. A fixed
 * port can be taken by something the test cannot see — on a WSL host, a Windows process in the
 * same port range — so each test checks one is free before using it.
 *
 * The port is drawn from below the system's ephemeral range (32768 and up on Linux). A port the
 * system hands out for `listen(0)` or for an outgoing connection comes from that range, and the
 * test files run in parallel, so between this check and the database starting on the port
 * another test's server or client could otherwise be given the same one.
 */
const LOWEST = 20000;
const HIGHEST = 32000;

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => server.close(() => resolve(true)));
  });
}

export async function freePort(): Promise<number> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const port = LOWEST + Math.floor(Math.random() * (HIGHEST - LOWEST));
    if (await isFree(port)) return port;
  }
  throw new Error("No free port found for the test database.");
}
