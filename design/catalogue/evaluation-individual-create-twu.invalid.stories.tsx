import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, NumberField, Text, TextArea } from "@bcgov/design-system-react-components";

// evaluation-individual-create-twu · invalid — a score above the question's maximum, a score with three decimal places and
// an empty comment. The draft is kept as entered; the problems stop the scores being submitted, not saved (R-5.22, R-5.23)
const meta: Meta = { title: "evaluation/evaluation-individual-create-twu/invalid" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
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

const questions = [
  {
    n: 1,
    text: "Describe how you would join an existing data platform team and start contributing.",
    max: 5,
    min: 3,
    response: "In the first week I would pair with each engineer on the team, read the runbooks, and take one small operational ticket end to end.",
    score: 6,
    notes: "Concrete first-week plan that respects the existing team.",
    scoreError: "Enter a score between 0 and 5 for question 1.",
    notesError: "",
  },
  {
    n: 2,
    text: "Describe a time you improved the reliability of a data pipeline.",
    max: 10,
    min: 6,
    response: "I added idempotent loads and alerting on late partitions to a nightly pipeline, which cut missed reports from several a month to none.",
    score: 7.125,
    notes: "",
    scoreError: "Enter a score with no more than two decimal places for question 2.",
    notesError: "Enter a comment for question 2.",
  },
];

export const Invalid: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Evaluate a Team With Us proponent</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 2</span></Heading>
      <Text elementType="p" size="small" color="secondary">
        The opportunity line, position and back link are as in the default story and are trimmed here.
      </Text>
      <div tabIndex={-1}>
        <InlineAlert variant="danger" title="This evaluation has 3 problems" role="alert">
          <Text elementType="p">Your draft was saved as you entered it. Your scores cannot be submitted until these are fixed.</Text>
          <ul>
            <li data-testid="field-error"><Link href="#question-1-score" data-testid="evaluation-score-error">Question 1: enter a score between 0 and 5</Link></li>
            <li data-testid="field-error"><Link href="#question-2-score" data-testid="evaluation-score-error">Question 2: enter a score with no more than two decimal places</Link></li>
            <li data-testid="field-error"><Link href="#question-2-notes" data-testid="evaluation-notes-error">Question 2: enter a comment</Link></li>
          </ul>
        </InlineAlert>
      </div>
      <Form validationBehavior="aria" style={stack}>
        {questions.map((q) => (
          <fieldset key={q.n} style={group} id={`question-${q.n}`}>
            <legend style={legend}>Question {q.n}</legend>
            <Text elementType="p">{q.text}</Text>
            <Text elementType="p" size="small" color="secondary">Worth up to {q.max} points. The minimum score to move on is {q.min}.</Text>
            <div style={response} data-testid="evaluation-question-response">
              <Text elementType="p" size="small" color="secondary">Proponent 2's response</Text>
              <Text elementType="p">{q.response}</Text>
            </div>
            <NumberField
              id={`question-${q.n}-score`}
              label={`Score for question ${q.n}`}
              isRequired
              description={`Between 0 and ${q.max}, with up to two decimal places.`}
              defaultValue={q.score}
              isInvalid={q.scoreError !== ""}
              errorMessage={q.scoreError}
              data-testid="evaluation-question-score-field"
            />
            <TextArea
              id={`question-${q.n}-notes`}
              label={`Comment for question ${q.n}`}
              isRequired
              description="At least one word, explaining the score."
              defaultValue={q.notes}
              isInvalid={q.notesError !== ""}
              errorMessage={q.notesError}
              data-testid="evaluation-question-notes-field"
            />
          </fieldset>
        ))}
        <ButtonGroup ariaLabel="Evaluation actions">
          <Button variant="secondary" data-testid="evaluation-save-previous">Save and go to previous proponent</Button>
          <Button variant="secondary" data-testid="evaluation-save-draft">Save draft</Button>
          <Button type="submit" variant="primary" data-testid="evaluation-save-next">Save and go to next proponent</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
