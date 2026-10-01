import { describe, expect, it } from "vitest";
import { attachmentName } from "../src/rules/files";
import {
  CwuInput,
  OPPORTUNITY_STATES,
  PROGRAMS,
  addDays,
  calendarDayFrom,
  cwuProblemFromLine,
  cwuProblems,
  cwuRefusalLine,
  draftCwuContent,
  earliestDeadlineFor,
  isPermittedTransition,
  mayCreateInState,
  mayCreateOpportunity,
  mayDeleteOpportunity,
  mayEditOpportunity,
  mayPublishOpportunity,
  mayReadOpportunity,
  maySeeAuthorship,
  pacificDayOf,
  readCwuInput,
  recordedInstantOf,
} from "../src/rules/opportunities";

const admin = { id: "a", type: "ADMIN" } as const;
const author = { id: "g1", type: "GOV" } as const;
const otherStaff = { id: "g2", type: "GOV" } as const;
const vendor = { id: "v", type: "VENDOR" } as const;

const TODAY = "2026-09-30";

const complete: CwuInput = {
  title: "Build an accessible permit tracker",
  teaser: "A short teaser.",
  remoteOk: true,
  remoteDesc: "Anywhere in Canada.",
  location: "Victoria",
  reward: 45_000,
  skills: ["Accessibility"],
  description: "What the work is.",
  proposalDeadline: "2026-10-02",
  assignmentDate: "2026-10-09",
  startDate: "2026-10-19",
  completionDate: "2027-01-29",
  submissionInfo: "",
  acceptanceCriteria: "",
  evaluationCriteria: "",
  attachments: [],
};

const fieldsOf = (input: CwuInput, today = TODAY) => cwuProblems(input, today).map((problem) => problem.field);

describe("the states and the path an opportunity follows (R-1.19, R-1.20, R-1.49, R-1.51)", () => {
  it("defines no suspended state in any program", () => {
    for (const program of PROGRAMS) expect(OPPORTUNITY_STATES[program]).not.toContain("SUSPENDED");
  });

  it("lets a draft go for review or straight to publication, and under review only to publication", () => {
    for (const program of PROGRAMS) {
      expect(isPermittedTransition(program, "DRAFT", "UNDER_REVIEW")).toBe(true);
      expect(isPermittedTransition(program, "DRAFT", "PUBLISHED")).toBe(true);
      expect(isPermittedTransition(program, "UNDER_REVIEW", "PUBLISHED")).toBe(true);
      expect(isPermittedTransition(program, "UNDER_REVIEW", "DRAFT")).toBe(false);
      expect(isPermittedTransition(program, "UNDER_REVIEW", "CANCELED")).toBe(false);
      expect(isPermittedTransition(program, "DRAFT", "CANCELED")).toBe(false);
    }
  });

  it("refuses a draft going straight to an evaluation stage", () => {
    expect(isPermittedTransition("code-with-us", "DRAFT", "EVALUATION")).toBe(false);
    expect(isPermittedTransition("sprint-with-us", "DRAFT", "EVAL_QUESTIONS_INDIVIDUAL")).toBe(false);
    expect(isPermittedTransition("team-with-us", "DRAFT", "EVAL_C")).toBe(false);
  });

  it("moves each published or evaluation stage only to the next or to cancelled", () => {
    expect(isPermittedTransition("code-with-us", "PUBLISHED", "EVALUATION")).toBe(true);
    expect(isPermittedTransition("code-with-us", "EVALUATION", "PROCESSING")).toBe(true);
    expect(isPermittedTransition("code-with-us", "PUBLISHED", "PROCESSING")).toBe(false);
    expect(isPermittedTransition("sprint-with-us", "EVAL_QUESTIONS_CONSENSUS", "EVAL_CC")).toBe(true);
    expect(isPermittedTransition("sprint-with-us", "EVAL_CC", "EVAL_SCENARIO")).toBe(true);
    expect(isPermittedTransition("sprint-with-us", "EVAL_SCENARIO", "PROCESSING")).toBe(true);
    expect(isPermittedTransition("sprint-with-us", "EVAL_QUESTIONS_INDIVIDUAL", "EVAL_CC")).toBe(false);
    expect(isPermittedTransition("team-with-us", "EVAL_QUESTIONS_CONSENSUS", "EVAL_C")).toBe(true);
    expect(isPermittedTransition("team-with-us", "EVAL_C", "PROCESSING")).toBe(true);
    for (const program of PROGRAMS) {
      expect(isPermittedTransition(program, "PUBLISHED", "CANCELED")).toBe(true);
    }
  });

  it("lets processing be awarded or cancelled in all three programs, Team With Us included", () => {
    for (const program of PROGRAMS) {
      expect(isPermittedTransition(program, "PROCESSING", "AWARDED")).toBe(true);
      expect(isPermittedTransition(program, "PROCESSING", "CANCELED")).toBe(true);
    }
  });

  it("lets nothing out of awarded or cancelled", () => {
    for (const program of PROGRAMS) {
      for (const to of OPPORTUNITY_STATES[program]) {
        expect(isPermittedTransition(program, "AWARDED", to)).toBe(false);
        expect(isPermittedTransition(program, "CANCELED", to)).toBe(false);
      }
    }
  });
});

