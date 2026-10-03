import { useEffect, useRef, useState } from "react";
import { Button, ButtonGroup, Checkbox, Form, InlineAlert, Link, Select, Text } from "@bcgov/design-system-react-components";
import { PANEL_NO_CHAIR, PANEL_TOO_SMALL, otherProblemFromLine, panelMayChange, panelRoleLabel } from "@rules/other-program-content";
import type { OtherProgram } from "@rules/other-program-drafts";
import type { OpportunityStatus } from "@rules/opportunities";
import { OtherProgramSaveAnswer, PanelCandidate, PanelEntry, PanelMember } from "../api/other-programs";
import { card } from "../app/layout";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";

/**
 * The Evaluation panel tab of a Sprint With Us or Team With Us opportunity's manage page
 * (evaluation-panel-swu, evaluation-panel-twu), offered to its author and administrators only
 * (R-5.18). Until the consensus stage it is a form: one row per evaluator with a Chair tick, then a
 * Chair field that may name someone who chairs without evaluating — one fact shown in two places,
 * so the panel never holds two chairs. Saving checks, in this order, that the panel has at least
 * two members, names nobody twice and has a chair (R-5.1, R-5.9); the service checks again,
 * including that everyone named is a public sector employee, and a panel it refuses is not saved
 * (R-5.37). From the consensus stage the panel is fixed and listed (R-1.43, R-5.16).
 */

const group = { ...card, margin: "var(--layout-margin-none)" } as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

const PROGRAM_STEPS: Readonly<Record<OtherProgram, string>> = {
  "sprint-with-us": "team questions",
  "team-with-us": "resource questions",
};

/** One problem with the panel: what the summary says, where it links, and the test id it carries. */
interface PanelProblem {
  readonly text: string;
  readonly target: string;
  readonly testId?: string;
  /** The evaluator row it belongs to, from 1, or "chair", or "group". */
  readonly at: number | "chair" | "group";
  readonly fieldMessage: string;
}

/** The panel as it is sent: each evaluator, and a chair who does not evaluate after them. */
export function panelEntriesOf(evaluators: readonly string[], chair: string): PanelEntry[] {
  const entries = evaluators.map((user) => ({ user, evaluator: true, chair: user !== "" && user === chair }));
  if (chair !== "" && !evaluators.includes(chair)) entries.push({ user: chair, evaluator: false, chair: true });
  return entries;
}

/** What the form checks before sending: at least two members, nobody twice, a chair (design order). */
export function panelFormProblems(evaluators: readonly string[], chair: string, nameOf: (id: string) => string): PanelProblem[] {
  const problems: PanelProblem[] = [];
  const members = panelEntriesOf(evaluators, chair);
  if (members.length < 2) {
    problems.push({
      text: "Evaluation panel: name at least two members",
      target: "panel-minimum-error",
      testId: "evaluation-panel-minimum-error",
      at: "group",
      fieldMessage: "The panel needs at least two members. Add another evaluator.",
    });
  }
  const seen = new Set<string>();
  evaluators.forEach((user, index) => {
    const number = index + 1;
    if (user === "") {
      problems.push({
        text: `Evaluator ${number}: choose a public sector employee`,
        target: `panel-member-${number}`,
        at: number,
        fieldMessage: "Choose a public sector employee.",
      });
      return;
    }
    if (seen.has(user)) {
      problems.push({
        text: `Evaluator ${number}: ${nameOf(user)} is already on the panel`,
        target: `panel-member-${number}`,
        testId: "evaluation-panel-duplicate-error",
        at: number,
        fieldMessage: `${nameOf(user)} is already on the panel. Choose a different person.`,
      });
    }
    seen.add(user);
  });
  if (chair === "") {
    problems.push({
      text: "Chair: choose a chair for the panel",
      target: "panel-chair",
      testId: "evaluation-panel-missing-chair-error",
      at: "chair",
      fieldMessage: PANEL_NO_CHAIR,
    });
  }
  return problems;
}

