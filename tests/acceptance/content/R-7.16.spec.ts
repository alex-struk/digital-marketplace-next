// criterion: @R-7.16 v1
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// Read from the service's answers to the requests themselves (content-request), not from a
// screen's prose, since the criterion is about the form the answer takes. The requester is a
// vendor, who is signed in and so is refused for lack of permission rather than for want of
// a session. Every request is aimed at the seed's ordinary page, so each one is about a page
// that exists and is refused only for who asked.
//
// What makes a refusal a permission refusal is read by contrast, not by a status the test
// names: R-7.16 replaces R-7.11, whose defect was a permission refusal answered as though
// the submission were faulty. So each test first has an administrator, who may create pages,
// submit one at an address R-7.21 refuses as invalid, and takes that answer as the service's
// refusal of a malformed submission. A vendor's refusal must be a refusal, and must not be
// that one.
const record = seed.content.ordinaryPage;
const stamp = Date.now().toString(36);

type Answer = { accepted: string; status: string; shape: string };

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

async function ask(surface: Surface, request: (r: Surface["contentRequest"]) => Promise<void>): Promise<Answer> {
  await surface.contentRequest.open({ slug: record.slug });
  await request(surface.contentRequest);
  return {
    accepted: await readOrEmpty(() => surface.contentRequest.requestAccepted()),
    status: await readOrEmpty(() => surface.contentRequest.refusalStatus()),
    shape: await readOrEmpty(() => surface.contentRequest.refusalShape()),
  };
}

async function malformedSubmission(surface: Surface): Promise<Answer> {
  await surface.signIn(persona.administrator);
  const answer = await ask(surface, (r) =>
    r.createPageByRequest({ title: "A page at a faulty address", slug: "Not_A_Slug", body: "Faulty wording." }),
  );
  await surface.signOut();
  expect(answer.accepted, "malformed submission").toBeFalsy();
  expect(answer.status, "malformed submission").toBeTruthy();
  return answer;
}

test("a request refused for lack of permission is reported as a permission refusal, in the same shape for every page request, whether it reads the list, creates, changes or removes one", async ({
  surface,
}) => {
  const faulty = await malformedSubmission(surface);
  await surface.signIn(persona.vendor);

  const answers: Record<string, Answer> = {
    "read the list": await ask(surface, (r) => r.readPageListByRequest()),
    create: await ask(surface, (r) =>
      r.createPageByRequest({ title: "A page a vendor may not make", slug: `refused-${stamp}`, body: "Refused wording." }),
    ),
    change: await ask(surface, (r) => r.changePageByRequest({ title: record.title, body: "Wording a vendor may not write." })),
    rename: await ask(surface, (r) => r.renamePageByRequest({ slug: `refused-rename-${stamp}` })),
    remove: await ask(surface, (r) => r.removePageByRequest()),
  };

  for (const [request, answer] of Object.entries(answers)) {
    expect(answer.accepted, request).toBeFalsy();
    expect(answer.status, request).toBeTruthy();
    expect(answer.status, request).not.toBe(faulty.status);
    expect(answer.shape, request).toBeTruthy();
  }

  const reference = answers["read the list"];
  for (const [request, answer] of Object.entries(answers)) {
    expect(answer.status, request).toBe(reference.status);
    expect(answer.shape, request).toBe(reference.shape);
  }
});

// Anyone may read a page by its address (R-7.1), so a vendor's request to read one is
// expected to be answered. The criterion binds only the refusal: if the service does refuse
// it, the refusal must take the same form as a refused request for the list.
test("a request refused for lack of permission to read one page is reported as a permission refusal in the same shape as every other page request", async ({
  surface,
}) => {
  const faulty = await malformedSubmission(surface);
  await surface.signIn(persona.vendor);

  const list = await ask(surface, (r) => r.readPageListByRequest());
  const one = await ask(surface, (r) => r.readPageByRequest());

  expect(list.accepted).toBeFalsy();
  expect(list.status).toBeTruthy();
  expect(list.status).not.toBe(faulty.status);
  if (!one.accepted) {
    expect(one.status).toBe(list.status);
    expect(one.shape).toBe(list.shape);
  }
});
