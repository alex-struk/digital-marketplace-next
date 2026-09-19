import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Checkbox, Form, Heading, InlineAlert, Link, Select, Text } from "@bcgov/design-system-react-components";

// evaluation-panel-twu · too-few — Save was pressed with one person on the panel. The rule belongs to the panel as a
// whole, so it is shown after the list of evaluators rather than on a field (R-5.1)
const meta: Meta = { title: "evaluation/evaluation-panel-twu/too-few" };
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

const publicServants = [
  { id: "u-ps-2", label: "Test Evaluator One" },
  { id: "u-ps-3", label: "Test Evaluator Two" },
  { id: "u-ps-4", label: "Test Evaluator Three" },
  { id: "u-ps-5", label: "Test Chair" },
];

export const TooFew: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Team With Us opportunity</Text>
      <Heading level={1}>Data platform team</Heading>
      <Text elementType="p" size="small" color="secondary">
        The status, tabs and introduction are as in the default story and are trimmed here.
      </Text>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Evaluation panel</Heading>
        <div tabIndex={-1}>
          <InlineAlert variant="danger" title="The evaluation panel has 1 problem" role="alert">
            <Text elementType="p">The panel was not saved. It is still the panel it was before.</Text>
            <ul>
              <li data-testid="field-error"><Link href="#panel-minimum-error" data-testid="evaluation-panel-minimum-error">Evaluation panel: name at least two members</Link></li>
            </ul>
          </InlineAlert>
        </div>
        <Form validationBehavior="aria" style={stack}>
          <fieldset style={group} id="panel-member-1" data-testid="evaluation-panel-member-row">
            <legend style={legend}>Evaluator 1</legend>
            <Select label="Public sector employee" items={publicServants} isRequired defaultValue="u-ps-2" data-testid="evaluation-panel-member-field" />
            <Checkbox defaultSelected aria-label="Chair: evaluator 1" data-testid="evaluation-panel-member-chair">Chair</Checkbox>
            <div>
              <Button variant="tertiary" size="small" aria-label="Remove evaluator 1" data-testid="evaluation-panel-remove-member">Remove</Button>
            </div>
          </fieldset>
          <div id="panel-minimum-error">
            <Text elementType="p" color="danger">The panel needs at least two members. Add another evaluator.</Text>
          </div>
          <div>
            <Button variant="secondary" data-testid="evaluation-panel-add-member">Add an evaluator</Button>
          </div>
          <Select
            id="panel-chair"
            label="Chair"
            items={publicServants}
            isRequired
            description="Choose one of the evaluators above, or a public sector employee who will chair without evaluating. Ticking Chair against an evaluator chooses them here too."
            defaultValue="u-ps-2"
            data-testid="evaluation-panel-chair-field"
          />
          <ButtonGroup ariaLabel="Evaluation panel actions">
            <Button type="submit" variant="primary" data-testid="evaluation-panel-save">Save evaluation panel</Button>
          </ButtonGroup>
        </Form>
      </section>
    </div>
  ),
};
