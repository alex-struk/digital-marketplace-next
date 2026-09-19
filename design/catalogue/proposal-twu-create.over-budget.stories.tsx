import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Link, NumberField, Text } from "@bcgov/design-system-react-components";

// proposal-twu-create · over-budget — submitted with hourly rates that, applied at each resource's target allocation
// across the contract, come to more than the opportunity's maximum budget. The refusal names the total and the budget
// and asks for lower rates. The same check runs when a proposal is edited (R-2.10)
const meta: Meta = { title: "proposals/proposal-twu-create/over-budget" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const panel = {
  display: "grid",
  gap: "var(--layout-margin-medium)",
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
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
const rate = { style: "currency", currency: "CAD", currencyDisplay: "narrowSymbol", minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

export const OverBudget: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Create a Team With Us proposal</Heading>
      <Text elementType="p">A draft can be saved with any field blank. Every required field is needed to submit.</Text>
      <div tabIndex={-1}>
        <InlineAlert variant="danger" title="This proposal has 1 problem" role="alert">
          <ul>
            <li data-testid="field-error"><Link href="#proposal-cost-error">Cost: at these rates the contract would cost more than the maximum budget of $900,000</Link></li>
          </ul>
        </InlineAlert>
      </div>
      <Text elementType="p" size="small" color="secondary">
        The opportunity summary, the organization, the rest of each team member's row, the resource questions and the
        attachments are as in the default story and are trimmed here.
      </Text>
      <Form validationBehavior="aria" style={stack}>
        <section aria-labelledby="form-team" style={panel}>
          <Heading level={2} id="form-team">Team</Heading>
          <fieldset style={group}>
            <legend style={legend}>Resource 1: Full stack developer, 100% of full time</legend>
            <NumberField
              id="proposal-resource-1-rate-one"
              label="Hourly rate for Test Developer One"
              isRequired
              description="At least $1."
              formatOptions={rate}
              defaultValue={340}
              aria-describedby="proposal-cost-error"
              data-testid="proposal-hourly-rate-field"
            />
          </fieldset>
          <fieldset style={group}>
            <legend style={legend}>Resource 2: Data professional, 50% of full time</legend>
            <NumberField
              id="proposal-resource-2-rate-two"
              label="Hourly rate for Test Developer Two"
              isRequired
              description="At least $1."
              formatOptions={rate}
              defaultValue={300}
              aria-describedby="proposal-cost-error"
              data-testid="proposal-hourly-rate-field"
            />
          </fieldset>
        </section>
        <section aria-labelledby="form-cost" style={panel}>
          <Heading level={2} id="form-cost">Cost</Heading>
          <Text elementType="p">
            Each hourly rate is applied at its resource's target allocation across the contract, from November 2, 2026 to
            October 29, 2027. The total must not be more than the opportunity's maximum budget.
          </Text>
          <div role="status">
            <Text elementType="p">Estimated cost over the contract: $918,750 of the $900,000 maximum budget.</Text>
          </div>
          <div id="proposal-cost-error">
            <Text elementType="p" color="danger">
              At these rates the contract would cost $918,750, which is more than the opportunity's maximum budget of
              $900,000. Lower one or more hourly rates.
            </Text>
          </div>
        </section>
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="tertiary" data-testid="proposal-cancel">Cancel</Button>
          <Button variant="secondary" data-testid="proposal-save-draft">Save draft</Button>
          <Button type="submit" variant="primary" data-testid="proposal-submit">Submit proposal</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};
