import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-consensus-create-swu · chair-only — a panel member who is not the chair opens the page during consensus. They
// may read every evaluator's scores from the consensus stage on (R-5.28) but not record the agreed score (R-5.29)
const meta: Meta = { title: "evaluation/evaluation-consensus-create-swu/chair-only" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const group = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

const questions = [
  {
    n: 1,
    text: "Describe how your team would approach user research for the renewal service.",
    max: 5,
    panel: [
      { who: "Test Evaluator One", score: "4", notes: "Clear plan with named methods and both user groups." },
      { who: "Test Evaluator Two", score: "3.5", notes: "Sound approach, light on accessibility research." },
    ],
  },
  {
    n: 2,
    text: "Describe a time your team replaced a legacy system without interrupting service.",
    max: 10,
    panel: [
      { who: "Test Evaluator One", score: "7.5", notes: "Staged cut-over is credible; rollback is not described." },
      { who: "Test Evaluator Two", score: "8", notes: "Good evidence of running systems side by side." },
    ],
  },
];

export const ChairOnly: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Agree a Sprint With Us consensus</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 3</span></Heading>
      <div>
        <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit?tab=evaluation">Back to your evaluations</Link>
      </div>
      <div data-testid="evaluation-chair-only-message">
        <InlineAlert
          variant="info"
          title="Only the chair records the consensus"
          description="You can read each evaluator's scores and comments for this proponent. The panel's chair records the agreed score."
        />
      </div>
      <div style={stack}>
        {questions.map((q) => (
          <section key={q.n} style={group} aria-labelledby={`question-${q.n}-heading`}>
            <Heading level={2} id={`question-${q.n}-heading`}>Question {q.n}</Heading>
            <Text elementType="p">{q.text}</Text>
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
          </section>
        ))}
      </div>
    </div>
  ),
};
