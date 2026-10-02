import { PROGRAM_NAMES, Program } from "../../rules/opportunities";
import { Block, Envelope, Message } from "../message";

/**
 * The messages about an opportunity once it is under way, in any of the three programs: the
 * notice that it has changed or had an addendum added, to its watchers, proponents and author
 * (R-1.35), and the notice that it has been cancelled, to its watchers and proponents, with the
 * author told separately that the cancellation was actioned (R-1.36). None of them is governed by
 * the new-opportunity notice choice, so none offers to unsubscribe (R-6.16). The messages to many
 * are batched as blind copies by whoever sends them (R-6.8, R-6.15).
 */

/** What the messages say about an opportunity. */
export interface RunningOpportunity {
  readonly program: Program;
  readonly id: string;
  readonly title: string;
}

/** What changed, for the notice that an opportunity has been updated. */
export type Update = { readonly kind: "addendum"; readonly addendum: string } | { readonly kind: "edited" };

const viewAddress = (origin: string, opportunity: RunningOpportunity) =>
  `${origin}/opportunities/${opportunity.program}/${opportunity.id}`;
const manageAddress = (origin: string, opportunity: RunningOpportunity) => `${viewAddress(origin, opportunity)}/edit`;

/** To its watchers, proponents and author, batched as blind copies: the opportunity has been updated (R-1.35). */
export function opportunityUpdated(opportunity: RunningOpportunity, update: Update, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  const body: Block[] =
    update.kind === "addendum"
      ? [
          { kind: "paragraph", content: [`An addendum has been added to the ${program} opportunity "${opportunity.title}":`] },
          { kind: "paragraph", content: [update.addendum] },
        ]
      : [{ kind: "paragraph", content: [`The ${program} opportunity "${opportunity.title}" has been changed.`] }];
  return {
    kind: `${opportunity.program}-opportunity-updated`,
    subject: `A ${program} Opportunity Has Been Updated`,
    title: `A ${program} opportunity has been updated`,
    body: [...body, { kind: "action", label: "View the opportunity", href: viewAddress(origin, opportunity) }],
  };
}

/** To its watchers and proponents, batched as blind copies: the opportunity has been cancelled (R-1.36). */
export function opportunityCancelled(opportunity: RunningOpportunity, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    kind: `${opportunity.program}-opportunity-cancelled`,
    subject: `A ${program} Opportunity Has Been Cancelled`,
    title: `A ${program} opportunity has been cancelled`,
    body: [
      {
        kind: "paragraph",
        content: [`The ${program} opportunity "${opportunity.title}" has been cancelled. It no longer accepts proposals.`],
      },
      { kind: "action", label: "View the opportunity", href: viewAddress(origin, opportunity) },
    ],
  };
}

/** To the author, on their own: the cancellation of their opportunity has been actioned (R-1.36). */
export function cancelledToAuthor(
  author: { readonly email: string | null },
  opportunity: RunningOpportunity,
  origin: string,
): Envelope {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    to: [author.email],
    message: {
      kind: `${opportunity.program}-opportunity-cancelled-author`,
      subject: `Your ${program} Opportunity Has Been Cancelled`,
      title: `Your ${program} opportunity has been cancelled`,
      body: [
        {
          kind: "paragraph",
          content: [
            `The cancellation of "${opportunity.title}" has been actioned. Everyone watching it and everyone who submitted a proposal to it has been told.`,
          ],
        },
        { kind: "action", label: "Manage the opportunity", href: manageAddress(origin, opportunity) },
      ],
    },
  };
}
