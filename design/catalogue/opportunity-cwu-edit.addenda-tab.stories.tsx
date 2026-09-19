import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Form, Heading, Link, Text, TextArea } from "@bcgov/design-system-react-components";

// opportunity-cwu-edit · addenda-tab — the addenda so far, and a new one being added; an addendum is permanent and
// notifies watchers, proponents and the author (R-1.32, R-1.35)
const meta: Meta = { title: "opportunities/opportunity-cwu-edit/addenda-tab" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tight = { display: "grid", gap: "var(--layout-margin-small)" } as const;
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
const base = "/opportunities/code-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000101/edit";

export const AddendaTab: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Manage a Code With Us opportunity</Text>
      <Heading level={1}>Build an accessible permit tracker</Heading>
      <div style={row}>
        <Text elementType="p">Status: <span style={badge} data-testid="opportunity-status">Published</span></Text>
        <Text elementType="p" size="small" color="secondary">
          Opportunity ID: <span data-testid="opportunity-identifier">7c1e2d40-5b1a-4c2e-9d3f-000000000101</span>
        </Text>
      </div>
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="secondary" danger data-testid="opportunity-cancel-button">Cancel opportunity</Button>
      </ButtonGroup>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`} data-testid="opportunity-tab-summary">Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`} aria-current="page" data-testid="opportunity-tab-addenda">Addenda</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="opportunity-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Addenda</Heading>
        <article aria-labelledby="addendum-1" style={tight}>
          <Heading level={3} id="addendum-1">Addendum of September 20, 2026</Heading>
          <Text elementType="p" size="small" color="secondary">Added by Test Public Servant</Text>
          <Text elementType="p">The kick-off meeting will be held by video, not in person.</Text>
        </article>
        <Form validationBehavior="aria" style={stack}>
          <TextArea label="New addendum" isRequired maxLength={5000} description="Up to 5,000 characters." data-testid="addendum-text-field" />
          <Text elementType="p">
            An addendum cannot be changed or removed once it is added. Everyone watching this opportunity, everyone who has
            submitted a proposal, and its author will be emailed.
          </Text>
          <div>
            <Button type="submit" variant="primary" data-testid="addendum-add-button">Add addendum</Button>
          </div>
        </Form>
      </section>
    </div>
  ),
};
