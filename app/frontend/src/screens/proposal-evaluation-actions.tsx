import { FormEvent, useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  Button,
  ButtonGroup,
  Dialog,
  Form,
  Heading,
  Modal,
  NumberField,
  Text,
  TextArea,
} from "@bcgov/design-system-react-components";
import { DISQUALIFY_REASON_MAX, SCORE_MESSAGE, disqualificationReasonProblem, readScore } from "@rules/proposal-evaluation";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";

/**
 * What the opportunity's author and administrators do with a proposal once the opportunity has
 * closed, on its read-only page: enter a Code With Us proposal's one score out of 100 (R-2.26),
 * disqualify a proposal with a reason (R-2.34), and award it once it is evaluated (R-2.33, R-1.26).
 * The page offers what the proposal's state allows, by the same rules the service applies
 * (`offeredEvaluationActions`, `offeredTeamEvaluationActions`); the service still decides.
 */

/** What a change came back with, in any program. */
export type EvaluationAnswer<P> =
  | { readonly kind: "saved"; readonly proposal: P }
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

export interface EvaluationOffers {
  readonly score: boolean;
  readonly award: boolean;
  readonly disqualify: boolean;
}

type Dialogs = "score" | "disqualify" | "award" | null;

export function EvaluationActions<P>({
  offers,
  change,
  onChanged,
}: {
  offers: EvaluationOffers;
  change: (tag: "score" | "disqualify" | "award", value: number | string | undefined) => Promise<EvaluationAnswer<P>>;
  onChanged: (proposal: P, done: string) => void;
}) {
  const [dialog, setDialog] = useState<Dialogs>(null);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<{ title: string; reasons: readonly string[] } | null>(null);

  /** Sends one change; a refusal is said on the page, or in the dialog when it is about the field. */
  async function send(
    tag: "score" | "disqualify" | "award",
    value: number | string | undefined,
    done: string,
    refusedTitle: string,
  ): Promise<EvaluationAnswer<P>> {
    setBusy(true);
    const answer = await change(tag, value);
    setBusy(false);
    if (answer.kind === "saved") {
      setDialog(null);
      setRefusal(null);
      onChanged(answer.proposal, done);
    } else if (!(answer.kind === "refused" && answer.reasons.some((reason) => /^(score|disqualificationReason): /.test(reason)))) {
      setDialog(null);
      setRefusal({
        title: refusedTitle,
        reasons: answer.kind === "refused" ? answer.reasons : ["The service could not do that. Try again."],
      });
    }
    return answer;
  }

  return (
    <>
      <div data-testid="proposal-actions">
        {offers.score || offers.award || offers.disqualify ? (
          <ButtonGroup ariaLabel="Proposal actions">
            {offers.score ? (
              <Button variant="primary" isDisabled={busy} onPress={() => setDialog("score")} data-testid="proposal-enter-score">
                Enter score
              </Button>
            ) : null}
            {offers.award ? (
              <Button variant="primary" isDisabled={busy} onPress={() => setDialog("award")} data-testid="proposal-award-button">
                Award
              </Button>
            ) : null}
            {offers.disqualify ? (
              <Button
                variant="secondary"
                danger
                isDisabled={busy}
                onPress={() => setDialog("disqualify")}
                data-testid="proposal-disqualify-button"
              >
                Disqualify
              </Button>
            ) : null}
          </ButtonGroup>
        ) : (
          <Text elementType="p">There is nothing to do with this proposal now.</Text>
        )}
      </div>
      {refusal ? (
        <div data-testid="proposal-refused-message">
          <TitledAlert variant="danger" role="alert" title={refusal.title}>
            {refusal.reasons.map((reason) => (
              <Text elementType="p" key={reason}>
                {reason}
              </Text>
            ))}
          </TitledAlert>
        </div>
      ) : null}
      <ScoreDialog
        isOpen={dialog === "score"}
        isSending={busy}
        onCancel={() => setDialog(null)}
        onConfirm={(score) => send("score", score, "The score has been entered.", "The score was not entered")}
      />
      <DisqualifyDialog
        isOpen={dialog === "disqualify"}
        isSending={busy}
        onCancel={() => setDialog(null)}
        onConfirm={(reason) => send("disqualify", reason, "The proposal has been disqualified.", "The proposal was not disqualified")}
      />
      <Modal isOpen={dialog === "award"} isDismissable onOpenChange={(open) => (!open && !busy ? setDialog(null) : undefined)}>
        <AlertDialog
          variant="confirmation"
          title="Award this proposal?"
          data-testid="proposal-award-dialog"
          buttons={
            <>
              <Button variant="secondary" isDisabled={busy} onPress={() => setDialog(null)} data-testid="proposal-dialog-cancel">
                Cancel
              </Button>
              <Button
                variant="primary"
                isDisabled={busy}
                onPress={() => void send("award", undefined, "The proposal has been awarded.", "The proposal was not awarded")}
                data-testid="proposal-award-confirm"
              >
                Award proposal
              </Button>
            </>
          }
        >
          <Text elementType="p">
            The opportunity will be awarded to this proponent. Every other proposal still in contention will be marked not
            awarded. The winner will be sent an award notice and every other proponent a decision notice. Disqualified and
            withdrawn proposals keep their state.
          </Text>
        </AlertDialog>
      </Modal>
    </>
  );
}

