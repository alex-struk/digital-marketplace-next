import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, NumberField, Text, TextArea } from "@bcgov/design-system-react-components";

// evaluation-individual-edit-swu · invalid — changes saved with a score above the maximum, a score with three decimal
// places and an empty comment. They are kept as entered and stop the scores being submitted (R-5.22, R-5.23)
const meta: Meta = { title: "evaluation/evaluation-individual-edit-swu/invalid" };
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
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;
const legend = { paddingInline: "var(--layout-padding-small)", font: "var(--typography-bold-body)" } as const;

const questions = [
  {
    n: 1,
    text: "Describe how your team would approach user research for the renewal service.",
    max: 5,
    score: 6,
    notes: "Clear plan with named methods and both user groups.",
    scoreError: "Enter a score between 0 and 5 for question 1.",
    notesError: "",
  },
  {
    n: 2,
    text: "Describe a time your team replaced a legacy system without interrupting service.",
    max: 10,
    score: 7.125,
    notes: "",
    scoreError: "Enter a score with no more than two decimal places for question 2.",
    notesError: "Enter a comment for question 2.",
  },
];

export const Invalid: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Sprint With Us evaluation</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 2</span></Heading>
      <Text elementType="p">Status: <span style={badge} data-testid="evaluation-status">Draft: incomplete</span></Text>
      <Text elementType="p" size="small" color="secondary">
        The opportunity line, back link and each proponent's response are as in the default story and are trimmed here.
      </Text>
      <div tabIndex={-1}>
        <InlineAlert variant="danger" title="This evaluation has 3 problems" role="alert">
          <Text elementType="p">Your changes were saved as you entered them. Your scores cannot be submitted until these are fixed.</Text>
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
          <Button variant="secondary" data-testid="evaluation-save-changes">Save changes</Button>
          <Button type="submit" variant="primary" data-testid="evaluation-save-next">Save and go to next proponent</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