/** The service's refusal of a panel, placed where the form shows each problem. */
export function panelRefusalProblems(reasons: readonly string[], evaluatorCount: number): { problems: PanelProblem[]; rest: string[] } {
  const problems: PanelProblem[] = [];
  const rest: string[] = [];
  for (const reason of reasons) {
    const problem = otherProblemFromLine(reason);
    if (!problem || problem.field !== "evaluationPanel") {
      rest.push(reason);
      continue;
    }
    const message = problem.message;
    const member = /^Panel member (\d+): (.*)$/s.exec(message);
    if (member) {
      const place = Number(member[1]);
      const said = member[2] as string;
      const row = place <= evaluatorCount ? place : null;
      const testId = said.includes("is not a public sector employee")
        ? "evaluation-panel-not-public-sector-error"
        : said.includes("is already on the panel")
          ? "evaluation-panel-duplicate-error"
          : undefined;
      problems.push({
        text: row ? `Evaluator ${row}: ${said.replace(/\.$/, "")}` : `Chair: ${said.replace(/\.$/, "")}`,
        target: row ? `panel-member-${row}` : "panel-chair",
        testId,
        at: row ?? "chair",
        fieldMessage: said,
      });
    } else if (message === PANEL_TOO_SMALL) {
      problems.push({
        text: "Evaluation panel: name at least two members",
        target: "panel-minimum-error",
        testId: "evaluation-panel-minimum-error",
        at: "group",
        fieldMessage: "The panel needs at least two members. Add another evaluator.",
      });
    } else if (message === PANEL_NO_CHAIR) {
      problems.push({
        text: "Chair: choose a chair for the panel",
        target: "panel-chair",
        testId: "evaluation-panel-missing-chair-error",
        at: "chair",
        fieldMessage: PANEL_NO_CHAIR,
      });
    } else {
      problems.push({ text: `Evaluation panel: ${message.replace(/\.$/, "")}`, target: "panel-chair", at: "group", fieldMessage: message });
    }
  }
  return { problems, rest };
}

