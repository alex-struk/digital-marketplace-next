import { PROGRAM_NAMES, Program } from "../../rules/opportunities";
import type { OtherProgram } from "../../rules/other-program-drafts";
import { Envelope, Message } from "../message";
import { deactivatedByAdministrator, reactivatedByAdministrator } from "./administrator";
import { readyForEvaluationToAuthor, readyForEvaluationToEvaluators } from "./closing";
import {
  newOpportunityPublished,
  publishedToAuthor,
  submittedForReview,
  submittedForReviewToAuthor,
} from "./code-with-us-opportunity";
import { consensusFinalized, consensusSubmitted, readyForConsensus } from "./evaluation";
import { organizationArchivedByAdministrator } from "./organization";
import {
  addedToEvaluationPanel,
  otherOpportunityPublished,
  otherPublishedToAuthor,
  otherSubmittedForReview,
  otherSubmittedForReviewToAuthor,
} from "./other-program-opportunity";
import { deactivatedOwnAccount, reactivatedOwnAccount } from "./own-account";
import {
  proposalAwarded,
  proposalNotAwarded,
  proposalSubmitted,
  proposalWithdrawnToAdministrators,
  proposalWithdrawnToVendor,
} from "./proposal";
import { cancelledToAuthor, opportunityCancelled, opportunityUpdated } from "./running-opportunity";
import {
  invitationAcceptedToMember,
  invitationAcceptedToOwner,
  invitationDeclinedToOwner,
  invitedToRegister,
  invitedToTeam,
} from "./team";
import { termsUpdated } from "./terms-updated";
import { welcome } from "./welcome";

/**
 * The administrator's notification reference (R-6.13, R-6.19): every message the service can
 * send, grouped under the event that sends it, each built by the very function that builds it
 * for sending, from invented sample data — so what is previewed is what is sent, and no real
 * person's record is read to show it.
 *
 * A message added to the service is added here too; `tests/notification-reference.test.ts`
 * fails while any builder in this directory is missing from the reference (R-6.19).
 */

export interface ReferenceMessage {
  /** Unique on the page; the anchor of the message's heading. */
  readonly id: string;
  /** Who it goes to, as the message's heading on the page. */
  readonly recipient: string;
  /** One line on who receives it and why, where one is written (R-6.13). */
  readonly summary?: string;
  readonly message: Message;
  /** The builder the message came from, so the reference can be checked for completeness. */
  readonly sentBy: (...args: never[]) => Message | Envelope;
}

export interface ReferenceGroup {
  readonly id: string;
  /** The event that sends the messages in the group. */
  readonly event: string;
  readonly messages: readonly ReferenceMessage[];
}

interface Look {
  readonly serviceOrigin: string;
  readonly contactEmail: string;
}

// ------------------------------------------------------------------------ the sample data

/** Everything in a sample is invented; nothing here names a real person, address or record. */
const SAMPLE = {
  person: { name: "Sam Sample", email: "sam.sample@example.com" },
  organization: { id: "00000000-0000-4000-8000-00000000a001", legalName: "Sample Organization Ltd." },
  affiliationId: "00000000-0000-4000-8000-00000000a002",
  proposalId: "00000000-0000-4000-8000-00000000a003",
  proponent: "Sample Organization Ltd.",
  addendum: "Sample addendum: the information session will be held by video call.",
  deadline: "2030-06-28",
} as const;

const SAMPLE_OPPORTUNITY: Readonly<Record<Program, { id: string; title: string; budget: number }>> = {
  "code-with-us": { id: "00000000-0000-4000-8000-00000000c001", title: "Sample Code With Us opportunity", budget: 70000 },
  "sprint-with-us": { id: "00000000-0000-4000-8000-00000000c002", title: "Sample Sprint With Us opportunity", budget: 2000000 },
  "team-with-us": { id: "00000000-0000-4000-8000-00000000c003", title: "Sample Team With Us opportunity", budget: 500000 },
};

