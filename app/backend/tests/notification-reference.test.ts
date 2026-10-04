import { describe, expect, it } from "vitest";
import * as administrator from "../src/mail/notifications/administrator";
import * as closing from "../src/mail/notifications/closing";
import * as codeWithUs from "../src/mail/notifications/code-with-us-opportunity";
import * as evaluation from "../src/mail/notifications/evaluation";
import * as organization from "../src/mail/notifications/organization";
import * as otherPrograms from "../src/mail/notifications/other-program-opportunity";
import * as ownAccount from "../src/mail/notifications/own-account";
import * as proposal from "../src/mail/notifications/proposal";
import { referenceGroups } from "../src/mail/notifications/reference";
import * as runningOpportunity from "../src/mail/notifications/running-opportunity";
import * as team from "../src/mail/notifications/team";
import * as termsUpdated from "../src/mail/notifications/terms-updated";
import * as welcome from "../src/mail/notifications/welcome";
import { emailReference } from "../src/notifications/email-reference";
import { mayReadEmailReference } from "../src/rules/users";

/**
 * The administrator's notification reference (R-6.13, R-6.19, R-6.6): every message the service
 * can send is on it, built from invented samples by the same functions that build it for sending,
 * and each ends the way the sent message ends.
 */
const look = {
  serviceOrigin: "http://localhost:4300",
  contactEmail: "digitalmarketplace@example.test",
  testEnvironment: false,
};

/** Every module in `src/mail/notifications` that builds messages. */
const MODULES = {
  administrator,
  closing,
  codeWithUs,
  evaluation,
  organization,
  otherPrograms,
  ownAccount,
  proposal,
  runningOpportunity,
  team,
  termsUpdated,
  welcome,
};

/** Exports of those modules that are helpers, not messages. */
const NOT_MESSAGES = new Set(["deadlineInWords", "invitationAnswerAddress"]);

const groups = referenceGroups(look);
const entries = groups.flatMap((group) => group.messages);

describe("what the reference shows (R-6.19)", () => {
  it("has every message builder in the service on it", () => {
    const shown = new Set<unknown>(entries.map((entry) => entry.sentBy));
    const missing = Object.entries(MODULES).flatMap(([module, exports]) =>
      Object.entries(exports)
        .filter(([name, value]) => typeof value === "function" && !NOT_MESSAGES.has(name))
        .filter(([, builder]) => !shown.has(builder))
        .map(([name]) => `${module}.${name}`),
    );
    expect(missing).toEqual([]);
  });

  it("shows each program's own version of a message the programs each send", () => {
    const kinds = new Set(entries.map((entry) => entry.message.kind));
    for (const short of ["cwu", "swu", "twu"]) {
      for (const kind of ["opportunity-published", "opportunity-published-author", "opportunity-submitted-for-review", "opportunity-submitted-for-review-author"]) {
        expect(kinds, `${short}-${kind}`).toContain(`${short}-${kind}`);
      }
    }
    for (const program of ["code-with-us", "sprint-with-us", "team-with-us"]) {
      for (const kind of [
        "opportunity-updated",
        "opportunity-cancelled",
        "opportunity-cancelled-author",
        "proposal-submitted",
        "proposal-withdrawn",
        "proposal-withdrawn-administrators",
        "proposal-awarded",
        "proposal-not-awarded",
      ]) {
        expect(kinds, `${program}-${kind}`).toContain(`${program}-${kind}`);
      }
    }
    for (const kind of [
      "code-with-us-opportunity-ready-for-evaluation",
      "sprint-with-us-opportunity-ready-for-evaluators",
      "team-with-us-opportunity-ready-for-evaluators",
      "swu-evaluation-panel-member-added",
      "twu-evaluation-panel-member-added",
      "swu-questions-ready-for-consensus",
      "twu-questions-ready-for-consensus",
      "swu-questions-consensus-submitted",
      "twu-questions-consensus-submitted",
      "swu-questions-consensus-finalized",
      "twu-questions-consensus-finalized",
    ]) {
      expect(kinds, kind).toContain(kind);
    }
  });

  it("shows both the addendum and the change notice, though they share a kind", () => {
    const updates = entries.filter((entry) => entry.message.kind === "code-with-us-opportunity-updated");
    expect(updates.map((entry) => entry.id)).toEqual(["cwu-addendum-everyone", "cwu-changed-everyone"]);
  });

  it("comes to sixty-two messages under forty-five events (decision record 0067)", () => {
    expect([entries.length, groups.length]).toEqual([62, 45]);
  });

  it("gives every group and every message an identifier of its own", () => {
    const ids = [...groups.map((group) => group.id), ...entries.map((entry) => entry.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("how each message is shown (R-6.13)", () => {
  const page = emailReference(look);
  const shown = page.groups.flatMap((group) => group.messages);

  it("gives each its subject, its summary and its body, grouped under the event that sends it", () => {
    expect(page.groups.length).toBe(groups.length);
    for (const group of page.groups) {
      expect(group.event).not.toBe("");
      expect(group.messages.length).toBeGreaterThan(0);
    }
    for (const entry of shown) {
      expect(entry.subject).not.toBe("");
      expect(entry.summary).toBeTruthy();
      expect(entry.title).not.toBe("");
      expect(entry.body.length).toBeGreaterThan(0);
    }
  });

  it("shows the subject as a recipient receives it, marked in a test environment (R-6.3)", () => {
    const marked = emailReference({ ...look, testEnvironment: true }).groups[0]!.messages[0]!;
    expect(marked.subject).toBe(`[TEST] ${shown[0]!.subject}`);
  });

  it("is built from invented samples, naming no seeded account", () => {
    const text = JSON.stringify(page);
    for (const seeded of ["admin.one@", "staff.one@", "vendor.one@", "org.owner@", "org.admin@", "org.member@"]) {
      expect(text).not.toContain(seeded);
    }
  });
});

describe("how each sample ends (R-6.6, R-6.16)", () => {
  const page = emailReference(look);
  const shown = page.groups.flatMap((group) => group.messages);
  const footerLink = (entry: (typeof shown)[number]) => {
    const link = entry.footer.kind === "paragraph" ? entry.footer.content.find((part) => typeof part !== "string") : undefined;
    return link as { text: string; href: string } | undefined;
  };

  it("leads with a new-opportunity announcement, ending in Unsubscribe with the question already asked", () => {
    const first = shown[0]!;
    expect(first.id).toBe("cwu-published-subscribers");
    expect(footerLink(first)).toEqual({ text: "Unsubscribe", href: "http://localhost:4300/users/me?tab=notifications&unsubscribe" });
  });

  it("offers Unsubscribe on every new-opportunity announcement, and the settings link on every other message", () => {
    for (const entry of shown) {
      const announcement = /-published-subscribers$/.test(entry.id);
      expect(footerLink(entry)?.text, entry.id).toBe(announcement ? "Unsubscribe" : "Manage your notification settings");
    }
    expect(shown.filter((entry) => footerLink(entry)?.text === "Unsubscribe").length).toBe(3);
  });
});

describe("who may open it (R-6.13 note)", () => {
  it("is an administrator alone", () => {
    expect(mayReadEmailReference({ type: "ADMIN" })).toBe(true);
    expect(mayReadEmailReference({ type: "GOV" })).toBe(false);
    expect(mayReadEmailReference({ type: "VENDOR" })).toBe(false);
    expect(mayReadEmailReference(null)).toBe(false);
  });
});
