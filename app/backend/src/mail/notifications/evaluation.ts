import { PROGRAM_NAMES } from "../../rules/opportunities";
import { QUESTION_NOUN } from "../../rules/individual-evaluation";
import type { OtherProgram } from "../../rules/other-program-drafts";
import { Message } from "../message";

/**
 * The message individual evaluation sends when it is over (R-5.27): to the panel's chair and the
 * opportunity's owner, batched as blind copies by whoever sends it (R-6.15), that every evaluator
 * has submitted and the consensus can be agreed.
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
      { kind: "action", label: "Open the consensus", href: `${origin}/opportunities/${opportunity.program}/${opportunity.id}/edit?tab=consensus` },
    ],
  };
}