const PROGRAMS: readonly Program[] = ["code-with-us", "sprint-with-us", "team-with-us"];
const SHORT: Readonly<Record<Program, string>> = { "code-with-us": "cwu", "sprint-with-us": "swu", "team-with-us": "twu" };

const running = (program: Program) => ({ program, id: SAMPLE_OPPORTUNITY[program].id, title: SAMPLE_OPPORTUNITY[program].title });
const otherBrief = (program: OtherProgram) => ({
  program,
  id: SAMPLE_OPPORTUNITY[program].id,
  title: SAMPLE_OPPORTUNITY[program].title,
  budget: SAMPLE_OPPORTUNITY[program].budget,
  proposalDeadline: SAMPLE.deadline,
});
const cwuBrief = {
  id: SAMPLE_OPPORTUNITY["code-with-us"].id,
  title: SAMPLE_OPPORTUNITY["code-with-us"].title,
  reward: SAMPLE_OPPORTUNITY["code-with-us"].budget,
  proposalDeadline: SAMPLE.deadline,
};
const proposalSubject = (program: Program) => ({
  program,
  opportunityId: SAMPLE_OPPORTUNITY[program].id,
  opportunityTitle: SAMPLE_OPPORTUNITY[program].title,
  proposalId: SAMPLE.proposalId,
});

const BATCHED = "in batches of up to fifty, each recipient hidden from the others";
const AS_BLIND_COPIES = "as blind copies, so no recipient sees who else was told";

// ------------------------------------------------------------------------ the events

