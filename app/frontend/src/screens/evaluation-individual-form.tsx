import { FormEvent, useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, NumberField, Text, TextArea } from "@bcgov/design-system-react-components";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  EnteredScore,
  ScoreProblem,
  evaluationStatusLabel,
  isEvaluatorOn,
  mayRecordIndividualEvaluation,
  scoreProblems,
} from "@rules/individual-evaluation";
import type { OtherProgram } from "@rules/other-program-drafts";
import type { Account } from "../api/accounts";
import { Evaluation, EvaluationSaveAnswer, fetchEvaluation, fetchOwnEvaluations, saveEvaluation, startEvaluation } from "../api/evaluations";
import { OtherProgramOpportunity, Proponent, StoredQuestion, fetchOtherProgramOpportunity } from "../api/other-programs";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { Stack } from "../app/page-layout";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { evaluationAddress } from "./evaluation-tabs";
import { evaluatedFrom } from "./opportunity-other-manage";

/**
 * One proponent's individual evaluation (evaluation-individual-create-swu, -twu and
 * evaluation-individual-edit-swu, -twu; decision record 0062): one score and one comment per
 * question, beside the proponent's answer, the proponent named only anonymously (R-5.22, R-5.35).
 *
 * Every save keeps what is on the screen, whatever it holds, and lists what would stop the scores
 * being submitted (R-5.23). The evaluator moves through the proponents in anonymous order, saving
 * as they go (R-5.35); nothing is submitted here, only from the Evaluation tab (R-5.26). A submitted
 * evaluation, or another evaluator's once the reader may see it (R-5.28), is shown and not offered
 * for change (R-5.24). Anybody who may not record or read it is shown the missing page (R-5.11,
 * R-5.21).
 */

const PROGRAM_WORDS: Readonly<Record<OtherProgram, string>> = { "sprint-with-us": "Sprint With Us", "team-with-us": "Team With Us" };

const createTitle = (program: OtherProgram) => `Evaluate a ${PROGRAM_WORDS[program]} proponent`;
const editTitle = (program: OtherProgram) => `${PROGRAM_WORDS[program]} evaluation`;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const group = {
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;
const response = {
  padding: "var(--layout-padding-small)",
  borderInlineStart: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
} as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;

export function EvaluationIndividualScreen({
  program,
  opportunityId,
  proposalId,
  evaluatorId,
}: {
  program: OtherProgram;
  opportunityId: string;
  proposalId: string;
  /** The evaluator whose evaluation this is; null on the page that starts one. */
  evaluatorId: string | null;
}) {
  const title = evaluatorId ? editTitle(program) : createTitle(program);
  useScreenTitle(title);
  return (
    <RequireSignIn title={title} loadingLabel="Loading the proponent's responses…">
      {(account) => (
        <EvaluationLoader
          key={`${proposalId}/${evaluatorId ?? "new"}`}
          program={program}
          account={account}
          opportunityId={opportunityId}
          proposalId={proposalId}
          evaluatorId={evaluatorId}
        />
      )}
    </RequireSignIn>
  );
}

type Loaded =
  | { readonly kind: "loading" }
  | { readonly kind: "missing" }
  | { readonly kind: "failed" }
  | {
      readonly kind: "found";
      readonly opportunity: OtherProgramOpportunity;
      readonly proponent: Proponent;
      readonly evaluation: Evaluation | null;
      readonly own: readonly Evaluation[];
    };

function EvaluationLoader({
  program,
  account,
  opportunityId,
  proposalId,
  evaluatorId,
}: {
  program: OtherProgram;
  account: Account;
  opportunityId: string;
  proposalId: string;
  evaluatorId: string | null;
}) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });

  useEffect(() => {
    let current = true;
    void (async (): Promise<Loaded> => {
      const found = await fetchOtherProgramOpportunity(program, opportunityId);
      if (found.kind !== "found") return { kind: "missing" };
      const opportunity = found.opportunity;
      const proponent = opportunity.proponents?.find((entry) => entry.id === proposalId.toLowerCase());
      if (!proponent) return { kind: "missing" };
      const evaluated = evaluatedFrom(opportunity);
      const own = isEvaluatorOn(account, evaluated) ? ((await fetchOwnEvaluations(program, opportunity.id)) ?? []) : [];
      if (!evaluatorId) {
        // Starting one: an evaluator on the panel, while the questions are evaluated individually (R-5.21).
        if (!mayRecordIndividualEvaluation(account, evaluated) || proponent.status !== "UNDER_REVIEW_QUESTIONS") return { kind: "missing" };
        return { kind: "found", opportunity, proponent, evaluation: null, own };
      }
      const answer = await fetchEvaluation(program, proponent.id, evaluatorId.toLowerCase());
      if (answer.kind === "failed") return { kind: "failed" };
      if (answer.kind === "missing") return { kind: "missing" };
      return { kind: "found", opportunity, proponent, evaluation: answer.evaluation, own };
    })().then((next) => {
      if (current) setLoaded(next);
    });
    return () => {
      current = false;
    };
  }, [program, account, opportunityId, proposalId, evaluatorId]);

  if (loaded.kind === "loading") {
    return (
      <Stack gap="large">
        <Heading level={1}>{evaluatorId ? editTitle(program) : createTitle(program)}</Heading>
        <Loading label="Loading the proponent's responses…" />
      </Stack>
    );
  }
  if (loaded.kind === "missing") return <NotFound />;
  if (loaded.kind === "failed") {
    return (
      <Stack gap="large">
        <Heading level={1}>{editTitle(program)}</Heading>
        <TitledAlert variant="danger" role="alert" title="This evaluation could not be loaded">
          <Text elementType="p">Reload the page to try again.</Text>
        </TitledAlert>
      </Stack>
    );
  }
  const { opportunity, proponent, evaluation, own } = loaded;
  const editable =
    evaluation === null ||
    (evaluation.evaluator.id === account.id && evaluation.status === "DRAFT" && mayRecordIndividualEvaluation(account, evaluatedFrom(opportunity)));
  return editable ? (
    <EvaluationForm program={program} account={account} opportunity={opportunity} proponent={proponent} evaluation={evaluation} own={own} />
  ) : (
    <EvaluationShown program={program} account={account} opportunity={opportunity} proponent={proponent} evaluation={evaluation!} own={own} />
  );
}

