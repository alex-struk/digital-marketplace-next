import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Checkbox, Form, Heading, Link, Select, Text } from "@bcgov/design-system-react-components";

// evaluation-panel-swu · default — the opportunity's owner sets the panel of a published opportunity: two evaluators, the
// first also the chair (R-5.1, R-5.9, R-5.16, R-5.17, R-5.18)
const meta: Meta = { title: "evaluation/evaluation-panel-swu/default" };
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
const tabs = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--layout-margin-large)",
  listStyle: "none",
  margin: "var(--layout-margin-none)",
  padding: "var(--layout-padding-none)",
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit";

// Illustrative. The list offers public sector employees only.
const publicServants = [
  { id: "u-ps-2", label: "Test Evaluator One" },
  { id: "u-ps-3", label: "Test Evaluator Two" },
  { id: "u-ps-4", label: "Test Evaluator Three" },
  { id: "u-ps-5", label: "Test Chair" },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Sprint With Us opportunity</Text>
      <Heading level={1}>Modernize the licence renewal service</Heading>
      <div style={row}>
        <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Published</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000201</span>
        </Text>
      </div>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`} data-testid="opportunity-tab-summary">Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
          <li><Link href={`${base}?tab=evaluationPanel`} aria-current="page" data-testid="opportunity-tab-evaluation-panel">Evaluation panel</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Evaluation panel</Heading>
        <Text elementType="p">
          Once the opportunity closes, each evaluator scores every proponent's team questions on their own. The chair then
          records one agreed score for each proponent.
        </Text>
        <Text elementType="p">
          The panel needs at least two members, each a public sector employee named once, and one chair. The chair can be one of
          the evaluators, or someone who chairs without evaluating. The panel can be changed until the consensus stage begins.
          People you add are told when you save, unless the opportunity is still a draft.
        </Text>
        <Form validationBehavior="aria" style={stack}>
          <fieldset style={group} id="panel-member-1" data-testid="evaluation-panel-member-row">
            <legend style={legend}>Evaluator 1</legend>
            <Select label="Public sector employee" items={publicServants} isRequired defaultValue="u-ps-2" data-testid="evaluation-panel-member-field" />
            <Checkbox defaultSelected aria-label="Chair: evaluator 1" data-testid="evaluation-panel-member-chair">Chair</Checkbox>
            <div>
              <Button variant="tertiary" size="small" aria-label="Remove evaluator 1" data-testid="evaluation-panel-remove-member">Remove</Button>
            </div>
          </fieldset>
          <fieldset style={group} id="panel-member-2" data-testid="evaluation-panel-member-row">
            <legend style={legend}>Evaluator 2</legend>
            <Select label="Public sector employee" items={publicServants} isRequired defaultValue="u-ps-3" data-testid="evaluation-panel-member-field" />
            <Checkbox aria-label="Chair: evaluator 2" data-testid="evaluation-panel-member-chair">Chair</Checkbox>
            <div>
              <Button variant="tertiary" size="small" aria-label="Remove evaluator 2" data-testid="evaluation-panel-remove-member">Remove</Button>
            </div>
          </fieldset>
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
