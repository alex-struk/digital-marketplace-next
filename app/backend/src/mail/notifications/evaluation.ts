import { PROGRAM_NAMES } from "../../rules/opportunities";
import { QUESTION_NOUN } from "../../rules/individual-evaluation";
import type { OtherProgram } from "../../rules/other-program-drafts";
import { Message } from "../message";

/**
 * The messages the evaluation of the questions sends to staff: when individual evaluation is over
 * (R-5.27), when the chair submits the consensus (R-5.31) and when it is finalized (R-5.33). Each
 * goes to its readers as blind copies, the service's own address the only visible recipient, so
 * nobody sees who else was told (R-6.15; decision record 0063).
 */

export interface EvaluatedOpportunityInBrief {
  readonly program: OtherProgram;
  readonly id: string;
  readonly title: string;
}

export function readyForConsensus(opportunity: EvaluatedOpportunityInBrief, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    kind: `${opportunity.program === "sprint-with-us" ? "swu" : "twu"}-questions-ready-for-consensus`,
    subject: `A ${program} Opportunity is Ready for Consensus: ${opportunity.title}`,
    title: `A ${program} opportunity is ready for consensus`,
    body: [
      {
        kind: "paragraph",
        content: [
          `Every evaluator on the evaluation panel of "${opportunity.title}" has submitted their individual scores. The ${QUESTION_NOUN[opportunity.program]}s are ready for the panel's chair to agree a consensus.`,
        ],
      },
      { kind: "action", label: "Open the consensus", href: consensusTab(opportunity, origin) },
    ],
  };
}

const kindOf = (opportunity: EvaluatedOpportunityInBrief, what: string) =>
  `${opportunity.program === "sprint-with-us" ? "swu" : "twu"}-questions-consensus-${what}`;
function consensusTab(opportunity: EvaluatedOpportunityInBrief, origin: string): string {
  return `${origin}/opportunities/${opportunity.program}/${opportunity.id}/edit?tab=consensus`;
}

/**
 * The chair has submitted the consensus (R-5.31): to the opportunity's owner and every
 * administrator, that the agreed scores are ready to be finalized.
 */
export function consensusSubmitted(opportunity: EvaluatedOpportunityInBrief, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    kind: kindOf(opportunity, "submitted"),
    subject: `A ${program} Opportunity's Consensus Has Been Submitted: ${opportunity.title}`,
    title: `A ${program} opportunity's consensus has been submitted`,
    body: [
      {
        kind: "paragraph",
        content: [
          `The chair of the evaluation panel of "${opportunity.title}" has submitted the consensus scores for its ${QUESTION_NOUN[opportunity.program]}s. They are ready to be finalized by the opportunity's owner or an administrator.`,
        ],
      },
      { kind: "action", label: "Open the consensus", href: consensusTab(opportunity, origin) },
    ],
  };
}

/**
 * The consensus has been finalized (R-5.33): to the panel's chair and the opportunity's owner, that
 * the agreed scores are recorded and the opportunity has moved to its next stage.
 */
export function consensusFinalized(opportunity: EvaluatedOpportunityInBrief, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  const next = opportunity.program === "sprint-with-us" ? "code challenge" : "challenge";
  return {
    kind: kindOf(opportunity, "finalized"),
    subject: `A ${program} Opportunity's Consensus Has Been Finalized: ${opportunity.title}`,
    title: `A ${program} opportunity's consensus has been finalized`,
    body: [
      {
        kind: "paragraph",
        content: [
          `The consensus scores for "${opportunity.title}" have been finalized. The agreed scores are recorded against each proponent, and the opportunity has moved to the ${next} with the proponents screened into it.`,
        ],
      },
      { kind: "action", label: "Open the opportunity", href: `${origin}/opportunities/${opportunity.program}/${opportunity.id}/edit` },
    ],
  };
}