function opportunityGroups(origin: string): ReferenceGroup[] {
  return PROGRAMS.flatMap((program): ReferenceGroup[] => {
    const name = PROGRAM_NAMES[program];
    const short = SHORT[program];
    const isCwu = program === "code-with-us";
    const other = program as OtherProgram;
    return [
      {
        id: `${short}-published`,
        event: `A ${name} opportunity is published`,
        messages: [
          {
            id: `${short}-published-subscribers`,
            recipient: "To everyone who asked to be emailed about new opportunities",
            summary: `Sent ${BATCHED}, to every active account that asked for new-opportunity emails; the only message that offers to unsubscribe.`,
            message: isCwu ? newOpportunityPublished(cwuBrief, origin) : otherOpportunityPublished(otherBrief(other), origin),
            sentBy: isCwu ? newOpportunityPublished : otherOpportunityPublished,
          },
          {
            id: `${short}-published-author`,
            recipient: "To the opportunity's author",
            summary: "Sent to the person who created the opportunity, confirming that it is now published.",
            message: (isCwu
              ? publishedToAuthor(SAMPLE.person, cwuBrief, origin)
              : otherPublishedToAuthor(SAMPLE.person, otherBrief(other), origin)
            ).message,
            sentBy: isCwu ? publishedToAuthor : otherPublishedToAuthor,
          },
        ],
      },
      {
        id: `${short}-submitted-for-review`,
        event: `A ${name} opportunity is submitted for review`,
        messages: [
          {
            id: `${short}-review-administrators`,
            recipient: "To administrators",
            summary: `Sent to every administrator ${AS_BLIND_COPIES}, when a public sector employee submits an opportunity for review.`,
            message: isCwu ? submittedForReview(cwuBrief, origin) : otherSubmittedForReview(otherBrief(other), origin),
            sentBy: isCwu ? submittedForReview : otherSubmittedForReview,
          },
          {
            id: `${short}-review-author`,
            recipient: "To the opportunity's author",
            summary: "Sent to the person who submitted the opportunity, confirming that it is waiting for review.",
            message: (isCwu
              ? submittedForReviewToAuthor(SAMPLE.person, cwuBrief, origin)
              : otherSubmittedForReviewToAuthor(SAMPLE.person, otherBrief(other), origin)
            ).message,
            sentBy: isCwu ? submittedForReviewToAuthor : otherSubmittedForReviewToAuthor,
          },
        ],
      },
      ...(isCwu
        ? []
        : [
            {
              id: `${short}-panel-named`,
              event: `A ${name} evaluation panel is named or changed`,
              messages: [
                {
                  id: `${short}-panel-members`,
                  recipient: "To the people newly added to the evaluation panel",
                  summary: `Sent ${AS_BLIND_COPIES}, to each person newly put on the panel once the opportunity has left draft; those already on it are not told again.`,
                  message: addedToEvaluationPanel(otherBrief(other), origin),
                  sentBy: addedToEvaluationPanel,
                },
              ],
            },
          ]),
      {
        id: `${short}-addendum`,
        event: `An addendum is added to a ${name} opportunity`,
        messages: [
          {
            id: `${short}-addendum-everyone`,
            recipient: "To the opportunity's watchers, proponents and author",
            summary: `Sent ${BATCHED}, to everyone watching the opportunity, everyone with a proposal to it and its author, each told once.`,
            message: opportunityUpdated(running(program), { kind: "addendum", addendum: SAMPLE.addendum }, origin),
            sentBy: opportunityUpdated,
          },
        ],
      },
      {
        id: `${short}-changed`,
        event: `A published ${name} opportunity is changed`,
        messages: [
          {
            id: `${short}-changed-everyone`,
            recipient: "To the opportunity's watchers, proponents and author",
            summary: `Sent ${BATCHED}, to everyone watching the opportunity, everyone with a proposal to it and its author, each told once.`,
            message: opportunityUpdated(running(program), { kind: "edited" }, origin),
            sentBy: opportunityUpdated,
          },
        ],
      },
      {
        id: `${short}-cancelled`,
        event: `A ${name} opportunity is cancelled`,
        messages: [
          {
            id: `${short}-cancelled-everyone`,
            recipient: "To the opportunity's watchers and proponents",
            summary: `Sent ${BATCHED}, to everyone watching the opportunity and everyone with a proposal to it.`,
            message: opportunityCancelled(running(program), origin),
            sentBy: opportunityCancelled,
          },
          {
            id: `${short}-cancelled-author`,
            recipient: "To the opportunity's author",
            summary: "Sent to the person who created the opportunity, confirming that the cancellation was actioned.",
            message: cancelledToAuthor(SAMPLE.person, running(program), origin).message,
            sentBy: cancelledToAuthor,
          },
        ],
      },
      {
        id: `${short}-closed`,
        event: `A ${name} opportunity reaches its proposal deadline`,
        messages: [
          isCwu
            ? {
                id: `${short}-closed-author`,
                recipient: "To the opportunity's author",
                summary: "Sent to the person who created the opportunity when it closes, so they can score its proposals.",
                message: readyForEvaluationToAuthor(running(program), origin),
                sentBy: readyForEvaluationToAuthor,
              }
            : {
                id: `${short}-closed-evaluators`,
                recipient: "To the evaluators on the evaluation panel",
                summary: `Sent to every evaluator on the panel ${AS_BLIND_COPIES}, when the opportunity closes; a chair who does not evaluate is not told.`,
                message: readyForEvaluationToEvaluators(running(program), origin),
                sentBy: readyForEvaluationToEvaluators,
              },
        ],
      },
      ...(isCwu ? [] : consensusGroups(other, origin)),
      ...proposalGroups(program, origin),
    ];
  });
}