/** Where the proponent stands among those evaluated, and who comes before and after it (R-5.35). */
function placeOf(opportunity: OtherProgramOpportunity, proponent: Proponent) {
  const proponents = opportunity.proponents ?? [];
  const index = proponents.findIndex((entry) => entry.id === proponent.id);
  return {
    position: index + 1,
    count: proponents.length,
    previous: index > 0 ? proponents[index - 1]! : null,
    next: index >= 0 && index < proponents.length - 1 ? proponents[index + 1]! : null,
  };
}

function Heading1({ kind, proponent }: { kind: string; proponent: Proponent }) {
  return (
    <Stack gap="small">
      <Text elementType="p" size="small" color="secondary">
        {kind}
      </Text>
      <Heading level={1}>
        <span data-testid="proposal-proponent-name">{proponent.anonymousProponentName}</span>
      </Heading>
    </Stack>
  );
}

function OpportunityLine({ opportunity, proponent }: { opportunity: OtherProgramOpportunity; proponent: Proponent }) {
  const place = placeOf(opportunity, proponent);
  return (
    <Stack direction="row" align="center" gap="medium">
      <Text elementType="p">{opportunity.title}</Text>
      <Text elementType="p" size="small" color="secondary">
        {proponent.anonymousProponentName} of {place.count}
      </Text>
    </Stack>
  );
}

const listAddress = (program: OtherProgram, opportunityId: string) => `/opportunities/${program}/${opportunityId}/edit?tab=evaluation`;

/** "Question 1: enter a score between 0 and 5", from the field's own message. */
function summaryLine(problem: ScoreProblem): string {
  const words = problem.message.replace(/ for question \d+\.$/, "");
  return `Question ${problem.order + 1}: ${words.charAt(0).toLowerCase()}${words.slice(1)}`;
}

type Entry = { readonly score: number; readonly notes: string };

function entriesFrom(questions: readonly StoredQuestion[], evaluation: Evaluation | null): Entry[] {
  return questions.map((_, order) => {
    const stored = evaluation?.scores.find((score) => score.order === order);
    return { score: typeof stored?.score === "number" ? stored.score : Number.NaN, notes: stored?.notes ?? "" };
  });
}

