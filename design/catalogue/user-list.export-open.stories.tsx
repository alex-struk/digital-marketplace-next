import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Dialog,
  Heading,
  Modal,
  Text,
  TextField,
} from "@bcgov/design-system-react-components";

// user-list · export-open — nothing chosen yet, so export is unavailable (R-4.32)
const meta: Meta = { title: "users/user-list/export-open" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const dialogBody = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

export const ExportOpen: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>Digital Marketplace Users</Heading>
      <TextField type="search" label="Search by name" data-testid="user-list-search" />
      <Button variant="secondary" data-testid="contact-list-open-export">Export contact list</Button>
      <Modal isOpen isDismissable>
        <Dialog isCloseable data-testid="contact-list-modal">
          <div style={dialogBody}>
            <Heading level={2} slot="title">Export contact list</Heading>
            <Text elementType="p">The file lists active accounts only.</Text>
            <CheckboxGroup
              label="Account types"
              description="Administrators are included with public sector employees."
              isRequired
            >
              <Checkbox value="public-sector" data-testid="contact-list-user-type">Public sector employees</Checkbox>
              <Checkbox value="vendor" data-testid="contact-list-user-type">Vendors</Checkbox>
            </CheckboxGroup>
            <CheckboxGroup label="Fields" isRequired>
              <Checkbox value="first-name" data-testid="contact-list-field">First name</Checkbox>
              <Checkbox value="last-name" data-testid="contact-list-field">Last name</Checkbox>
              <Checkbox value="email" data-testid="contact-list-field">Email address</Checkbox>
              <Checkbox value="organization-name" data-testid="contact-list-field">Organization name</Checkbox>
            </CheckboxGroup>
            <Text id="contact-list-export-hint" elementType="p" size="small" color="secondary">
              Choose at least one account type and one field to export.
            </Text>
            <ButtonGroup alignment="end" ariaLabel="Export actions">
              <Button variant="secondary" data-testid="contact-list-cancel-button">Cancel</Button>
              <Button variant="primary" isDisabled aria-describedby="contact-list-export-hint" data-testid="contact-list-export-button">
                Export
              </Button>
            </ButtonGroup>
          </div>
        </Dialog>
      </Modal>
    </div>
  ),
};