function consensusGroups(program: OtherProgram, origin: string): ReferenceGroup[] {
  const name = PROGRAM_NAMES[program];
  const short = SHORT[program];
  const brief = running(program) as { program: OtherProgram; id: string; title: string };
  return [
    {
      id: `${short}-ready-for-consensus`,
      event: `Every evaluator on a ${name} panel has submitted their scores`,
      messages: [
        {
          id: `${short}-ready-for-consensus-panel`,
          recipient: "To the panel's chair and the opportunity's owner",
          summary: `Sent ${AS_BLIND_COPIES}, once individual evaluation is over and a consensus can be agreed.`,
          message: readyForConsensus(brief, origin),
          sentBy: readyForConsensus,
        },
      ],
    },
    {
      id: `${short}-consensus-submitted`,
      event: `The consensus on a ${name} opportunity is submitted`,
      messages: [
        {
          id: `${short}-consensus-submitted-staff`,
          recipient: "To the opportunity's owner and administrators",
          summary: `Sent ${AS_BLIND_COPIES}, when the chair submits the consensus, so it can be finalized.`,
          message: consensusSubmitted(brief, origin),
          sentBy: consensusSubmitted,
        },
      ],
    },
    {
      id: `${short}-consensus-finalized`,
      event: `The consensus on a ${name} opportunity is finalized`,
      messages: [
        {
          id: `${short}-consensus-finalized-staff`,
          recipient: "To the panel's chair and the opportunity's owner",
          summary: `Sent ${AS_BLIND_COPIES}, when the consensus is finalized and the opportunity moves to its next stage.`,
          message: consensusFinalized(brief, origin),
          sentBy: consensusFinalized,
        },
      ],
    },
  ];
}

function proposalGroups(program: Program, origin: string): ReferenceGroup[] {
  const name = PROGRAM_NAMES[program];
  const short = SHORT[program];
  const subject = proposalSubject(program);
  return [
    {
      id: `${short}-proposal-submitted`,
      event: `A ${name} proposal is submitted`,
      messages: [
        {
          id: `${short}-proposal-submitted-vendor`,
          recipient: "To the vendor who submitted it",
          summary: "Sent to the vendor who put the proposal forward, confirming that it was submitted.",
          message: proposalSubmitted(subject, origin),
          sentBy: proposalSubmitted,
        },
      ],
    },
    {
      id: `${short}-proposal-withdrawn`,
      event: `A ${name} proposal is withdrawn`,
      messages: [
        {
          id: `${short}-proposal-withdrawn-vendor`,
          recipient: "To the vendor who withdrew it",
          summary: "Sent to the vendor who withdrew the proposal, confirming that it will not be considered.",
          message: proposalWithdrawnToVendor(subject, origin),
          sentBy: proposalWithdrawnToVendor,
        },
        {
          id: `${short}-proposal-withdrawn-administrators`,
          recipient: "To administrators",
          summary: `Sent to every administrator ${AS_BLIND_COPIES}, naming the proponent that withdrew.`,
          message: proposalWithdrawnToAdministrators(subject, SAMPLE.proponent, origin),
          sentBy: proposalWithdrawnToAdministrators,
        },
      ],
    },
    {
      id: `${short}-awarded`,
      event: `A ${name} opportunity is awarded`,
      messages: [
        {
          id: `${short}-awarded-winner`,
          recipient: "To the vendor whose proposal was chosen",
          summary: "Sent to the vendor whose proposal won, offering a way to sign in and see it.",
          message: proposalAwarded(subject, origin),
          sentBy: proposalAwarded,
        },
        {
          id: `${short}-not-awarded`,
          recipient: "To each proponent who was not chosen",
          summary: "Sent to every other proponent still in contention, naming the winner and offering a way to see their own score.",
          message: proposalNotAwarded(subject, SAMPLE.proponent, origin),
          sentBy: proposalNotAwarded,
        },
      ],
    },
  ];
}

