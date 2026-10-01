import { createServer } from "node:net";

/**
 * A port nothing on this machine is listening on, for a test's in-process database. A fixed
 * port can be taken by something the test cannot see — on a WSL host, a Windows process in the
 * same port range — so each test asks the system for one instead.
 */
export function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}
