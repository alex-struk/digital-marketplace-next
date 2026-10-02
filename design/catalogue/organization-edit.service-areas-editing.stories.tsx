import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, ButtonGroup, Checkbox, CheckboxGroup, Heading, Link, Text } from "@bcgov/design-system-react-components";
import { PageContainer, Stack } from "./layout";

// organization-edit · service-areas-editing — a service administrator has kept one of the two approved areas, cleared
// the other and ticked a third; saving replaces the approvals with exactly what is ticked (R-3.28)
// Service area names are illustrative: the spec does not carry the service's list.
const meta: Meta = { title: "organizations/organization-edit/service-areas-editing" };
export default meta;

const orgId = "4a9e1c20-6d3b-4f1a-8e2c-000000000201";
const base = `/organizations/${orgId}/edit`;

const serviceAreas = [
  { id: "full-stack-developer", label: "Full stack developer" },
  { id: "data-professional", label: "Data professional" },
  { id: "agile-coach", label: "Agile coach" },
  { id: "devops-specialist", label: "DevOps specialist" },
  { id: "service-designer", label: "Service designer" },
];

export const ServiceAreasEditing: StoryObj = {
  render: () => (
    <PageContainer>
      <Stack gap="large">
        <Stack gap="small">
          <Text elementType="p" size="small" color="secondary">Edit Organization</Text>
          <Heading level={1}>Northwind Digital Co-operative</Heading>
        </Stack>
        <Stack direction="row" align="center" gap="medium">
          <Text elementType="p" size="small" color="secondary">
            Organization ID: <span data-testid="organization-identifier">{orgId}</span>
          </Text>
        </Stack>
        <nav aria-label="Organization sections">
          <Stack as="ul" direction="row" gap="medium" align="center">
            <li><Link href={`${base}?tab=organization`} data-testid="organization-tab-organization">Organization</Link></li>
            <li><Link href={`${base}?tab=team`} data-testid="organization-tab-team">Team members</Link></li>
            <li><Link href={`${base}?tab=swu-qualification`} data-testid="organization-tab-swu-qualification">Sprint With Us qualification</Link></li>
            <li><Link href={`${base}?tab=twu-qualification`} aria-current="page" data-testid="organization-tab-twu-qualification">Team With Us qualification</Link></li>
            <li><Link href={`${base}?tab=changelog`} data-testid="organization-tab-changelog">Changelog</Link></li>
          </Stack>
        </nav>
        <Stack as="section" aria-labelledby="tab-heading" gap="medium">
          <Heading level={2} id="tab-heading">Team With Us qualification</Heading>
          <Stack as="section" aria-labelledby="areas-heading" gap="medium">
            <Heading level={3} id="areas-heading">Approved service areas</Heading>
            <Text elementType="p">Saving replaces this organization’s approvals with exactly the areas ticked.</Text>
            <CheckboxGroup label="Service areas this organization is approved for" defaultValue={["full-stack-developer", "agile-coach"]}>
              {serviceAreas.map((a) => (
                <Checkbox key={a.id} value={a.id} data-testid="organization-service-area-checkbox">{a.label}</Checkbox>
              ))}
            </CheckboxGroup>
            <ButtonGroup ariaLabel="Service area actions">
              <Button variant="primary" data-testid="organization-save-service-areas-button">Save service areas</Button>
              <Button variant="secondary" data-testid="organization-cancel-service-areas-button">Cancel</Button>
            </ButtonGroup>
          </Stack>
        </Stack>
      </Stack>
    </PageContainer>
  ),
};