function organizationGroups(look: Look): ReferenceGroup[] {
  const { person, organization, affiliationId } = SAMPLE;
  return [
    {
      id: "team-invitation",
      event: "An organization invites someone to its team",
      messages: [
        {
          id: "team-invitation-vendor",
          recipient: "To the invited vendor",
          summary: "Sent to a registered vendor an organization has invited, offering to accept or decline from their organizations page.",
          message: invitedToTeam(person, organization, affiliationId, look).message,
          sentBy: invitedToTeam,
        },
        {
          id: "team-invitation-to-register",
          recipient: "To an address with no vendor account",
          summary: "Sent when an organization invites an address no vendor account uses, asking them to sign up first.",
          message: invitedToRegister(person.email, organization, look).message,
          sentBy: invitedToRegister,
        },
      ],
    },
    {
      id: "team-invitation-accepted",
      event: "An invitation to a team is accepted",
      messages: [
        {
          id: "team-invitation-accepted-owner",
          recipient: "To the organization's owner",
          summary: "Sent to the organization's owner when the invited person joins its team.",
          message: invitationAcceptedToOwner(person, person, organization, look).message,
          sentBy: invitationAcceptedToOwner,
        },
        {
          id: "team-invitation-accepted-member",
          recipient: "To the person who joined",
          summary: "Sent to the person who accepted, confirming that they are now on the team.",
          message: invitationAcceptedToMember(person, organization, look).message,
          sentBy: invitationAcceptedToMember,
        },
      ],
    },
    {
      id: "team-invitation-declined",
      event: "An invitation to a team is declined",
      messages: [
        {
          id: "team-invitation-declined-owner",
          recipient: "To the organization's owner",
          summary: "Sent to the organization's owner when the invited person declines.",
          message: invitationDeclinedToOwner(person, person, organization, look).message,
          sentBy: invitationDeclinedToOwner,
        },
      ],
    },
    {
      id: "organization-archived",
      event: "An administrator archives an organization",
      messages: [
        {
          id: "organization-archived-owner",
          recipient: "To the organization's owner",
          summary: "Sent to the owner when an administrator archives their organization; never when the owner archives it.",
          message: organizationArchivedByAdministrator(person, organization, look).message,
          sentBy: organizationArchivedByAdministrator,
        },
      ],
    },
  ];
}

function accountGroups(look: Look): ReferenceGroup[] {
  const { person } = SAMPLE;
  const origin = look.serviceOrigin;
  const one = (
    id: string,
    event: string,
    summary: string,
    envelope: Envelope,
    sentBy: ReferenceMessage["sentBy"],
  ): ReferenceGroup => ({
    id,
    event,
    messages: [{ id: `${id}-holder`, recipient: "To the account holder", summary, message: envelope.message, sentBy }],
  });
  return [
    one("account-created", "An account is created", "Sent to a person when they sign in for the first time and their account is made.", welcome(person, origin), welcome),
    one(
      "account-deactivated-own",
      "A person deactivates their own account",
      "Sent to the person who deactivated their own account, telling them that signing in again brings it back.",
      deactivatedOwnAccount(person, origin),
      deactivatedOwnAccount,
    ),
    one(
      "account-reactivated-own",
      "A person signs in to an account they deactivated",
      "Sent to the person whose account became active again because they signed in.",
      reactivatedOwnAccount(person, origin),
      reactivatedOwnAccount,
    ),
    one(
      "account-deactivated-by-administrator",
      "An administrator deactivates an account",
      "Sent to the account holder when an administrator deactivates their account.",
      deactivatedByAdministrator(person, look),
      deactivatedByAdministrator,
    ),
    one(
      "account-reactivated-by-administrator",
      "An administrator reactivates an account",
      "Sent to the account holder when an administrator reactivates their account.",
      reactivatedByAdministrator(person, look),
      reactivatedByAdministrator,
    ),
  ];
}

function termsGroup(origin: string): ReferenceGroup {
  return {
    id: "terms-updated",
    event: "The terms and conditions are updated",
    messages: [
      {
        id: "terms-updated-vendors",
        recipient: "To every active vendor",
        summary: "Sent to every active vendor, one message each, when an administrator announces changed terms.",
        message: termsUpdated(SAMPLE.person, origin).message,
        sentBy: termsUpdated,
      },
    ],
  };
}

/** Every message the service can send, grouped by the event that sends it (R-6.13, R-6.19). */
export function referenceGroups(look: Look): ReferenceGroup[] {
  return [
    ...opportunityGroups(look.serviceOrigin),
    ...organizationGroups(look),
    ...accountGroups(look),
    termsGroup(look.serviceOrigin),
  ];
}