describe("who may do what with an opportunity", () => {
  const draft = { status: "DRAFT", createdBy: "g1" } as const;
  const underReview = { status: "UNDER_REVIEW", createdBy: "g1" } as const;
  const published = { status: "PUBLISHED", createdBy: "g1" } as const;

  it("lets only staff and administrators create, and only an administrator create one published (R-1.7, R-1.48)", () => {
    expect(mayCreateOpportunity(null)).toBe(false);
    expect(mayCreateOpportunity(vendor)).toBe(false);
    expect(mayCreateOpportunity(author)).toBe(true);
    expect(mayCreateInState(author, "DRAFT")).toBe(true);
    expect(mayCreateInState(author, "UNDER_REVIEW")).toBe(true);
    expect(mayCreateInState(author, "PUBLISHED")).toBe(false);
    expect(mayCreateInState(admin, "PUBLISHED")).toBe(true);
    expect(mayCreateInState(vendor, "DRAFT")).toBe(false);
  });

  it("shows an unpublished opportunity only to its author and administrators (R-1.2, R-1.3)", () => {
    expect(mayReadOpportunity(null, draft)).toBe(false);
    expect(mayReadOpportunity(vendor, underReview)).toBe(false);
    expect(mayReadOpportunity(otherStaff, draft)).toBe(false);
    expect(mayReadOpportunity(author, draft)).toBe(true);
    expect(mayReadOpportunity(admin, underReview)).toBe(true);
    expect(mayReadOpportunity(null, published)).toBe(true);
  });

  it("lets only an administrator publish (R-1.22)", () => {
    expect(mayPublishOpportunity(author)).toBe(false);
    expect(mayPublishOpportunity(admin)).toBe(true);
  });

  it("lets only an administrator change a published opportunity (R-1.56)", () => {
    expect(mayEditOpportunity(author, draft)).toBe(true);
    expect(mayEditOpportunity(author, published)).toBe(false);
    expect(mayEditOpportunity(admin, published)).toBe(true);
    expect(mayEditOpportunity(otherStaff, draft)).toBe(false);
    expect(mayEditOpportunity(admin, { status: "AWARDED", createdBy: "g1" })).toBe(false);
  });

  it("deletes a draft for its author, a draft or one under review for an administrator, and nothing published (R-1.53)", () => {
    expect(mayDeleteOpportunity(author, draft)).toBe(true);
    expect(mayDeleteOpportunity(author, underReview)).toBe(false);
    expect(mayDeleteOpportunity(admin, draft)).toBe(true);
    expect(mayDeleteOpportunity(admin, underReview)).toBe(true);
    expect(mayDeleteOpportunity(admin, published)).toBe(false);
    expect(mayDeleteOpportunity(otherStaff, draft)).toBe(false);
    expect(mayDeleteOpportunity(vendor, draft)).toBe(false);
  });

  it("names who created and changed it only to an administrator and those people (R-1.29)", () => {
    const people = { createdBy: "g1", updatedBy: "a2" };
    expect(maySeeAuthorship(null, people)).toBe(false);
    expect(maySeeAuthorship(vendor, people)).toBe(false);
    expect(maySeeAuthorship(otherStaff, people)).toBe(false);
    expect(maySeeAuthorship(author, people)).toBe(true);
    expect(maySeeAuthorship({ id: "a2", type: "GOV" }, people)).toBe(true);
    expect(maySeeAuthorship(admin, people)).toBe(true);
  });
});

