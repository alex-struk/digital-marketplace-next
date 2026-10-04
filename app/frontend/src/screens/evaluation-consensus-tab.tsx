import { RefObject, useEffect, useRef, useState } from "react";
import { AlertDialog, Button, InlineAlert, Link, Modal, Text } from "@bcgov/design-system-react-components";
import {
  NEXT_STAGE_NAME,
  NOT_ALL_CONSENSUSES_SUBMITTED,
  SCREEN_IN_LIMIT,
  consensusStatusLabel,
  isConsensusWithheldFrom,
  mayReadConsensus,
  mayRecordConsensus,
  maySubmitConsensusSet,
  offersFinalize,
} from "@rules/consensus";
import { QUESTIONS_SEGMENT, hasPassedQuestions, hasReachedConsensus, isOnPanel } from "@rules/individual-evaluation";
import type { OtherProgram } from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import { Consensus, fetchConsensuses, submitConsensus } from "../api/evaluations";
import { OtherProgramOpportunity } from "../api/other-programs";
import { Loading } from "../app/loading";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";
import { evaluatedFrom } from "./opportunity-other-manage";

/**
 * The Consensus tab (evaluation-consensus-list-swu, -twu; decision record 0063): one row per
 * proponent by anonymous name with the state of its agreed scores. The chair opens each to record
 * them and submits the set once every proponent has a complete consensus, with a confirmation
 * (R-5.13, R-5.29 to R-5.31); the panel reads the list from the consensus stage; an administrator
 * at any stage; the owner off the panel is told why it is not shown yet (R-5.12). Finalising is the
 * manage page's own action, in its action bar (R-5.14; design gap 13).
 */

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

/** Where one proponent's consensus is: the chair's, or a new one. */
export function consensusAddress(program: OtherProgram, opportunityId: string, proposalId: string, chairId: string | null): string {
  const base = `/opportunities/${program}/${opportunityId}/proposals/${proposalId}/${QUESTIONS_SEGMENT[program]}/consensus`;
  return chairId ? `${base}/${chairId}/edit` : `${base}/create`;
}

/** What finalising does, in words, for each program (R-5.32). */
export function finalizingWords(program: OtherProgram): string {
  const limit = SCREEN_IN_LIMIT[program] === 4 ? "four" : "three";
  return `Finalizing records the agreed scores against each proponent and moves up to ${limit} proponents who met every minimum score into the ${NEXT_STAGE_NAME[program].toLowerCase()}. It cannot be undone.`;
}

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly consensuses: readonly Consensus[] }
  | { readonly kind: "withheld" }
  | { readonly kind: "failed" };