export function EvaluationPanelTab({
  program,
  status,
  panel,
  candidates,
  onSave,
}: {
  readonly program: OtherProgram;
  readonly status: OpportunityStatus;
  readonly panel: readonly PanelMember[];
  readonly candidates: readonly PanelCandidate[];
  readonly onSave: (panel: readonly PanelEntry[]) => Promise<OtherProgramSaveAnswer>;
}) {
  const intro = (
    <>
      <Text elementType="p">
        {`Once the opportunity closes, each evaluator scores every proponent's ${PROGRAM_STEPS[program]} on their own. The chair then records one agreed score for each proponent.`}
      </Text>
    </>
  );
  if (!panelMayChange(status)) {
    return (
      <>
        <div data-testid="evaluation-panel-locked-message">
          <InlineAlert
            variant="info"
            title="The evaluation panel can no longer be changed"
            description="The consensus stage has begun, so the panel is fixed."
          />
        </div>
        <div role="region" aria-labelledby="panel-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption id="panel-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">
                Members of the evaluation panel
              </Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>
                  Name
                </th>
                <th scope="col" style={cell}>
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {panel.map((member) => (
                <tr key={member.user.id} data-testid="evaluation-panel-member-row">
                  <td style={cell}>{member.user.name}</td>
                  <td style={cell}>{panelRoleLabel(member)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }
  return (
    <>
      {intro}
      <Text elementType="p">
        The panel needs at least two members, each a public sector employee named once, and one chair. The chair can be one of the
        evaluators, or someone who chairs without evaluating. The panel can be changed until the consensus stage begins. People you add
        are told when you save, unless the opportunity is still a draft.
      </Text>
      <PanelForm panel={panel} candidates={candidates} onSave={onSave} />
    </>
  );
}

function PanelForm({
  panel,
  candidates,
  onSave,
}: {
  readonly panel: readonly PanelMember[];
  readonly candidates: readonly PanelCandidate[];
  readonly onSave: (panel: readonly PanelEntry[]) => Promise<OtherProgramSaveAnswer>;
}) {
  const [evaluators, setEvaluators] = useState<readonly string[]>(() => {
    const listed = panel.filter((member) => member.evaluator).map((member) => member.user.id);
    return listed.length > 0 ? listed : [""];
  });
  const [chair, setChair] = useState(() => panel.find((member) => member.chair)?.user.id ?? "");
  const [problems, setProblems] = useState<readonly PanelProblem[]>([]);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (problems.length > 0 || refusal) summaryRef.current?.focus();
  }, [problems, refusal]);

  // Everyone on the panel is offered, even someone the list no longer names, so nothing is lost.
  const items = [
    ...candidates,
    ...panel.filter((member) => !candidates.some((candidate) => candidate.id === member.user.id)).map((member) => ({ id: member.user.id, label: member.user.name })),
  ];
  const nameOf = (id: string) => items.find((item) => item.id === id)?.label ?? "This person";
  const problemAt = (at: PanelProblem["at"]) =>
    problems
      .filter((problem) => problem.at === at)
      .map((problem) => problem.fieldMessage)
      .join(" ");

  async function save() {
    if (sending) return;
    setSaved(false);
    setRefusal(null);
    const found = panelFormProblems(evaluators, chair, nameOf);
    setProblems(found);
    if (found.length > 0) return;
    setSending(true);
    const answer = await onSave(panelEntriesOf(evaluators, chair));
    setSending(false);
    if (answer.kind === "saved") {
      setSaved(true);
      return;
    }
    if (answer.kind === "refused") {
      const placed = panelRefusalProblems(answer.reasons, evaluators.length);
      setProblems(placed.problems);
      if (placed.rest.length > 0) setRefusal(placed.rest.join(" "));
      return;
    }
    setRefusal("The service could not save the panel. Try again.");
  }

  const count = problems.length;
  return (
    <>
      {count > 0 || refusal ? (
        <div tabIndex={-1} ref={summaryRef}>
          <TitledAlert
            variant="danger"
            role="alert"
            title={count > 0 ? `The evaluation panel has ${count} ${count === 1 ? "problem" : "problems"}` : "The evaluation panel was not saved"}
          >
            <Text elementType="p">The panel was not saved. It is still the panel it was before.</Text>
            {refusal ? <Text elementType="p">{refusal}</Text> : null}
            {count > 0 ? (
              <ul>
                {problems.map((problem, index) => (
                  <li key={`${problem.target}-${index}`} data-testid="field-error">
                    <Link href={`#${problem.target}`} data-testid={problem.testId}>
                      {problem.text}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </TitledAlert>
        </div>
      ) : null}
      <div role="status">{saved ? <Text elementType="p">The evaluation panel has been saved.</Text> : null}</div>
      <Form
        validationBehavior="aria"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Stack gap="medium">
          {evaluators.map((user, index) => {
            const number = index + 1;
            const problem = problemAt(number);
            return (
              <fieldset key={index} style={group} id={`panel-member-${number}`} data-testid="evaluation-panel-member-row">
                <legend style={legend}>{`Evaluator ${number}`}</legend>
                <Stack gap="medium">
                  <Select
                    label="Public sector employee"
                    items={items}
                    isRequired
                    value={user === "" ? null : user}
                    onChange={(key) => {
                      const next = key === null ? "" : String(key);
                      setEvaluators((current) => current.map((entry, at) => (at === index ? next : entry)));
                      // The chair moves with the row it was ticked on.
                      if (chair !== "" && chair === user) setChair(next);
                    }}
                    isInvalid={problem !== ""}
                    errorMessage={problem || undefined}
                    data-testid="evaluation-panel-member-field"
                  />
                  <Checkbox
                    isSelected={user !== "" && user === chair}
                    isDisabled={user === ""}
                    onChange={(ticked) => setChair(ticked ? user : "")}
                    aria-label={`Chair: evaluator ${number}`}
                    data-testid="evaluation-panel-member-chair"
                  >
                    Chair
                  </Checkbox>
                  <div>
                    <Button
                      variant="tertiary"
                      size="small"
                      aria-label={`Remove evaluator ${number}`}
                      onPress={() => {
                        if (user !== "" && user === chair && evaluators.filter((entry) => entry === user).length === 1) setChair("");
                        setEvaluators((current) => current.filter((_, at) => at !== index));
                      }}
                      data-testid="evaluation-panel-remove-member"
                    >
                      Remove
                    </Button>
                  </div>
                </Stack>
              </fieldset>
            );
          })}
          {problemAt("group") ? (
            <div id="panel-minimum-error">
              <Text elementType="p" color="danger">
                {problemAt("group")}
              </Text>
            </div>
          ) : null}
          <div>
            <Button variant="secondary" onPress={() => setEvaluators((current) => [...current, ""])} data-testid="evaluation-panel-add-member">
              Add an evaluator
            </Button>
          </div>
          <Select
            id="panel-chair"
            label="Chair"
            items={items}
            isRequired
            description="Choose one of the evaluators above, or a public sector employee who will chair without evaluating. Ticking Chair against an evaluator chooses them here too."
            value={chair === "" ? null : chair}
            onChange={(key) => setChair(key === null ? "" : String(key))}
            isInvalid={problemAt("chair") !== ""}
            errorMessage={problemAt("chair") || undefined}
            data-testid="evaluation-panel-chair-field"
          />
          <ButtonGroup ariaLabel="Evaluation panel actions">
            <Button type="submit" variant="primary" isDisabled={sending} data-testid="evaluation-panel-save">
              Save evaluation panel
            </Button>
          </ButtonGroup>
        </Stack>
      </Form>
    </>
  );
}
