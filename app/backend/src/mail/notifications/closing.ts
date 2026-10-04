import { PROGRAM_NAMES, Program } from "../../rules/opportunities";
import { Message } from "../message";

/**
 * The messages an opportunity's closure at its proposal deadline sends (R-1.1, R-5.20): to the
 * author of a Code With Us opportunity, and to every evaluator on the panel of a Sprint With Us or
 * Team With Us one, that it is ready to be evaluated. A chair who does not evaluate is not told.
 */

export interface ClosedOpportunity {
  readonly program: Program;
  readonly id: string;
  readonly title: string;
}

const manageAddress = (origin: string, opportunity: ClosedOpportunity) =>
  `${origin}/opportunities/${opportunity.program}/${opportunity.id}/edit`;

/** To the author of a Code With Us opportunity: its proposals are ready to be scored (R-1.1). */
export function readyForEvaluationToAuthor(opportunity: ClosedOpportunity, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    kind: `${opportunity.program}-opportunity-ready-for-evaluation`,
    subject: `Your ${program} Opportunity is Ready to Be Evaluated`,
    title: `Your ${program} opportunity is ready to be evaluated`,
    body: [
      {
        kind: "paragraph",
        content: [
          `The proposal deadline for "${opportunity.title}" has passed and the opportunity has closed. The proposals submitted to it are ready for you to review and score.`,
        ],
      },
      { kind: "action", label: "Review the proposals", href: `${manageAddress(origin, opportunity)}?tab=proposals` },
    ],
  };
}

/** To each evaluator on its panel, addressed to them alone: it is ready for their evaluation (R-5.20). */
export function readyForEvaluationToEvaluators(opportunity: ClosedOpportunity, origin: string): Message {
  const program = PROGRAM_NAMES[opportunity.program];
  return {
    kind: `${opportunity.program}-opportunity-ready-for-evaluators`,
    subject: `A ${program} Opportunity is Ready to Be Evaluated: ${opportunity.title}`,
    title: `A ${program} opportunity is ready for your evaluation`,
    body: [
      {
        kind: "paragraph",
        content: [
          `The proposal deadline for "${opportunity.title}" has passed and the opportunity has closed. You are an evaluator on its evaluation panel, and its proposals are ready for you to evaluate.`,
        ],
      },
      { kind: "action", label: "Open the opportunity", href: manageAddress(origin, opportunity) },
    ],
  };
}