/** A score as typed, read from the field itself so nothing is rounded on the way; null when empty or not a number. */
function typedScore(container: HTMLElement | null, fallback: number): number | null {
  const typed = container?.querySelector("input")?.value;
  if (typed !== undefined) {
    const cleaned = typed.replace(/[,\s]/g, "");
    if (cleaned === "") return null;
    const value = Number(cleaned);
    return Number.isFinite(value) ? value : null;
  }
  return Number.isFinite(fallback) ? fallback : null;
}

function EvaluationForm({
  program,
  account,
  opportunity,
  proponent,
  evaluation,
  own,
}: {
  program: OtherProgram;
  account: Account;
  opportunity: OtherProgramOpportunity;
  proponent: Proponent;
  evaluation: Evaluation | null;
  own: readonly Evaluation[];
}) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const questions = opportunity.questions;
  const [entries, setEntries] = useState<Entry[]>(() => entriesFrom(questions, evaluation));
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  // Arriving straight from a save shows what was saved and what is still wrong with it.
  const [checked, setChecked] = useState(search.saved === "draft" || search.saved === "changes");
  const [notice, setNotice] = useState<"saved" | null>(search.saved === "draft" || search.saved === "changes" ? "saved" : null);
  const [refusal, setRefusal] = useState<EvaluationSaveAnswer | null>(null);
  const [busy, setBusy] = useState(false);
  const scoreRefs = useRef<(HTMLDivElement | null)[]>([]);
  const alertRef = useRef<HTMLDivElement>(null);
  const place = placeOf(opportunity, proponent);
  const editing = evaluation !== null;

  const current = (): EnteredScore[] =>
    entries.map((entry, order) => ({ order, score: typedScore(scoreRefs.current[order] ?? null, entry.score), notes: entry.notes }));
  const problems = scoreProblems(questions, current());
  const shownProblems = problems.filter((problem) => checked || touched.has(`${problem.field}-${problem.order}`));

  useEffect(() => {
    if (refusal || (checked && problems.length > 0)) alertRef.current?.focus();
    // Only when a save has just been answered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refusal, checked]);

  function setEntry(order: number, change: Partial<Entry>) {
    setEntries((all) => all.map((entry, index) => (index === order ? { ...entry, ...change } : entry)));
    setNotice(null);
  }

  /** Moves to an address given whole; the router is told its path and its query apart. */
  function go(address: string, replace = false) {
    const url = new URL(address, "http://this.app");
    void navigate({ to: url.pathname as never, search: Object.fromEntries(url.searchParams.entries()) as never, replace });
  }

  async function save(then: "stay" | "next" | "previous") {
    if (busy) return;
    setBusy(true);
    setRefusal(null);
    const scores = current();
    const answer = editing
      ? await saveEvaluation(program, proponent.id, account.id, scores)
      : await startEvaluation(program, proponent.id, scores);
    setBusy(false);
    if (answer.kind !== "saved") {
      setRefusal(answer);
      return;
    }
    if (then === "stay") {
      if (!editing) {
        // The draft now exists: carry on at its own address, showing what was saved.
        go(`${evaluationAddress(program, opportunity.id, proponent.id, account.id)}?saved=draft`, true);
        return;
      }
      setChecked(true);
      setNotice("saved");
      return;
    }
    const target = then === "next" ? place.next : place.previous;
    const held = target ? own.some((entry) => entry.proposal.id === target.id) : false;
    go(target ? evaluationAddress(program, opportunity.id, target.id, held ? account.id : null) : listAddress(program, opportunity.id));
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save("next");
  }

  return (
    <Stack gap="large">
      <Heading1 kind={editing ? editTitle(program) : createTitle(program)} proponent={proponent} />
      <OpportunityLine opportunity={opportunity} proponent={proponent} />
      {editing ? (
        <Text elementType="p">
          Status:{" "}
          <span style={badge} data-testid="evaluation-status">
            {evaluationStatusLabel({ status: "DRAFT", scores: current() }, questions)}
          </span>
        </Text>
      ) : null}
      <div>
        <Link href={listAddress(program, opportunity.id)}>Back to your evaluations</Link>
      </div>
      <Text elementType="p">
        Score each question between 0 and its maximum, with up to two decimal places, and explain each score in a comment. Your draft is
        saved as you move between proponents. Nothing is shared until you submit your scores for consensus.
      </Text>
      {refusal?.kind === "duplicate" ? (
        <>
          <div tabIndex={-1} ref={alertRef} data-testid="evaluation-duplicate-error">
            <InlineAlert variant="danger" role="alert" title="This evaluation was not started" description={refusal.reason} />
          </div>
          <div>
            <Link href={evaluationAddress(program, opportunity.id, proponent.id, account.id)}>
              Go to your evaluation of {proponent.anonymousProponentName}
            </Link>
          </div>
        </>
      ) : refusal ? (
        <div tabIndex={-1} ref={alertRef}>
          <InlineAlert
            variant="danger"
            role="alert"
            title="This evaluation was not saved"
            description={refusal.kind === "refused" ? refusal.reasons.join(" ") : "The service could not save it. Try again."}
          />
        </div>
      ) : checked && problems.length > 0 ? (
        <div tabIndex={-1} ref={alertRef}>
          <InlineAlert variant="danger" title={`This evaluation has ${problems.length} ${problems.length === 1 ? "problem" : "problems"}`} role="alert">
            <Text elementType="p">
              {editing ? "Your changes were saved as you entered them." : "Your draft was saved as you entered it."} Your scores cannot be submitted
              until these are fixed.
            </Text>
            <ul>
              {problems.map((problem) => (
                <li key={`${problem.field}-${problem.order}`} data-testid="field-error">
                  <Link
                    href={`#question-${problem.order + 1}-${problem.field}`}
                    data-testid={problem.field === "score" ? "evaluation-score-error" : "evaluation-notes-error"}
                  >
                    {summaryLine(problem)}
                  </Link>
                </li>
              ))}
            </ul>
          </InlineAlert>
        </div>
      ) : notice === "saved" ? (
        <div role="status">
          <InlineAlert variant="success" title="Saved" description="Your evaluation has been saved." />
        </div>
      ) : null}
      <Form validationBehavior="aria" onSubmit={onSubmit}>
        <Stack gap="medium">
          {questions.map((question, order) => {
            const n = order + 1;
            const scoreProblem = shownProblems.find((problem) => problem.order === order && problem.field === "score");
            const notesProblem = shownProblems.find((problem) => problem.order === order && problem.field === "notes");
            const answer = proponent.responses.find((entry) => entry.order === order)?.response ?? "";
            return (
              <fieldset key={order} style={group} id={`question-${n}`}>
                <legend style={legend}>Question {n}</legend>
                <Stack gap="medium">
                  <Text elementType="p">{question.question}</Text>
                  <Text elementType="p" size="small" color="secondary">
                    Worth up to {question.score} points.
                    {question.minimumScore !== null ? ` The minimum score to move on is ${question.minimumScore}.` : ""}
                  </Text>
                  <div style={response} data-testid="evaluation-question-response">
                    <Stack gap="small">
                      <Text elementType="p" size="small" color="secondary">
                        {proponent.anonymousProponentName}'s response
                      </Text>
                      <Text elementType="p">{answer}</Text>
                    </Stack>
                  </div>
                  <div
                    ref={(element) => {
                      scoreRefs.current[order] = element;
                    }}
                  >
                    <NumberField
                      id={`question-${n}-score`}
                      label={`Score for question ${n}`}
                      isRequired
                      description={`Between 0 and ${question.score}, with up to two decimal places.`}
                      value={entries[order]?.score ?? Number.NaN}
                      formatOptions={{ maximumFractionDigits: 20, useGrouping: false }}
                      onChange={(value) => setEntry(order, { score: value })}
                      onBlur={() => setTouched((all) => new Set(all).add(`score-${order}`))}
                      isInvalid={scoreProblem !== undefined}
                      errorMessage={scoreProblem?.message}
                      data-testid="evaluation-question-score-field"
                    />
                  </div>
                  <TextArea
                    id={`question-${n}-notes`}
                    label={`Comment for question ${n}`}
                    isRequired
                    description="At least one word, explaining the score."
                    value={entries[order]?.notes ?? ""}
                    onChange={(value) => setEntry(order, { notes: value })}
                    onBlur={() => setTouched((all) => new Set(all).add(`notes-${order}`))}
                    isInvalid={notesProblem !== undefined}
                    errorMessage={notesProblem?.message}
                    data-testid="evaluation-question-notes-field"
                  />
                </Stack>
              </fieldset>
            );
          })}
          <ButtonGroup ariaLabel="Evaluation actions">
            <Button variant="secondary" isDisabled={busy} onPress={() => void save("previous")} data-testid="evaluation-save-previous">
              Save and go to previous proponent
            </Button>
            <Button
              variant="secondary"
              isDisabled={busy}
              onPress={() => void save("stay")}
              data-testid={editing ? "evaluation-save-changes" : "evaluation-save-draft"}
            >
              {editing ? "Save changes" : "Save draft"}
            </Button>
            <Button type="submit" variant="primary" isDisabled={busy} data-testid="evaluation-save-next">
              Save and go to next proponent
            </Button>
          </ButtonGroup>
        </Stack>
      </Form>
    </Stack>
  );
}

/**
 * An evaluation shown and not offered for change: the person's own once submitted (R-5.24), or
 * another evaluator's, beside their name, once the reader may see it (R-5.28).
 */
function EvaluationShown({
  program,
  account,
  opportunity,
  proponent,
  evaluation,
  own,
}: {
  program: OtherProgram;
  account: Account;
  opportunity: OtherProgramOpportunity;
  proponent: Proponent;
  evaluation: Evaluation;
  own: readonly Evaluation[];
}) {
  const mine = evaluation.evaluator.id === account.id;
  const questions = opportunity.questions;
  const next = placeOf(opportunity, proponent).next;
  const nextHeld = next ? own.some((entry) => entry.proposal.id === next.id) : false;
  return (
    <Stack gap="large">
      <Heading1 kind={editTitle(program)} proponent={proponent} />
      <OpportunityLine opportunity={opportunity} proponent={proponent} />
      {mine ? null : <Text elementType="p">Evaluator: {evaluation.evaluator.name}</Text>}
      <Text elementType="p">
        Status:{" "}
        <span style={badge} data-testid="evaluation-status">
          {evaluationStatusLabel(evaluation, questions)}
        </span>
      </Text>
      <div>
        <Link href={mine ? listAddress(program, opportunity.id) : `/opportunities/${program}/${opportunity.id}/edit`}>
          {mine ? "Back to your evaluations" : "Back to the opportunity"}
        </Link>
      </div>
      {evaluation.status === "SUBMITTED" ? (
        <div data-testid="evaluation-read-only-notice">
          <InlineAlert variant="info" title="This evaluation has been submitted" description="Submitted scores and comments cannot be changed." />
        </div>
      ) : null}
      <Stack gap="medium">
        {questions.map((question, order) => {
          const stored = evaluation.scores.find((score) => score.order === order);
          return (
            <section key={order} style={group} aria-labelledby={`question-${order + 1}-heading`}>
              <Stack gap="medium">
                <Heading level={2} id={`question-${order + 1}-heading`}>
                  Question {order + 1}
                </Heading>
                <Text elementType="p">{question.question}</Text>
                <Stack as="dl" direction="row" gap="medium">
                  <Stack gap="small">
                    <dt style={term}>{mine ? "Your score" : "Score"}</dt>
                    <dd>{typeof stored?.score === "number" ? `${stored.score} out of ${question.score}` : "Not entered"}</dd>
                  </Stack>
                  <Stack gap="small">
                    <dt style={term}>{mine ? "Your comment" : "Comment"}</dt>
                    <dd>{stored?.notes ? stored.notes : "Not entered"}</dd>
                  </Stack>
                </Stack>
              </Stack>
            </section>
          );
        })}
      </Stack>
      {mine && next && (nextHeld || opportunity.status === "EVAL_QUESTIONS_INDIVIDUAL") ? (
        <div>
          <Link href={evaluationAddress(program, opportunity.id, next.id, nextHeld ? account.id : null)}>
            Next proponent: {next.anonymousProponentName}
          </Link>
        </div>
      ) : null}
    </Stack>
  );
}