/**
 * The score, as the field shows it: what has been typed is read as it stands, so a value not yet
 * committed by leaving the field still counts.
 */
export function scoreFromField(typed: string): number | null {
  const cleaned = typed.replace(/[,%\s]/g, "");
  return cleaned === "" ? null : readScore(cleaned);
}

function ScoreDialog({
  isOpen,
  isSending,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  isSending: boolean;
  onCancel: () => void;
  onConfirm: (score: number) => Promise<EvaluationAnswer<unknown>>;
}) {
  const [value, setValue] = useState<number>(Number.NaN);
  const [problem, setProblem] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(Number.NaN);
      setProblem(null);
    }
  }, [isOpen]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    const typed = fieldRef.current?.querySelector("input")?.value ?? (Number.isNaN(value) ? "" : String(value));
    const score = scoreFromField(typed);
    if (score === null) {
      setProblem(SCORE_MESSAGE);
      return;
    }
    const answer = await onConfirm(score);
    if (answer.kind === "refused") {
      const line = answer.reasons.find((reason) => reason.startsWith("score: "));
      if (line) setProblem(line.slice("score: ".length));
    }
  }

  return (
    <Modal isOpen={isOpen} isDismissable onOpenChange={(open) => (!open && !isSending ? onCancel() : undefined)}>
      <Dialog isCloseable data-testid="proposal-score-dialog">
        <div style={{ padding: "var(--layout-padding-large)" }}>
          <Form validationBehavior="aria" onSubmit={(event) => void submit(event)}>
            <Stack gap="medium">
              <Heading level={2} slot="title">
                Enter score
              </Heading>
              <Text elementType="p">
                Entering a score moves this proposal from under review to evaluated. The score is recorded in its history.
              </Text>
              <div ref={fieldRef}>
                <NumberField
                  label="Score (%)"
                  isRequired
                  description="Between 0 and 100, with up to two decimal places."
                  value={value}
                  onChange={(next) => {
                    setValue(next);
                    if (problem) setProblem(null);
                  }}
                  isInvalid={problem !== null}
                  errorMessage={problem ?? undefined}
                  data-testid="proposal-score-field"
                />
              </div>
              <ButtonGroup ariaLabel="Score choices">
                <Button variant="secondary" isDisabled={isSending} onPress={onCancel} data-testid="proposal-dialog-cancel">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isDisabled={isSending} data-testid="proposal-score-confirm">
                  Enter score
                </Button>
              </ButtonGroup>
            </Stack>
          </Form>
        </div>
      </Dialog>
    </Modal>
  );
}

function DisqualifyDialog({
  isOpen,
  isSending,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  isSending: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<EvaluationAnswer<unknown>>;
}) {
  const [reason, setReason] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason("");
      setProblem(null);
    }
  }, [isOpen]);

  async function confirm() {
    if (isSending) return;
    const found = disqualificationReasonProblem(reason);
    if (found) {
      setProblem(found);
      return;
    }
    const answer = await onConfirm(reason.trim());
    if (answer.kind === "refused") {
      const line = answer.reasons.find((given) => given.startsWith("disqualificationReason: "));
      if (line) setProblem(line.slice("disqualificationReason: ".length));
    }
  }

  return (
    <Modal isOpen={isOpen} isDismissable onOpenChange={(open) => (!open && !isSending ? onCancel() : undefined)}>
      <AlertDialog
        variant="destructive"
        title="Disqualify this proposal?"
        data-testid="proposal-disqualify-dialog"
        buttons={
          <>
            <Button variant="secondary" isDisabled={isSending} onPress={onCancel} data-testid="proposal-dialog-cancel">
              Cancel
            </Button>
            <Button variant="primary" danger isDisabled={isSending} onPress={() => void confirm()} data-testid="proposal-disqualify-confirm">
              Disqualify proposal
            </Button>
          </>
        }
      >
        <Stack gap="medium">
          <Text elementType="p">The proposal will no longer be evaluated. The reason is kept in its history.</Text>
          <TextArea
            label="Reason"
            isRequired
            maxLength={DISQUALIFY_REASON_MAX}
            description="Between 1 and 5,000 characters."
            value={reason}
            onChange={(next) => {
              setReason(next);
              if (problem) setProblem(null);
            }}
            isInvalid={problem !== null}
            errorMessage={problem ?? undefined}
            data-testid="proposal-disqualify-reason-field"
          />
        </Stack>
      </AlertDialog>
    </Modal>
  );
}
