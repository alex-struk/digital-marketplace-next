import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Checkbox,
  CheckboxGroup,
  Dialog,
  Heading,
  InlineAlert,
  Link,
  Modal,
  Text,
  TextField,
} from "@bcgov/design-system-react-components";
import {
  accountKindLabel,
  accountStatusLabel,
  compareListedAccounts,
  nameMatchesSearch,
} from "@rules/users";
import { Account, downloadContactList, fetchAccounts } from "../api/accounts";
import { page, stack } from "../app/layout";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { RequireSignIn } from "../app/require-sign-in";
import { useScreenTitle } from "../app/screen-title";

/**
 * Digital Marketplace Users, at `/users` (user-list). An administrator browses everyone
 * registered, narrows the list by name, opens a person's profile, and exports a contact list
 * (R-4.14, R-4.32). Anyone else is shown the missing page and no request is made, as the service
 * would refuse it (R-4.21).
 */
export function UserListScreen() {
  return (
    <RequireSignIn title="Digital Marketplace Users" loadingLabel="Loading users…">
      {(viewer) => (viewer.type === "ADMIN" ? <UserList /> : <NotFound />)}
    </RequireSignIn>
  );
}

const toolbar = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "end",
  justifyContent: "space-between",
  gap: "var(--layout-margin-medium)",
} as const;

const cell = {
  textAlign: "start",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

const badge = {
  display: "inline-block",
  paddingInline: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-circular)",
} as const;

function UserList() {
  useScreenTitle("Digital Marketplace Users");
  const [answer, setAnswer] = useState<readonly Account[] | "loading" | "refused">("loading");
  const [search, setSearch] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let current = true;
    void fetchAccounts().then((found) => {
      if (current) setAnswer(found.kind === "listed" ? [...found.accounts].sort(compareListedAccounts) : "refused");
    });
    return () => {
      current = false;
    };
  }, []);

  const shown = useMemo(
    () => (Array.isArray(answer) ? answer.filter((account) => nameMatchesSearch(account.name, search)) : []),
    [answer, search],
  );

  if (answer === "refused") return <NotFound />;
  return (
    <div style={page}>
      <Heading level={1}>Digital Marketplace Users</Heading>
      {answer === "loading" ? (
        <Loading label="Loading users…" />
      ) : (
        <>
          <div style={toolbar}>
            <TextField
              type="search"
              label="Search by name"
              value={search}
              onChange={setSearch}
              data-testid="user-list-search"
            />
            <Button variant="secondary" onPress={() => setExporting(true)} data-testid="contact-list-open-export">
              Export contact list
            </Button>
          </div>
          <div role="region" aria-labelledby="user-list-caption" tabIndex={0} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <caption id="user-list-caption" style={{ textAlign: "start" }}>
                <Text size="small" color="secondary">
                  Everyone registered, active accounts first, then by account type and name
                </Text>
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>
                    Status
                  </th>
                  <th scope="col" style={cell}>
                    Account type
                  </th>
                  <th scope="col" style={cell}>
                    Name
                  </th>
                  <th scope="col" style={cell}>
                    Administrator
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((account) => (
                  <tr key={account.id} data-testid="user-list-row">
                    <td style={cell}>
                      <span style={badge} data-testid="user-list-status-badge">
                        {accountStatusLabel(account.status)}
                      </span>
                    </td>
                    <td style={cell}>
                      <span data-testid="user-list-account-type">{accountKindLabel(account.type)}</span>
                    </td>
                    <td style={cell}>
                      <Link href={`/users/${account.id}`} data-testid="user-list-profile-link">
                        {account.name}
                      </Link>
                    </td>
                    <td style={cell}>
                      <span data-testid="user-list-admin-check">{account.type === "ADMIN" ? "Yes" : "No"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div role="status">
            {search.trim() ? (
              <Text elementType="p" size="small" color="secondary">
                {`${shown.length} of ${answer.length} ${answer.length === 1 ? "person" : "people"} shown`}
              </Text>
            ) : null}
          </div>
          <ExportContactList isOpen={exporting} onClose={() => setExporting(false)} />
        </>
      )}
    </div>
  );
}

const dialogBody = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;

/**
 * The contact-list export (R-4.32). Export is unavailable until at least one account type and
 * one field are ticked, and the reason is said before the buttons.
 */
function ExportContactList({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [kinds, setKinds] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(false);
  const ready = kinds.length > 0 && fields.length > 0;

  function close() {
    if (working) return;
    setKinds([]);
    setFields([]);
    setFailed(false);
    onClose();
  }

  async function exportList() {
    if (!ready || working) return;
    setWorking(true);
    setFailed(false);
    const saved = await downloadContactList(kinds, fields);
    setWorking(false);
    if (saved) close();
    else setFailed(true);
  }

  return (
    <Modal isOpen={isOpen} isDismissable onOpenChange={(open) => (open ? undefined : close())}>
      <Dialog isCloseable data-testid="contact-list-modal">
        <div style={dialogBody}>
          <Heading level={2} slot="title">
            Export contact list
          </Heading>
          <Text elementType="p">The file lists active accounts only.</Text>
          <CheckboxGroup
            label="Account types"
            description="Administrators are included with public sector employees."
            isRequired
            value={kinds}
            onChange={setKinds}
          >
            <Checkbox value="GOV" data-testid="contact-list-user-type">
              Public sector employees
            </Checkbox>
            <Checkbox value="VENDOR" data-testid="contact-list-user-type">
              Vendors
            </Checkbox>
          </CheckboxGroup>
          <CheckboxGroup label="Fields" isRequired value={fields} onChange={setFields}>
            <Checkbox value="firstName" data-testid="contact-list-field">
              First name
            </Checkbox>
            <Checkbox value="lastName" data-testid="contact-list-field">
              Last name
            </Checkbox>
            <Checkbox value="email" data-testid="contact-list-field">
              Email address
            </Checkbox>
            <Checkbox value="organizationName" data-testid="contact-list-field">
              Organization name
            </Checkbox>
          </CheckboxGroup>
          {failed ? (
            <InlineAlert
              variant="danger"
              role="alert"
              title="The contact list could not be exported"
              description="Nothing was saved. Please try again."
            />
          ) : null}
          {ready ? null : (
            <Text id="contact-list-export-hint" elementType="p" size="small" color="secondary">
              Choose at least one account type and one field to export.
            </Text>
          )}
          <ButtonGroup alignment="end" ariaLabel="Export actions">
            <Button variant="secondary" isDisabled={working} onPress={close} data-testid="contact-list-cancel-button">
              Cancel
            </Button>
            <Button
              variant="primary"
              isDisabled={!ready || working}
              aria-describedby={ready ? undefined : "contact-list-export-hint"}
              onPress={() => void exportList()}
              data-testid="contact-list-export-button"
            >
              Export
            </Button>
          </ButtonGroup>
        </div>
      </Dialog>
    </Modal>
  );
}
