import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";

// proposal-swu-view · default — the opportunity's author, after closing, while the team questions are under review.
// The proponent is shown only by its anonymous name, and every stage score is still to come. Disqualify is offered at
// every stage (R-2.5, R-2.25, R-2.34, R-2.37)
const meta: Meta = { title: "proposals/proposal-swu-view/default" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const tight = { display: "grid", gap: "var(--layout-margin-small)" } as const;
const facts = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-large)", margin: "var(--layout-margin-none)" } as const;
const fact = { display: "grid", gap: "var(--layout-margin-xsmall)" } as const;
const term = { fontWeight: "var(--typography-font-weights-bold)" } as const;
const detail = { margin: "var(--layout-margin-none)" } as const;
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
const base = "/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/proposals/3f8a2c10-6d4b-4e19-a7c5-000000000211";

const phases = [
  {
    name: "Prototype phase",
    cost: "$300,000",
    team: [
      { member: "Test Vendor", scrum: "Yes", capabilities: "Agile coaching, User research" },
      { member: "Test Developer One", scrum: "No", capabilities: "Frontend development, Backend development" },
    ],
  },
  {
    name: "Implementation phase",
    cost: "$850,000",
    team: [
      { member: "Test Vendor", scrum: "Yes", capabilities: "Agile coaching" },
      { member: "Test Developer One", scrum: "No", capabilities: "Frontend development, Backend development" },
      { member: "Test Designer", scrum: "No", capabilities: "User research, Security engineering" },
    ],
  },
];

export const Default: StoryObj = {
  render: () => (
    <div style={page}>
      <Text elementType="p" size="small" color="secondary">Sprint With Us proposal</Text>
      <Heading level={1}><span data-testid="proposal-proponent-name">Proponent 1</span></Heading>
      <dl style={facts}>
        <div style={fact}>
          <dt style={term}>Opportunity</dt>
          <dd style={detail}><Link href="/opportunities/sprint-with-us/7c1e2d40-5b1a-4c2e-9d3f-000000000201/edit">Modernize the licence renewal service</Link></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Status</dt>
          <dd style={detail}><span style={badge} data-testid="proposal-status">Under review: team questions</span></dd>
        </div>
        <div style={fact}>
          <dt style={term}>Submitted</dt>
          <dd style={detail}>October 10, 2026 at 2:12 p.m.</dd>
        </div>
        <div style={fact}>
          <dt style={term}>Proposal ID</dt>
          <dd style={detail} data-testid="proposal-identifier">3f8a2c10-6d4b-4e19-a7c5-000000000211</dd>
        </div>
      </dl>
      <section aria-labelledby="scores-heading" style={tight}>
        <Heading level={2} id="scores-heading">Scores</Heading>
        <dl style={facts}>
          <div style={fact}>
            <dt style={term}>Team questions</dt>
            <dd style={detail} data-testid="proposal-questions-score">Not yet scored</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Code challenge</dt>
            <dd style={detail} data-testid="proposal-challenge-score">Not yet scored</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Team scenario</dt>
            <dd style={detail} data-testid="proposal-scenario-score">Not yet scored</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Price</dt>
            <dd style={detail} data-testid="proposal-price-score">Not yet calculated</dd>
          </div>
          <div style={fact}>
            <dt style={term}>Total</dt>
            <dd style={detail} data-testid="proposal-total-score">Not yet calculated</dd>
          </div>
        </dl>
      </section>
      <div>
        <Link href={`${base}/export`} data-testid="proposal-export-link">Printable copy</Link>
      </div>
      <div data-testid="proposal-actions">
        <ButtonGroup ariaLabel="Proposal actions">
          <Button variant="secondary" danger data-testid="proposal-disqualify-button">Disqualify</Button>
        </ButtonGroup>
      </div>
      <nav aria-label="Proposal sections">
        <ul style={tabs}>
          <li><Link href={`${base}?tab=proposal`} aria-current="page" data-testid="proposal-tab-proposal">Proposal</Link></li>
          <li><Link href={`${base}?tab=teamQuestions`} data-testid="proposal-tab-team-questions">Team questions</Link></li>
          <li><Link href={`${base}?tab=codeChallenge`} data-testid="proposal-tab-code-challenge">Code challenge</Link></li>
          <li><Link href={`${base}?tab=teamScenario`} data-testid="proposal-tab-team-scenario">Team scenario</Link></li>
          <li><Link href={`${base}?tab=history`} data-testid="proposal-tab-history">History</Link></li>
        </ul>
      </nav>
      <section aria-labelledby="tab-heading" style={stack}>
        <Heading level={2} id="tab-heading">Proposal</Heading>
        <section aria-labelledby="tab-organization" style={stack}>
          <Heading level={3} id="tab-organization">Organization</Heading>
          <Text elementType="p">Withheld from evaluators until the proposal reaches the code challenge.</Text>
        </section>
        <section aria-labelledby="tab-team" style={stack}>
          <Heading level={3} id="tab-team">Team</Heading>
          {phases.map((phase, i) => (
            <div key={phase.name} style={stack}>
              <div role="region" aria-labelledby={`team-caption-${i}`} tabIndex={0} style={{ overflowX: "auto" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <caption id={`team-caption-${i}`} style={{ textAlign: "start" }}>
                    <Text size="small" color="secondary">{phase.name} team</Text>
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" style={cell}>Team member</th>
                      <th scope="col" style={cell}>Scrum master</th>
                      <th scope="col" style={cell}>Capabilities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phase.team.map((t) => (
                      <tr key={t.member}>
                        <td style={cell}>{t.member}</td>
                        <td style={cell}>{t.scrum}</td>
                        <td style={cell}>{t.capabilities}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Text elementType="p">{phase.name} proposed cost: {phase.cost}</Text>
            </div>
          ))}
          <Text elementType="p">Total proposed cost: $1,150,000 of the $1,200,000 maximum budget.</Text>
        </section>
        <section aria-labelledby="tab-references" style={stack}>
          <Heading level={3} id="tab-references">References</Heading>
          <Text elementType="p">Test Reference One, test.reference@example.com</Text>
        </section>
        <section aria-labelledby="tab-attachments" style={stack}>
          <Heading level={3} id="tab-attachments">Attachments</Heading>
          <ul>
            <li>
              <Link href="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000911?type=blob" data-testid="attachment-download-link">
                Download Delivery approach.pdf
              </Link>
            </li>
          </ul>
        </section>
        <Text elementType="p" size="small" color="secondary">The responses to the team questions are on the Team questions tab.</Text>
      </section>
    </div>
  ),
};
