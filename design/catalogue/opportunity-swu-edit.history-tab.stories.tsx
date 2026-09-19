import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, Link, Text, TextArea } from "@bcgov/design-system-react-components";

// opportunity-swu-edit · history-tab — every change of state and every event, and a private note with an attachment
// being added (R-1.4, R-1.30, R-1.32, R-1.33)
const meta: Meta = { title: "opportunities/opportunity-swu-edit/history-tab" };
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
const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit";

const history = [
  { when: "September 21, 2026, 10:00 a.m.", entry: "Note", by: "Test Public Servant", note: "Confirmed the budget with the finance office. Attachment: budget-approval.pdf" },
  { when: "September 20, 2026, 9:12 a.m.", entry: "Addendum added", by: "Test Public Servant", note: "" },
  { when: "September 12, 2026, 2:40 p.m.", entry: "Edited", by: "Test Administrator", note: "" },
  { when: "September 10, 2026, 11:05 a.m.", entry: "Published", by: "Test Administrator", note: "" },
  { when: "September 8, 2026, 3:30 p.m.", entry: "Submitted for review", by: "Test Public Servant", note: "" },
];

export const HistoryTab: StoryObj = {
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
      <ButtonGroup ariaLabel="Opportunity actions">
        <Button variant="secondary" data-testid="opportunity-edit-button">Edit</Button>
        <Button variant="secondary" danger data-testid="opportunity-cancel-button">Cancel opportunity</Button>
      </ButtonGroup>
      <nav aria-label="Opportunity sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=summary`} data-testid="opportunity-tab-summary">Summary</Link></li>
          <li><Link href={`${base}?tab=opportunity`} data-testid="opportunity-tab-opportunity">Opportunity</Link></li>
          <li><Link href={`${base}?tab=addenda`} data-testid="opportunity-tab-addenda">Addenda</Link></li>
          <li><Link href={`${base}?tab=history`} aria-current="page" data-testid="opportunity-tab-history">History</Link></li>
          <li><Link href={`${base}?tab=evaluationPanel`} data-testid="opportunity-tab-evaluation-panel">Evaluation panel</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">History</Heading>
        <div role="region" aria-labelledby="history-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption id="history-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">Every change of state and every event, newest first</Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>Date</th>
                <th scope="col" style={cell}>Entry</th>
                <th scope="col" style={cell}>By</th>
                <th scope="col" style={cell}>Note</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.when}>
                  <td style={cell}>{h.when}</td>
                  <td style={cell}>{h.entry}</td>
                  <td style={cell}>{h.by}</td>
                  <td style={cell}>{h.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Form validationBehavior="aria" style={stack}>
          <Heading level={3}>Add a private note</Heading>
          <Text elementType="p">Notes are private. Only this opportunity's author and administrators can see them.</Text>
          <TextArea label="Note" isRequired maxLength={1000} description="Up to 1,000 characters." data-testid="note-text-field" />
          <div>
            <FileTrigger>
              <Button variant="secondary" data-testid="attachment-add-button">Add attachment</Button>
            </FileTrigger>
          </div>
          <div>
            <Button type="submit" variant="primary" data-testid="history-add-note-button">Add note</Button>
          </div>
        </Form>
      </section>
    </div>
  ),
};
