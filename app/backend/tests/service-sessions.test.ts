import { describe, expect, it } from "vitest";
import { Identity } from "../src/auth/identity";
import { ServiceSessions } from "../src/auth/service-sessions";

const person = (sessionId: string | null): Identity => ({
  username: "test-vendor-1",
  name: "Vendor One",
  email: "vendor.one@example.test",
  identityProvider: "bceid",
  sessionId,
  expiresAt: 0,
});

function counter() {
  let next = 0;
  return () => `session-${++next}`;
}

describe("the service's own sessions (decision record 0017)", () => {
  it("name the person they were begun for, until they run out", () => {
    let now = 1000;
    const sessions = new ServiceSessions(() => now, 600, counter());
    const id = sessions.begin(person("idp-1"));

    expect(sessions.find(id)?.username).toBe("test-vendor-1");
    expect(sessions.find("never-begun")).toBeNull();
    expect(sessions.find(undefined)).toBeNull();
    now = 1600;
    expect(sessions.find(id)).toBeNull();
  });

  it("end on signing out, together with every other begun from the same identity-provider session (R-4.17)", () => {
    const sessions = new ServiceSessions(() => 0, 600, counter());
    const first = sessions.begin(person("idp-1"));
    const secondTab = sessions.begin(person("idp-1"));
    const somebodyElse = sessions.begin(person("idp-2"));

    sessions.end(first);

    expect(sessions.find(first)).toBeNull();
    expect(sessions.find(secondTab)).toBeNull();
    expect(sessions.find(somebodyElse)).not.toBeNull();
  });

  it("end by the identity-provider session alone, when the request carried a bearer token rather than the cookie", () => {
    const sessions = new ServiceSessions(() => 0, 600, counter());
    const id = sessions.begin(person("idp-1"));

    sessions.end(undefined, "idp-1");

    expect(sessions.find(id)).toBeNull();
  });

  it("are distinct each time one is begun", () => {
    const sessions = new ServiceSessions();

    expect(sessions.begin(person(null))).not.toBe(sessions.begin(person(null)));
  });
});