describe("dates (R-1.14)", () => {
  // Read on the Pacific clock rather than as fixed UTC instants: whether British Columbia keeps
  // changing its clocks is the time zone database's to say, not this rule's.
  const pacificClock = (instant: Date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Vancouver",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(instant);

  it("records a day as 4:00 p.m. Pacific time, in summer and in winter and on the days clocks may change", () => {
    expect(recordedInstantOf("2026-07-01").toISOString()).toBe("2026-07-01T23:00:00.000Z");
    for (const day of ["2026-07-01", "2026-12-01", "2026-03-08", "2026-11-01", "2027-03-14", "2030-01-15"]) {
      expect(pacificClock(recordedInstantOf(day))).toBe(`${day}, 16:00`);
    }
  });

  it("reads a recorded instant back as its Pacific day", () => {
    for (const day of ["2026-07-01", "2026-12-31", "2030-06-01"]) expect(pacificDayOf(recordedInstantOf(day))).toBe(day);
    expect(calendarDayFrom("2030-06-01T23:59:00Z")).toBe("2030-06-01");
    expect(calendarDayFrom("2030-02-30")).toBe(null);
    expect(calendarDayFrom("")).toBe(null);
  });

  it("adds days across a month's end", () => {
    expect(addDays("2026-09-30", 14)).toBe("2026-10-14");
  });
});

describe("a Code With Us opportunity that is not a draft (R-1.10 to R-1.14)", () => {
  it("accepts complete content", () => {
    expect(cwuProblems(complete, TODAY)).toEqual([]);
  });

  it("names a missing or overlong title, an overlong teaser, a missing location and a missing or overlong description", () => {
    expect(fieldsOf({ ...complete, title: "" })).toEqual(["title"]);
    expect(fieldsOf({ ...complete, title: "x".repeat(201) })).toEqual(["title"]);
    expect(fieldsOf({ ...complete, title: "x".repeat(200) })).toEqual([]);
    expect(fieldsOf({ ...complete, teaser: "x".repeat(501) })).toEqual(["teaser"]);
    expect(fieldsOf({ ...complete, location: " " })).toEqual(["location"]);
    expect(fieldsOf({ ...complete, description: "" })).toEqual(["description"]);
    expect(fieldsOf({ ...complete, description: "x".repeat(10_001) })).toEqual(["description"]);
  });

  it("requires an answer about remote work, and a description of it when it is acceptable (R-1.11)", () => {
    expect(fieldsOf({ ...complete, remoteOk: null })).toEqual(["remoteOk"]);
    expect(fieldsOf({ ...complete, remoteDesc: "" })).toEqual(["remoteDesc"]);
    expect(fieldsOf({ ...complete, remoteOk: false, remoteDesc: "" })).toEqual([]);
    expect(fieldsOf({ ...complete, remoteOk: false, remoteDesc: "x".repeat(501) })).toEqual(["remoteDesc"]);
  });

  it("requires a reward of $1 to $70,000 and at least one skill (R-1.12)", () => {
    expect(fieldsOf({ ...complete, reward: 0 })).toEqual(["reward"]);
    expect(fieldsOf({ ...complete, reward: 70_001 })).toEqual(["reward"]);
    expect(fieldsOf({ ...complete, reward: null })).toEqual(["reward"]);
    expect(fieldsOf({ ...complete, reward: 1 })).toEqual([]);
    expect(fieldsOf({ ...complete, reward: 70_000 })).toEqual([]);
    expect(fieldsOf({ ...complete, skills: [] })).toEqual(["skills"]);
  });

  it("collapses duplicate skills rather than refusing them (R-1.12 note)", () => {
    expect(readCwuInput({ skills: ["React", "React", " React "] }).skills).toEqual(["React"]);
  });

  it("requires the dates in order from today (R-1.14)", () => {
    expect(fieldsOf({ ...complete, proposalDeadline: "2026-09-29" })).toEqual(["proposalDeadline"]);
    expect(fieldsOf({ ...complete, proposalDeadline: TODAY, assignmentDate: TODAY, startDate: TODAY, completionDate: TODAY })).toEqual([]);
    expect(fieldsOf({ ...complete, assignmentDate: "2026-10-01" })).toEqual(["assignmentDate"]);
    expect(fieldsOf({ ...complete, startDate: "2026-10-08" })).toEqual(["startDate"]);
    expect(fieldsOf({ ...complete, completionDate: "2026-10-18" })).toEqual(["completionDate"]);
    expect(fieldsOf({ ...complete, completionDate: null })).toEqual([]);
  });

  it("measures a published opportunity whose deadline has passed against that deadline (R-1.14 note)", () => {
    const lapsed = { status: "PUBLISHED", proposalDeadline: "2026-09-01" } as const;
    expect(earliestDeadlineFor(lapsed, TODAY)).toBe("2026-09-01");
    expect(earliestDeadlineFor({ status: "DRAFT", proposalDeadline: "2026-09-01" }, TODAY)).toBe(TODAY);
    expect(earliestDeadlineFor(null, TODAY)).toBe(TODAY);
  });

  it("names the field in each refusal line, and reads it back", () => {
    const [problem] = cwuProblems({ ...complete, title: "" }, TODAY);
    const line = cwuRefusalLine(problem!);
    expect(line.startsWith("title: ")).toBe(true);
    expect(cwuProblemFromLine(line)).toEqual(problem);
  });
});

describe("a draft (R-1.9)", () => {
  const blank = readCwuInput({ title: "Only a title" });

  it("is stored with whatever it holds, with missing dates fourteen days on and no completion date", () => {
    const content = draftCwuContent(blank, TODAY);
    expect(content.title).toBe("Only a title");
    expect(content.reward).toBe(0);
    expect(content.proposalDeadline).toBe("2026-10-14");
    expect(content.assignmentDate).toBe("2026-10-14");
    expect(content.startDate).toBe("2026-10-14");
    expect(content.completionDate).toBe(null);
  });

  it("sets a date earlier than the one it must follow to fourteen days on, and keeps valid ones", () => {
    const content = draftCwuContent(
      { ...blank, proposalDeadline: "2000-01-01", assignmentDate: "2026-11-01", startDate: "2026-11-02", completionDate: "2000-01-01" },
      TODAY,
    );
    expect(content.proposalDeadline).toBe("2026-10-14");
    expect(content.assignmentDate).toBe("2026-11-01");
    expect(content.startDate).toBe("2026-11-02");
    expect(content.completionDate).toBe(null);
  });
});

describe("an attachment's name (R-8.27)", () => {
  it("puts the original ending back when it is left off", () => {
    expect(attachmentName("scan0001.pdf", "Statement of work")).toBe("Statement of work.pdf");
    expect(attachmentName("scan0001.pdf", "Statement of work.PDF")).toBe("Statement of work.PDF");
  });

  it("keeps the original name when nothing is typed, and a name with no ending as typed", () => {
    expect(attachmentName("scan0001.pdf", "  ")).toBe("scan0001.pdf");
    expect(attachmentName("README", "Read me")).toBe("Read me");
  });
});
