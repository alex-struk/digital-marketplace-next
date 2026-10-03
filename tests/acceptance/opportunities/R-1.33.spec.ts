// criterion: @R-1.33 v2
// provenance: blind, spec@76d9da180ae1fba4b970cd40bf8a0a55a680eb3e, derived 2026-10-03
import { test, expect, persona, seed } from "../../fixtures";
import type { Persona, Surface } from "../../fixtures";

// Everything here goes through opportunity-history-request: the service's own answer to a
// request to read an opportunity, and its own operation to add a note, since no screen
// offers one. The history is read afresh after every note is added, so what is asserted is
// what the service holds and shows, not what it answered at the moment of adding.
//
// Who may see a note is read from seed.opportunities.cwuWithPrivateNote, published, whose
// history already holds a note by its author (seed.users.staffOne, persona.publicSectorStaff)
// with seed.stored_files.opportunityNoteAttachment attached. "Only the author and
// administrators" is checked against three readers it excludes: a public sector staff
// member who is not the author (persona.publicSectorStaffOther), a signed-in vendor and
// nobody at all.
//
// "At any point in the opportunity's life" is taken at three points: a published Sprint With
// Us opportunity, a published Code With Us one and a cancelled Code With Us one — cancelled
// being final, the furthest point an opportunity reaches. Each note carries a file the test
// stored itself, stating who may read it as every upload must, so the attachment seen
// afterwards can only be the one just added.
//
// The final clause — that no screen offers a way to add a note — is read through
// note_control_offered on opportunity-cwu-edit and opportunity-swu-edit, the History tab of
// the screens where such a control would sit. That tab is shown only to an administrator and
// to the opportunity's author, so both are asked, on a Code With Us and a Sprint With Us
// opportunity, and the history is first confirmed to be there (it holds the seeded note), so
// "no control" cannot be a tab that failed to show at all.

const STATEMENT =
  "The service accepts a private note, with files, on a Code With Us or Sprint With Us opportunity's history from an administrator or the opportunity's author at any point in the opportunity's life, visible only to the author and administrators, but no screen of the application offers a way to add one.";

const noted = seed.opportunities.cwuWithPrivateNote;
const seededNote = noted.private_note;
const seededFile = seed.stored_files.opportunityNoteAttachment;

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return ((await read()) ?? "").trim();
  } catch {
    return "";
  }
}

function isYes(value: string): boolean {
  return !["", "false", "no", "0"].includes(value.trim().toLowerCase());
}

async function readHistory(surface: Surface, program: string, opportunityId: string) {
  const history = surface.opportunityHistoryRequest;
  await history.open({ program, opportunityId });
  return {
    shown: isYes(await readOrEmpty(() => history.historyShown())),
    entries: await readOrEmpty(() => history.historyEntries()),
  };
}

async function expectSeededNoteShown(surface: Surface) {
  const { shown, entries } = await readHistory(surface, noted.program, noted.id);
  expect(shown, "the history should be shown to this reader").toBe(true);
  expect(entries).toContain(seededNote.event);
  expect(entries).toContain(seededNote.text);
  expect(entries, "the note's file should be listed with it").toContain(seededFile.name);
  expect(entries).toContain(seededFile.id);
}

async function expectSeededNoteWithheld(surface: Surface) {
  const { entries } = await readHistory(surface, noted.program, noted.id);
  expect(entries).not.toContain(seededNote.text);
  expect(entries).not.toContain(seededFile.name);
  expect(entries).not.toContain(seededFile.id);
}

type Adding = {
  name: string;
  who: Persona;
  opportunity: { id: string; program: string; seeded_status: string };
};

const addings: Adding[] = [
  {
    name: "its author adds a note with a file to a published Sprint With Us opportunity",
    who: persona.publicSectorStaff,
    opportunity: seed.opportunities.swuOpenWithSubmittedProposal,
  },
  {
    name: "its author adds a note with a file to a published Code With Us opportunity",
    who: persona.publicSectorStaff,
    opportunity: seed.opportunities.cwuWithPrivateNote,
  },
  {
    name: "an administrator adds a note with a file to a cancelled Code With Us opportunity",
    who: persona.administrator,
    opportunity: seed.opportunities.cwuCancelled,
  },
];