export function ConsensusTab({
  program,
  account,
  opportunity,
  onSubmitted,
}: {
  program: OtherProgram;
  account: Account;
  opportunity: OtherProgramOpportunity;
  onSubmitted: (opportunity: OtherProgramOpportunity) => void;
}) {
  const evaluated = evaluatedFrom(opportunity);
  const withheld = isConsensusWithheldFrom(account, evaluated);
  const readable = mayReadConsensus(account, evaluated);
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [round, setRound] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ readonly kind: "submitted" } | { readonly kind: "refused"; readonly reasons: readonly string[] } | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!readable) return;
    let current = true;
    void fetchConsensuses(program, opportunity.id).then((answer) => {
      if (!current) return;
      setLoaded(answer.kind === "found" ? { kind: "loaded", consensuses: answer.consensuses } : answer.kind === "withheld" ? { kind: "withheld" } : { kind: "failed" });
    });
    return () => {
      current = false;
    };
  }, [program, opportunity.id, readable, round]);

  useEffect(() => {
    if (outcome?.kind === "refused") alertRef.current?.focus();
  }, [outcome]);

  if (withheld || loaded.kind === "withheld") {
    return (
      <div data-testid="evaluation-consensus-withheld-message">
        <InlineAlert
          variant="info"
          title="The agreed scores are not shown to you yet"
          description={`While the consensus is being agreed, only the evaluation panel can see it, and you are not on this opportunity's panel. The agreed scores appear here once the opportunity moves to the ${NEXT_STAGE_NAME[program].toLowerCase()}.`}
        />
      </div>
    );
  }
  if (!hasReachedConsensus(opportunity.status) && (!readable || (opportunity.proponents ?? []).length === 0)) {
    return <Text elementType="p">The consensus stage begins once every evaluator on the panel has submitted their scores.</Text>;
  }
  if (loaded.kind === "loading") return <Loading label="Loading the agreed scores…" />;
  if (loaded.kind === "failed") {
    return (
      <TitledAlert variant="danger" role="alert" title="The agreed scores could not be loaded">
        <Text elementType="p">Reload the page to try again.</Text>
      </TitledAlert>
    );
  }

  const questions = opportunity.questions;
  const proponents = opportunity.proponents ?? [];
  const chairing = mayRecordConsensus(account, evaluated);
  const finalizer = offersFinalize(account, evaluated);
  const onPanel = isOnPanel(account, evaluated);
  const atConsensus = opportunity.status === "EVAL_QUESTIONS_CONSENSUS";
  const consensusOf = (proposalId: string) => loaded.consensuses.find((consensus) => consensus.proposal.id === proposalId) ?? null;
  const awaited = proponents.filter((proponent) => proponent.status === "UNDER_REVIEW_QUESTIONS");
  const ready = maySubmitConsensusSet(
    questions,
    awaited.map((proponent) => proponent.id),
    loaded.consensuses.map((consensus) => ({ ...consensus, proposal: consensus.proposal.id, anonymousProponentName: consensus.proposal.anonymousProponentName })),
  );
  const submitted = awaited.length > 0 && awaited.every((proponent) => consensusOf(proponent.id)?.status === "SUBMITTED");
  const showsAction = atConsensus && (chairing || onPanel);

  /** The link each row offers: the chair records; the rest of the panel reads. */
  function actionFor(proposalId: string): { label: string; href: string } | null {
    const consensus = consensusOf(proposalId);
    if (chairing) {
      return {
        label: consensus ? "Edit consensus" : "Start consensus",
        href: consensusAddress(program, opportunity.id, proposalId, consensus ? consensus.evaluator.id : null),
      };
    }
    if (!onPanel) return null;
    return { label: consensus ? "View consensus" : "View evaluators' scores", href: consensusAddress(program, opportunity.id, proposalId, consensus ? consensus.evaluator.id : null) };
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    const answer = await submitConsensus(program, opportunity.id);
    setBusy(false);
    setConfirming(false);
    if (answer.kind === "saved") {
      setOutcome({ kind: "submitted" });
      onSubmitted(answer.opportunity);
    } else {
      setOutcome({ kind: "refused", reasons: answer.kind === "refused" ? answer.reasons : ["The consensus scores could not be submitted. Try again."] });
    }
    setRound((value) => value + 1);
  }

  return (
    <>
      {outcome?.kind === "refused" ? (
        <div tabIndex={-1} ref={alertRef}>
          <InlineAlert variant="danger" role="alert" title="The consensus scores were not submitted" description={outcome.reasons.join(" ")} />
        </div>
      ) : outcome?.kind === "submitted" ? (
        <div role="status">
          <InlineAlert
            variant="success"
            title="The consensus scores have been submitted"
            description="The opportunity's owner and every administrator are being told."
          />
        </div>
      ) : null}
      <Text elementType="p">
        {hasPassedQuestions(opportunity.status)
          ? "The consensus scores have been finalized. The agreed scores are recorded against each proponent."
          : chairing
            ? submitted
              ? "You have submitted the consensus scores. You can change a consensus until the scores are finalized. If you do, submit the scores again."
              : "As chair, record one agreed score and comment for each question of each proponent, drawing on the evaluators' scores. You can change a consensus until the consensus scores are finalized."
            : finalizer
              ? `The chair records one agreed score for each proponent. ${finalizingWords(program)}`
              : atConsensus
                ? "The panel's chair records one agreed score and comment for each question of each proponent."
                : "The consensus stage begins once every evaluator on the panel has submitted their scores."}
      </Text>
      <div role="region" aria-labelledby="consensus-caption" tabIndex={0} style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="evaluation-consensus-table">
          <caption id="consensus-caption" style={{ textAlign: "start" }}>
            <Text size="small" color="secondary">
              Agreed scores, by anonymous proponent name
            </Text>
          </caption>
          <thead>
            <tr>
              <th scope="col" style={cell}>Proponent</th>
              <th scope="col" style={cell}>Consensus</th>
              {showsAction ? <th scope="col" style={cell}>Action</th> : null}
            </tr>
          </thead>
          <tbody>
            {proponents.map((proponent) => {
              const action = showsAction ? actionFor(proponent.id) : null;
              return (
                <tr key={proponent.id} data-testid="evaluation-proponent-row">
                  <td style={cell}>
                    <span data-testid="proposal-proponent-name">{proponent.anonymousProponentName}</span>
                  </td>
                  <td style={cell}>
                    <span style={badge} data-testid="evaluation-consensus-status">
                      {consensusStatusLabel(consensusOf(proponent.id), questions)}
                    </span>
                  </td>
                  {showsAction ? (
                    <td style={cell}>
                      {action ? (
                        <Link href={action.href} aria-label={`${action.label}: ${proponent.anonymousProponentName}`} data-testid="evaluation-open-consensus">
                          {action.label}
                        </Link>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {chairing ? (
        <Stack gap="medium">
          <Text elementType="p" id="submit-hint">
            {ready
              ? "Every proponent has a complete consensus. When you submit, the opportunity's owner and every administrator are told."
              : "You can submit once every proponent has a complete consensus: an agreed score and comment for every question."}
          </Text>
          <div>
            <Button
              variant="primary"
              isDisabled={!ready || busy}
              aria-describedby="submit-hint"
              onPress={() => setConfirming(true)}
              data-testid="evaluation-submit-consensus"
            >
              Submit final consensus scores
            </Button>
          </div>
        </Stack>
      ) : null}
      <Modal isOpen={confirming} isDismissable onOpenChange={(open) => (!open && !busy ? setConfirming(false) : undefined)}>
        <AlertDialog
          variant="confirmation"
          title="Submit the final consensus scores?"
          data-testid="evaluation-submit-consensus-dialog"
          buttons={
            <>
              <Button variant="secondary" isDisabled={busy} onPress={() => setConfirming(false)} data-testid="evaluation-dialog-cancel">
                Cancel
              </Button>
              <Button variant="primary" isDisabled={busy} onPress={() => void submit()} data-testid="evaluation-submit-consensus-confirm">
                Submit consensus scores
              </Button>
            </>
          }
        >
          <Text elementType="p">
            The opportunity's owner and every administrator will be told that the consensus is ready to be finalized. You can still change a
            consensus until the scores are finalized.
          </Text>
        </AlertDialog>
      </Modal>
    </>
  );
}

/** The confirmation before finalising (R-5.32, R-5.33). */
export function FinalizeDialog({
  program,
  isOpen,
  isSending,
  onCancel,
  onConfirm,
}: {
  program: OtherProgram;
  isOpen: boolean;
  isSending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const limit = SCREEN_IN_LIMIT[program] === 4 ? "four" : "three";
  return (
    <Modal isOpen={isOpen} isDismissable onOpenChange={(open) => (!open && !isSending ? onCancel() : undefined)}>
      <AlertDialog
        variant="confirmation"
        title="Finalize the consensus scores?"
        data-testid="evaluation-finalize-dialog"
        buttons={
          <>
            <Button variant="secondary" isDisabled={isSending} onPress={onCancel} data-testid="evaluation-dialog-cancel">
              Cancel
            </Button>
            <Button variant="primary" isDisabled={isSending} onPress={onConfirm} data-testid="evaluation-finalize-confirm">
              Finalize consensus scores
            </Button>
          </>
        }
      >
        <Text elementType="p">
          {`The agreed scores are recorded against each proponent. Up to ${limit} of the highest-scoring proponents who met every minimum score move into the ${NEXT_STAGE_NAME[program].toLowerCase()}, and the opportunity moves with them. The chair and the opportunity's owner are told. This cannot be undone.`}
        </Text>
      </AlertDialog>
    </Modal>
  );
}

/**
 * A refusal to finalise (R-1.41, R-5.10, R-5.13), in the opportunities domain's wrapper, the inner
 * test ID saying which refusal it is.
 */
export function FinalizeRefusal({ reasons, alertRef }: { reasons: readonly string[]; alertRef: RefObject<HTMLDivElement> }) {
  const text = reasons.join(" ");
  const inner = reasons.includes(NOT_ALL_CONSENSUSES_SUBMITTED)
    ? "evaluation-not-all-submitted-error"
    : /screened into the/.test(text)
      ? "evaluation-no-screenable-error"
      : undefined;
  return (
    <div tabIndex={-1} ref={alertRef} data-testid="advance-refused-message">
      <div data-testid={inner}>
        <InlineAlert variant="danger" role="alert" title="The consensus scores could not be finalized" description={text} />
      </div>
    </div>
  );
}
