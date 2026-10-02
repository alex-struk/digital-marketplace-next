import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, Link, NumberField, Text, TextArea } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// evaluation-individual-edit-twu · default — the evaluator's own draft, which they may change while it is a draft and the
// opportunity is still in individual evaluation (R-5.24, R-5.35)
const meta: Meta = { title: "evaluation/evaluation-individual-edit-twu/default" };
export default meta;

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

const questions = [
  {
    n: 1,
    text: "Describe how you would join an existing data platform team and start contributing.",
    max: 5,
    min: 3,
    response: "In the first week I would pair with each engineer on the team, read the runbooks, and take one small operational ticket end to end.",
    score: 4,
    notes: "Concrete first-week plan that respects the existing team.",
  },
  {
    n: 2,
    text: "Describe a time you improved the reliability of a data pipeline.",
    max: 10,
    min: 6,
    response: "I added idempotent loads and alerting on late partitions to a nightly pipeline, which cut missed reports from several a month to none.",
    score: 8,
    notes: "Measured outcome and a specific technique.",
  },
];

export const Default: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Team With Us evaluation</Text>
          <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 2</span></Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p">Data platform team</Text>
          <Text elementType="p" size="small" color="secondary">Proponent 2 of 3</Text>
        </Stack>
        <Text elementType="p">Status: <span style={badge} data-testid="evaluation-status">Draft: complete</span></Text>
        <div>
          <Link href="/opportunities/team-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000301/edit?tab=evaluation">Back to your evaluations</Link>
        </div>
        <Form validationBehavior="aria">
          <Stack gap="medium">
            {questions.map((q) => (
              <fieldset key={q.n} style={group} id={`question-${q.n}`}>
                <legend style={legend}>Question {q.n}</legend>
                <Stack gap="medium">
                  <Text elementType="p">{q.text}</Text>
                  <Text elementType="p" size="small" color="secondary">Worth up to {q.max} points. The minimum score to move on is {q.min}.</Text>
                  <div style={response} data-testid="evaluation-question-response">
                    <Stack gap="small">
                      <Text elementType="p" size="small" color="secondary">Proponent 2's response</Text>
                      <Text elementType="p">{q.response}</Text>
                    </Stack>
                  </div>
                  <NumberField
                    id={`question-${q.n}-score`}
                    label={`Score for question ${q.n}`}
                    isRequired
                    description={`Between 0 and ${q.max}, with up to two decimal places.`}
                    defaultValue={q.score}
                    data-testid="evaluation-question-score-field"
                  />
                  <TextArea
                    id={`question-${q.n}-notes`}
                    label={`Comment for question ${q.n}`}
                    isRequired
                    description="At least one word, explaining the score."
                    defaultValue={q.notes}
                    data-testid="evaluation-question-notes-field"
                  />
                </Stack>
              </fieldset>
            ))}
            <ButtonGroup ariaLabel="Evaluation actions">
              <Button variant="secondary" data-testid="evaluation-save-previous">Save and go to previous proponent</Button>
              <Button variant="secondary" data-testid="evaluation-save-changes">Save changes</Button>
              <Button type="submit" variant="primary" data-testid="evaluation-save-next">Save and go to next proponent</Button>
            </ButtonGroup>
          </Stack>
        </Form>
      </Stack>
    </PageContainer>
  ),
};
