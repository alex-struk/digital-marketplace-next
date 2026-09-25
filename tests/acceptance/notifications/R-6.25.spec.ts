// criterion: @R-6.25 v2
// provenance: blind, spec@05e88fb7765c5d6327f910e43f990e6c321b63fa, derived 2026-09-25
import { test, expect, persona, seed } from "../../fixtures";
import type { Surface } from "../../fixtures";

// The given — three vendors who submitted proposals to one opportunity — is the seed's Code With
// Us opportunity kept for this criterion (opportunities.cwuLapsedForAwardNotices): past its
// deadline, with three submitted proposals from three vendors and three organizations. The
// scheduled transition trigger closes it; the administrator scores all three, then awards the
// first (proposals.cwuNoticesOne, from users.organizationOwner, whose organization is
// organizations.qualified). The catcher is emptied just before the award, so what is found
// afterwards is the decision.
//
// The two not chosen are users.proponentTwo and users.proponentThree. For each, every message
// that reached them — visibly, or as a blind copy of a message addressed to the service's own
// address — is read whole through caught-message, and the one naming the opportunity is the
// decision. It must name the opportunity's title and the winning organization's legal name, both
// ahead of its offer to sign in (which is what "leads with" is read as), and it must offer, as a
// link, a way to sign in, and speak of the reader's score.
//
// The winning name is the seed's legal name for the organization, and the opportunity's own view
// is checked to record the same successful proponent. The em dash, shown where no successful
// proponent is recorded, needs an award with no proponent recorded, which no action makes; it is
// not exercised here.

// email.configured_sender_address in spec/contract/observables.yaml.
const serviceAddress = "donotreply@example.test";

const settle = { timeout: 30000 };
const opportunity = seed.opportunities.cwuLapsedForAwardNotices;
const opportunityId = opportunity.id;
const winner = seed.proposals.cwuNoticesOne.id;
const scored = [
  { proposalId: seed.proposals.cwuNoticesOne.id, score: 90 },
  { proposalId: seed.proposals.cwuNoticesTwo.id, score: 80 },
  { proposalId: seed.proposals.cwuNoticesThree.id, score: 70 },
];
const winningName = seed.organizations.qualified.legal_name;
const notChosen = [seed.users.proponentTwo, seed.users.proponentThree];

type Mail = {
  clear(): Promise<void>;
  messagesTo(address: string): Promise<Array<{ ID: string }>>;
};

async function readOrEmpty(read: () => Promise<string>): Promise<string> {
  try {
    return (await read()) ?? "";
  } catch {
    return "";
  }
}

function decode(text: string): string {
  return text
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&#x27;|&apos;/gi, "'")
    .replace(/&#8212;|&mdash;/gi, "—")
    .replace(/&amp;/gi, "&");
}

function shownText(html: string): string {
  return decode(html.replace(/<(head|style|script|title)\b[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function links(html: string): Array<{ label: string; href: string }> {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((match) => ({
    label: shownText(match[2]),
    href: decode(/\bhref\s*=\s*["']([^"']*)["']/i.exec(match[1])?.[1] ?? ""),
  }));
}

function addressesIn(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z0-9._%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/g) ?? [])];
}

type Decision = { html: string; plain: string };

// The message that reached this address and names the opportunity, or null if none has yet.
async function decisionFor(surface: Surface, mail: Mail, address: string): Promise<Decision | null> {
  const ids = new Set<string>();
  for (const { ID } of await mail.messagesTo(address)) ids.add(ID);
  for (const { ID } of await mail.messagesTo(serviceAddress)) ids.add(ID);
  for (const messageId of ids) {
    await surface.caughtMessage.open({ messageId });
    const recipients = [
      ...addressesIn(await readOrEmpty(() => surface.caughtMessage.visibleRecipients())),
      ...addressesIn(await readOrEmpty(() => surface.caughtMessage.copiedRecipients())),
    ];
    if (!recipients.includes(address.toLowerCase())) continue;
    const html = await readOrEmpty(() => surface.caughtMessage.htmlBody());
    const plain = await readOrEmpty(() => surface.caughtMessage.plainTextBody());
    if (`${shownText(html)} ${plain}`.includes(opportunity.title)) return { html, plain };
  }
  return null;
}

async function status(surface: Surface): Promise<string> {
  await surface.opportunityCwuView.open({ opportunityId });
  return (await readOrEmpty(() => surface.opportunityCwuView.status())).toLowerCase();
}

test("The message telling a vendor that an opportunity they proposed on has been awarded to somebody else leads with the opportunity's title and the name of the winning proponent — the winning organization for Sprint With Us and Team With Us, and for Code With Us the legal name of the winning organization or individual, or an em dash where no successful proponent is recorded — and offers the reader a way to sign in and see their own score.", async ({
  surface,
  mail,
}) => {
  test.slow();
  await surface.signIn(persona.administrator);
  await expect
    .poll(async () => {
      await surface.scheduledTransitionTrigger.open();
      await surface.scheduledTransitionTrigger.runPendingTransitions();
      return status(surface);
    }, settle)
    .toMatch(/evaluat/);

  for (const { proposalId, score } of scored) {
    await surface.proposalCwuView.open({ opportunityId, proposalId });
    await surface.proposalCwuView.enterScore({ score });
  }

  await mail.clear();
  await surface.proposalCwuView.open({ opportunityId, proposalId: winner });
  await surface.proposalCwuView.awardProposal();
  await expect.poll(() => status(surface), settle).toMatch(/awarded/);
  expect(await readOrEmpty(() => surface.opportunityCwuView.successfulProponent())).toContain(winningName);

  for (const vendor of notChosen) {
    await expect
      .poll(async () => (await decisionFor(surface, mail, vendor.email)) !== null, {
        ...settle,
        message: `the decision reached ${vendor.email}`,
      })
      .toBe(true);
    const decision = (await decisionFor(surface, mail, vendor.email))!;

    const signIn = links(decision.html).find((link) => /sign[ -]?in|log[ -]?in/i.test(link.label));
    expect.soft(signIn, `a link offering ${vendor.email} a way to sign in`).toBeTruthy();

    for (const [form, text] of [
      ["formatted", shownText(decision.html)],
      ["plain-text", decision.plain.replace(/\s+/g, " ")],
    ] as const) {
      const title = text.indexOf(opportunity.title);
      const name = text.indexOf(winningName);
      const offer = text.search(/sign[ -]?in|log[ -]?in/i);
      expect.soft(title, `${form} form to ${vendor.email} names the opportunity`).toBeGreaterThanOrEqual(0);
      expect.soft(name, `${form} form to ${vendor.email} names the winning proponent`).toBeGreaterThanOrEqual(0);
      expect.soft(offer, `${form} form to ${vendor.email} offers a way to sign in`).toBeGreaterThanOrEqual(0);
      expect.soft(title < offer && name < offer, `${form} form to ${vendor.email} leads with the title and the winner`).toBe(true);
      expect.soft(text, `${form} form to ${vendor.email} speaks of the reader's score`).toMatch(/score/i);
    }
  }
});
