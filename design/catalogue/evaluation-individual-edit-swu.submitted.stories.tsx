import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, InlineAlert, Link, Text } from "@bcgov/design-system-react-components";

// evaluation-individual-edit-swu · submitted — once submitted the evaluation is shown, not offered for editing, and has
// no save controls at all (R-5.24)
const meta: Meta = { title: "evaluation/evaluation-individual-edit-swu/submitted" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;
const group = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;

const questions = [
  { n: 1, text: "Describe how your team would approach user research for the renewal service.", max: 5, score: "4", notes: "Clear plan with named methods and both user groups." },
  { n: 2, text: "Describe a time your team replaced a legacy system without interrupting service.", max: 10, score: "7.5", notes: "Staged cut-over is credible; rollback is not described." },
];

export const Submitted: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Sprint With Us evaluation</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 2</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="evaluation-status">Submitted</span></Text>
      <div>
        <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit?tab=evaluation">Back to your evaluations</Link>
      </div>
      <div data-testid="evaluation-read-only-notice">
        <InlineAlert
          variant="info"
          title="This evaluation has been submitted"
          description="Submitted scores and comments cannot be changed."
        />
      </div>
      <div style={stack}>
        {questions.map((q) => (
          <section key={q.n} style={group} aria-labelledby={`question-${q.n}-heading`}>
            <Heading level={2} id={`question-${q.n}-heading`}>Question {q.n}</Heading>
            <Text elementType="p">{q.text}</Text>
            <dl style={facts}>
              <div style={fact}>
                <dt style={term}>Your score</dt>
                <dd style={detail}>{q.score} out of {q.max}</dd>
              </div>
              <div style={fact}>
                <dt style={term}>Your comment</dt>
                <dd style={detail}>{q.notes}</dd>
              </div>
            </dl>
          </section>
        ))}
      </div>
      <div>
        <Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3b8d6f20-1a2b-4c3d-8e9f-000000000613/team-questions/evaluations/5e0f7a10-2c3d-4e5f-8a9b-000000000402/edit">
          Next proponent: Proponent 3
        </Link>
      </div>
    </div>
  ),
};
