import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, Link, NumberField, Text, TextArea } from "@bcgov/design-system-react-components";

// evaluation-consensus-edit-twu · default — the chair's draft consensus for a proponent, with the evaluators' scores and
// comments beside each question (R-5.28, R-5.29)
const meta: Meta = { title: "evaluation/evaluation-consensus-edit-twu/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const group = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

const questions = [
  {
    n: 1,
    text: "Describe how you would join an existing data platform team and start contributing.",
    max: 5,
    min: 3,
    score: 4,
    notes: "The panel agreed the first-week plan is concrete.",
    panel: [
      { who: "Test Evaluator One", score: "4", notes: "Concrete first-week plan that respects the existing team." },
      { who: "Test Evaluator Two", score: "3.5", notes: "Good plan, but says little about on-call." },
    ],
  },
  {
    n: 2,
    text: "Describe a time you improved the reliability of a data pipeline.",
    max: 10,
    min: 6,
    score: 7.5,
    notes: "The panel agreed the example is strong and measured.",
    panel: [
      { who: "Test Evaluator One", score: "8", notes: "Measured outcome and a specific technique." },
      { who: "Test Evaluator Two", score: "7", notes: "Strong example; scale of the pipeline unclear." },
    ],
  },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Team With Us consensus</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 1</span></Heading>
      <div style={row}>
        <Text elementType="p">Data platform team</Text>
        <Text elementType="p" size="small" color="secondary">Proponent 1 of 3</Text>
      </div>
      <Text elementType="p">Status: <span style={badge} data-testid="evaluation-consensus-status">Draft: complete</span></Text>
      <div>
        <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit?tab=consensus">Back to the consensus</Link>
      </div>
      <Form validationBehavior="aria" style={stack}>
        {questions.map((q) => (
          <fieldset key={q.n} style={group} id={`question-${q.n}`}>
            <legend style={legend}>Question {q.n}</legend>
            <Text elementType="p">{q.text}</Text>
            <Text elementType="p" size="small" color="secondary">Worth up to {q.max} points. The minimum score to move on is {q.min}.</Text>
            <div role="region" aria-labelledby={`question-${q.n}-panel-caption`} tabIndex={0} style={{ overflowX: "auto" }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <caption id={`question-${q.n}-panel-caption`} style={{ textAlign: "start" }}>
                  <Text size="small" color="secondary">Evaluators' scores for question {q.n}</Text>
                </caption>
                <thead>
                  <tr>
                    <th scope="col" style={cell}>Evaluator</th>
                    <th scope="col" style={cell}>Score</th>
                    <th scope="col" style={cell}>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {q.panel.map((p) => (
                    <tr key={p.who}>
                      <td style={cell}>{p.who}</td>
                      <td style={cell} data-testid="evaluation-panel-member-score">{p.score} out of {q.max}</td>
                      <td style={cell} data-testid="evaluation-panel-member-notes">{p.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <NumberField
              id={`question-${q.n}-score`}
              label={`Agreed score for question ${q.n}`}
              isRequired
              description={`Between 0 and ${q.max}, with up to two decimal places.`}
              defaultValue={q.score}
              data-testid="evaluation-question-score-field"
            />
            <TextArea
              id={`question-${q.n}-notes`}
              label={`Agreed comment for question ${q.n}`}
              isRequired
              description="At least one word, explaining the score."
              defaultValue={q.notes}
              data-testid="evaluation-question-notes-field"
            />
          </fieldset>
        ))}
        <ButtonGroup ariaLabel="Consensus actions">
          <Button variant="secondary" data-testid="evaluation-save-changes">Save changes</Button>
          <Button type="submit" variant="primary" data-testid="evaluation-save-next">Save and go to next proponent</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
