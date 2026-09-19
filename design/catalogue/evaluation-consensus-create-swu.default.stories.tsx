import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, Link, NumberField, Text, TextArea } from "@bcgov/design-system-react-components";

// evaluation-consensus-create-swu · default — the chair records the agreed scores for a proponent, with every evaluator's
// scores and comments beside their names under each question (R-5.28, R-5.29)
const meta: Meta = { title: "evaluation/evaluation-consensus-create-swu/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--layout-margin-medium)" } as const;
const group = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;
const response = {
  display: "grid",
  gap: "var(--layout-margin-xsmall)",
  padding: "var(--layout-padding-small)",
  borderInlineStart: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
} as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

// Illustrative questions, responses and evaluators' scores.
const questions = [
  {
    n: 1,
    text: "Describe how your team would approach user research for the renewal service.",
    max: 5,
    min: 3,
    response: "We would begin with two weeks of interviews with people renewing a licence and the staff who process renewals, then test paper prototypes with both groups before building anything.",
    panel: [
      { who: "Test Evaluator One", score: "4", notes: "Clear plan with named methods and both user groups." },
      { who: "Test Evaluator Two", score: "3.5", notes: "Sound approach, light on accessibility research." },
    ],
  },
  {
    n: 2,
    text: "Describe a time your team replaced a legacy system without interrupting service.",
    max: 10,
    min: 6,
    response: "We moved a permit service to a new platform in stages, running both side by side for six weeks and switching one office at a time.",
    panel: [
      { who: "Test Evaluator One", score: "7.5", notes: "Staged cut-over is credible; rollback is not described." },
      { who: "Test Evaluator Two", score: "8", notes: "Good evidence of running systems side by side." },
    ],
  },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Agree a Sprint With Us consensus</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 3</span></Heading>
      <div style={row}>
        <Text elementType="p">Modernize the licence renewal service</Text>
        <Text elementType="p" size="small" color="secondary">Proponent 3 of 3</Text>
      </div>
      <div>
        <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit?tab=consensus">Back to the consensus</Link>
      </div>
      <Text elementType="p">
        Record the score and comment the panel agreed for each question. Each evaluator's own score and comment is shown with the
        question. A consensus is checked when you submit the final consensus scores.
      </Text>
      <Form validationBehavior="aria" style={stack}>
        {questions.map((q) => (
          <fieldset key={q.n} style={group} id={`question-${q.n}`}>
            <legend style={legend}>Question {q.n}</legend>
            <Text elementType="p">{q.text}</Text>
            <Text elementType="p" size="small" color="secondary">Worth up to {q.max} points. The minimum score to move on is {q.min}.</Text>
            <div style={response} data-testid="evaluation-question-response">
              <Text elementType="p" size="small" color="secondary">Proponent 3's response</Text>
              <Text elementType="p">{q.response}</Text>
            </div>
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
              data-testid="evaluation-question-score-field"
            />
            <TextArea
              id={`question-${q.n}-notes`}
              label={`Agreed comment for question ${q.n}`}
              isRequired
              description="At least one word, explaining the score."
              data-testid="evaluation-question-notes-field"
            />
          </fieldset>
        ))}
        <ButtonGroup ariaLabel="Consensus actions">
          <Button variant="secondary" data-testid="evaluation-save-draft">Save draft</Button>
          <Button type="submit" variant="primary" data-testid="evaluation-save-next">Save and go to next proponent</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
