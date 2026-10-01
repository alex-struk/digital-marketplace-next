import { describe, expect, it } from "vitest";
import {
  FileGrants,
  contentTypeForName,
  fileNameError,
  hasImageEnding,
  mayReadByGrants,
  readAccessFrom,
  storedImageSize,
} from "../src/rules/files";
import { footerOf, renderText } from "../src/mail/render";
import { Message } from "../src/mail/message";
import {
  profileSectionShown,
  profileSections,
  validCapabilities,
  mayReadAccount,
} from "../src/rules/users";

const UPLOADER = "00000000-0000-4000-8000-000000000201";
const OTHER = "00000000-0000-4000-8000-000000000202";

describe("a file's name (R-8.23)", () => {
  it("is one to 255 characters, and nothing else about it is checked", () => {
    expect(fileNameError("a")).toBeNull();
    expect(fileNameError("x".repeat(255))).toBeNull();
    expect(fileNameError("no ending at all")).toBeNull();
    expect(fileNameError("x".repeat(256))).toMatch(/between 1 and 255 characters/);
    expect(fileNameError("")).toMatch(/between 1 and 255 characters/);
  });
});

describe("a picture's name (R-8.30)", () => {
  it("ends in .jpg, .jpeg or .png, whatever its case", () => {
    expect(["a.jpg", "a.JPEG", "a.Png"].every(hasImageEnding)).toBe(true);
    expect(["a.gif", "a.png.txt", "png"].some(hasImageEnding)).toBe(false);
  });
});

describe("read-access information (R-8.18, R-8.24)", () => {
  it("is refused when missing, not well-formed, or naming an unknown kind of access", () => {
    for (const raw of [undefined, "", "[{tag:", '[{"tag":"ministry"}]', '{"tag":"user","value":"x"}', '[{"tag":"userType","value":"CLERK"}]']) {
      const reading = readAccessFrom(raw);
      expect(reading.ok).toBe(false);
      if (!reading.ok) expect(reading.message).toMatch(/^The read-access information provided was invalid/);
    }
  });

  it("takes one statement or a list, reduces repeats, and allows an empty list", () => {
    expect(readAccessFrom('{"tag":"any"}')).toEqual({ ok: true, access: [{ tag: "any" }] });
    expect(readAccessFrom('[{"tag":"any"},{"tag":"any"},{"tag":"userType","value":"GOV"}]')).toEqual({
      ok: true,
      access: [{ tag: "any" }, { tag: "userType", value: "GOV" }],
    });
    expect(readAccessFrom("[]")).toEqual({ ok: true, access: [] });
  });
});

describe("who may read a file by what was recorded (R-8.7)", () => {
  const privateFile: FileGrants = { createdBy: UPLOADER, public: false, users: [], userTypes: [] };

  it("is its uploader and any administrator, and nobody else", () => {
    expect(mayReadByGrants(privateFile, { id: UPLOADER, type: "VENDOR" })).toBe(true);
    expect(mayReadByGrants(privateFile, { id: OTHER, type: "ADMIN" })).toBe(true);
    expect(mayReadByGrants(privateFile, { id: OTHER, type: "VENDOR" })).toBe(false);
    expect(mayReadByGrants(privateFile, null)).toBe(false);
  });

  it("widens to a named person, a named kind of account, or anyone at all", () => {
    expect(mayReadByGrants({ ...privateFile, users: [OTHER] }, { id: OTHER, type: "VENDOR" })).toBe(true);
    expect(mayReadByGrants({ ...privateFile, userTypes: ["GOV"] }, { id: OTHER, type: "GOV" })).toBe(true);
    expect(mayReadByGrants({ ...privateFile, userTypes: ["GOV"] }, { id: OTHER, type: "VENDOR" })).toBe(false);
    expect(mayReadByGrants({ ...privateFile, public: true }, null)).toBe(true);
  });
});

describe("the size a picture is stored at (R-8.13)", () => {
  it("narrows a wide picture and shortens a tall one to 500 pixels, keeping proportions", () => {
    expect(storedImageSize(2000, 300)).toEqual({ width: 500, height: 75 });
    expect(storedImageSize(300, 2000)).toEqual({ width: 75, height: 500 });
    expect(storedImageSize(400, 400)).toEqual({ width: 400, height: 400 });
    expect(storedImageSize(1000, 1500)).toEqual({ width: 333, height: 500 });
  });
});

describe("the content type a file is described by (R-8.10)", () => {
  it("comes from the ending of its name alone", () => {
    expect(contentTypeForName("terms.pdf")).toBe("application/pdf");
    expect(contentTypeForName("Photo.JPG")).toBe("image/jpeg");
    expect(contentTypeForName("README")).toBe("application/octet-stream");
    expect(contentTypeForName("archive.unknownending")).toBe("application/octet-stream");
  });
});

describe("how a message ends (R-6.6, R-6.7, R-6.16)", () => {
  const look = { serviceOrigin: "http://localhost:4300" };
  const message: Message = { kind: "sample", subject: "S", title: "T", body: [] };

  it("offers to unsubscribe only where the notice choice governs the message", () => {
    const governed = footerOf({ ...message, governedByNoticeChoice: true }, look);
    expect(JSON.stringify(governed)).toContain('"text":"Unsubscribe"');
    expect(JSON.stringify(governed)).toContain("http://localhost:4300/users/me?tab=notifications&unsubscribe");

    const other = renderText(message, look);
    expect(other).not.toContain("Unsubscribe");
    expect(other).toContain("Manage your notification settings (http://localhost:4300/users/me?tab=notifications)");
  });
});

describe("capabilities (R-4.8)", () => {
  it("are only the service's own, each once, and may be none", () => {
    expect(validCapabilities([])).toEqual([]);
    expect(validCapabilities(["User Research", "Agile Coaching", "User Research"])).toEqual([
      "Agile Coaching",
      "User Research",
    ]);
    expect(validCapabilities(["Juggling"])).toBeNull();
    expect(validCapabilities("Agile Coaching")).toBeNull();
  });
});

describe("whose profile, and which sections (R-4.25, R-4.34)", () => {
  const vendor = { id: UPLOADER, type: "VENDOR" as const };
  const admin = { id: OTHER, type: "ADMIN" as const };

  it("is read by its owner or an administrator only", () => {
    expect(mayReadAccount(vendor, UPLOADER)).toBe(true);
    expect(mayReadAccount(admin, UPLOADER)).toBe(true);
    expect(mayReadAccount({ id: OTHER, type: "VENDOR" }, UPLOADER)).toBe(false);
    expect(mayReadAccount(null, UPLOADER)).toBe(false);
  });

  it("offers each kind of account its own sections, and an administrator another's profile alone", () => {
    expect(profileSections(vendor, vendor)).toEqual(["profile", "capabilities", "organizations", "notifications", "legal"]);
    expect(profileSections(admin, admin)).toEqual(["profile", "notifications"]);
    expect(profileSections(admin, vendor)).toEqual(["profile"]);
    expect(profileSectionShown(profileSections(admin, vendor), "capabilities")).toBe("profile");
    expect(profileSectionShown(profileSections(admin, admin), "legal")).toBe("profile");
    expect(profileSectionShown(profileSections(vendor, vendor), "legal")).toBe("legal");
  });
});