test.describe(STATEMENT, () => {
  for (const c of addings) {
    test(`${STATEMENT} — when ${c.name}, the note and its file appear in the opportunity's history`, async ({ surface }) => {
      await surface.signIn(c.who);

      const fileName = `R-1.33 note attachment ${Date.now()}.txt`;
      await surface.fileUpload.open();
      // Stored the way the files criteria say an upload succeeds: the file, its name and a
      // statement of who may read it, in one submission. An opportunity's attachment states no
      // read access of its own (R-8.19), so the opportunity decides who may read it.
      await surface.fileUpload.uploadFileStatingItsReadAccess({
        name: fileName,
        content: `R-1.33 attachment for ${c.name}`,
        readAccess: [],
      });
      const fileId = await readOrEmpty(() => surface.fileUpload.storedFileIdentifier());
      expect(fileId, "the file to attach should have been stored").toBeTruthy();

      // Up to 1,000 characters is what the criterion allows; this note is exactly that long.
      const marker = `R-1.33 ${c.opportunity.seeded_status} ${Date.now()} `;
      const text = marker + "n".repeat(1000 - marker.length);

      const history = surface.opportunityHistoryRequest;
      await history.open({ program: c.opportunity.program, opportunityId: c.opportunity.id });
      await history.addNoteByRequest({ text, attachments: [fileId] });
      expect(
        isYes(await readOrEmpty(() => history.requestAccepted())),
        `the note should be accepted (refusal: ${await readOrEmpty(() => history.refusalMessages())})`,
      ).toBe(true);

      const after = await readHistory(surface, c.opportunity.program, c.opportunity.id);
      expect(after.shown, "the history should be shown to the person who added the note").toBe(true);
      expect(after.entries).toContain("NOTE_ADDED");
      expect(after.entries).toContain(text);
      expect(after.entries, "the note's file should be listed with it").toContain(fileName);
      expect(after.entries).toContain(fileId);
    });
  }

  test(`${STATEMENT} — an administrator sees a private note and its file in the opportunity's history`, async ({ surface }) => {
    await surface.signIn(persona.administrator);
    await expectSeededNoteShown(surface);
  });

  test(`${STATEMENT} — the opportunity's author sees a private note and its file in the opportunity's history`, async ({ surface }) => {
    await surface.signIn(persona.publicSectorStaff);
    await expectSeededNoteShown(surface);
  });

  test(`${STATEMENT} — a public sector staff member who is not the opportunity's author is not shown a private note or its file`, async ({ surface }) => {
    await surface.signIn(persona.publicSectorStaffOther);
    await expectSeededNoteWithheld(surface);
  });

  test(`${STATEMENT} — a signed-in vendor is not shown a private note or its file`, async ({ surface }) => {
    await surface.signIn(persona.vendor);
    await expectSeededNoteWithheld(surface);
  });

  test(`${STATEMENT} — a reader who is not signed in is not shown a private note or its file`, async ({ surface }) => {
    await expectSeededNoteWithheld(surface);
  });

  const readers: { name: string; who: Persona }[] = [
    { name: "an administrator", who: persona.administrator },
    { name: "the opportunity's author", who: persona.publicSectorStaff },
  ];

  for (const r of readers) {
    test(`${STATEMENT} — no screen offers ${r.name} a way to add a note on a Code With Us opportunity's History tab`, async ({ surface }) => {
      await surface.signIn(r.who);
      await expectSeededNoteShown(surface);

      const edit = surface.opportunityCwuEdit;
      await edit.open({ opportunityId: noted.id });
      const offered = await edit.noteControlOffered();
      expect((offered ?? "").trim().toLowerCase(), "the History tab should report that no note control is offered").toBe("false");
    });

    test(`${STATEMENT} — no screen offers ${r.name} a way to add a note on a Sprint With Us opportunity's History tab`, async ({ surface }) => {
      await surface.signIn(r.who);
      const swu = seed.opportunities.swuOpenWithSubmittedProposal;
      const { shown } = await readHistory(surface, swu.program, swu.id);
      expect(shown, "the history should be shown to this reader").toBe(true);

      const edit = surface.opportunitySwuEdit;
      await edit.open({ opportunityId: swu.id });
      const offered = await edit.noteControlOffered();
      expect((offered ?? "").trim().toLowerCase(), "the History tab should report that no note control is offered").toBe("false");
    });
  }
});
