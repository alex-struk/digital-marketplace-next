import { useCallback, useEffect, useState } from "react";
import {
  AlertDialog,
  Button,
  ButtonGroup,
  Checkbox,
  Dialog,
  Heading,
  InlineAlert,
  Modal,
  Select,
  Text,
  TextField,
} from "@bcgov/design-system-react-components";
import {
  AFFILIATION_EVENT_LABELS,
  capabilitySummary,
  mayManageTeam,
  offersChangeOwner,
  ownershipTransferRefusal,
  rowControls,
  teamShown,
} from "@rules/organizations";
import type { Account } from "../api/accounts";
import {
  Organization,
  TeamMember,
  acceptMembership,
  endMembership,
  fetchOrganization,
  fetchTeam,
  inviteToTeam,
  setAdministratorRights,
  transferOwnership,
} from "../api/organizations";
import { badge } from "../app/layout";
import { Loading } from "../app/loading";
import { Stack } from "../app/page-layout";
import { TitledAlert } from "../app/titled-alert";
import { readMoment } from "../lib/dates";
import {
  InvitationOutcome,
  addressesToInvite,
  fieldProblem,
  forgetOutcome,
  keepOutcome,
  keptOutcome,
} from "../lib/invitations";

/**
 * The management page's Team members and Changelog tabs (organization-edit · team,
 * team-administrator, invite-*, admin-rights-confirm, remove-member-confirm, change-owner,
 * changelog).
 *
 * The team is everyone whose membership stands, the owner first; a pending invitee is marked and
 * counts towards neither the team's size nor its capabilities (R-3.7, R-3.34). Each row offers
 * only what the viewer may do there, by the same rules the service applies (R-3.9–R-3.13).
 */

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

// A dialog's own inner padding, as the stories draw it. Not page spacing.
const dialogBody = { padding: "var(--layout-padding-large)" } as const;

const MEMBERSHIP_LABELS = { OWNER: "Owner", ADMIN: "Administrator", MEMBER: "Member" } as const;

/** The statement a person giving administrator rights confirms first (R-3.12; design gap 8). */
export const ADMIN_RIGHTS_STATEMENT =
  "An organization administrator can invite people to the team, remove members, give and withdraw other members’ administrator rights, and put the organization forward on proposals. They cannot change the organization’s profile or archive it.";

const lowerFirst = (text: string) => (text ? text[0]?.toLowerCase() + text.slice(1) : text);

export function TeamTab({
  viewer,
  organization,
  onChanged,
}: {
  viewer: Account;
  organization: Organization;
  onChanged: (organization: Organization) => void;
}) {
  const [team, setTeam] = useState<readonly TeamMember[] | "loading" | "failed">("loading");
  // The outcome outlives a reload of the tab, until the next action (R-3.30).
  const [outcome, setOutcome] = useState<InvitationOutcome | null>(() => keptOutcome(organization.id));
  const [failure, setFailure] = useState<readonly string[] | null>(null);
  const [inviting, setInviting] = useState(false);
  const [givingRightsTo, setGivingRightsTo] = useState<TeamMember | null>(null);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [changingOwner, setChangingOwner] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    const found = await fetchTeam(organization.id);
    setTeam(found.kind === "listed" ? found.members : "failed");
  }, [organization.id]);

  useEffect(() => {
    let current = true;
    void fetchTeam(organization.id).then((found) => {
      if (current) setTeam(found.kind === "listed" ? found.members : "failed");
    });
    return () => {
      current = false;
    };
  }, [organization.id]);

  /** After a change: the team again, and the organization, whose size, owner and changelog follow it. */
  async function refresh() {
    await load();
    const read = await fetchOrganization(organization.id);
    if (read.kind === "found") onChanged(read.organization);
  }

  async function act(change: () => Promise<{ kind: "saved" } | { kind: "refused"; reasons: readonly string[] }>) {
    if (working) return false;
    setWorking(true);
    setFailure(null);
    clearOutcome();
    const answer = await change();
    setWorking(false);
    if (answer.kind === "refused") {
      setFailure(answer.reasons.length > 0 ? answer.reasons : ["Try again in a moment."]);
      return false;
    }
    await refresh();
    return true;
  }

  function clearOutcome() {
    setOutcome(null);
    forgetOutcome(organization.id);
  }

  async function invite(emails: readonly string[]) {
    setWorking(true);
    setFailure(null);
    // Every invitation is sent at once, so none waits on another's answer to leave the browser.
    const answers = await Promise.all(emails.map((email) => inviteToTeam(organization.id, email)));
    const refused: { email: string; reason: string }[] = [];
    const unregistered: string[] = [];
    let invalidType = false;
    answers.forEach((answer, index) => {
      const email = emails[index] ?? "";
      if (answer.kind === "not-registered") unregistered.push(email);
      else if (answer.kind === "invalid-type") invalidType = true;
      else if (answer.kind === "refused") refused.push({ email, reason: answer.reasons.join(" ") || "the invitation could not be sent." });
    });
    const answered = { refused, unregistered, invalidType };
    keepOutcome(organization.id, answered);
    setOutcome(answered);
    setWorking(false);
    setInviting(false);
    await refresh();
  }

  const members = team === "loading" || team === "failed" ? [] : teamShown(team);
  const activeCount = members.filter((member) => member.membershipStatus === "ACTIVE").length;
  const manages = mayManageTeam(viewer, organization.viewerMembership);
  const changeOwnerOffered = offersChangeOwner(viewer, members);
  const owner = members.find((member) => member.membershipType === "OWNER" && member.membershipStatus === "ACTIVE");
  const summary = capabilitySummary(members);

  return (
    <Stack as="section" aria-labelledby="tab-heading" gap="medium">
      <Heading level={2} id="tab-heading">
        Team members
      </Heading>
      {outcome?.invalidType ? (
        <div data-testid="organization-invalid-membership-type-error">
          <InlineAlert
            variant="danger"
            role="alert"
            title="The invitation was not sent: invalid membership type"
            description="An invitation can only be for a member or an owner. Administrator rights are given after the person has joined."
          />
        </div>
      ) : null}
      {outcome && (outcome.refused.length > 0 || outcome.unregistered.length > 0) ? (
        // What the invitations came back with is the page's one field-error message (R-3.8, R-3.30).
        <Stack gap="medium" data-testid="field-error">
          {outcome.refused.length > 0 ? (
        <div data-testid="organization-invite-refused">
          <TitledAlert
            variant="danger"
            role="alert"
            title={outcome.refused.length === 1 ? "1 invitation was not sent" : `${outcome.refused.length} invitations were not sent`}
          >
            <ul>
              {outcome.refused.map((entry) => (
                <li key={entry.email}>
                  {entry.email}: {lowerFirst(entry.reason)}
                </li>
              ))}
            </ul>
          </TitledAlert>
        </div>
          ) : null}
          {outcome.unregistered.map((email) => (
            <div key={email} data-testid="organization-invite-unregistered">
              <InlineAlert
                variant="warning"
                role="alert"
                title={`${email} is not registered with the Digital Marketplace`}
                description="They have been emailed an invitation to sign up. They are not on your team."
              />
            </div>
          ))}
        </Stack>
      ) : null}
      {failure ? (
        <div data-testid="field-error">
          <TitledAlert variant="danger" role="alert" title="That change could not be made">
            <Text elementType="p">{failure.join(" ")}</Text>
          </TitledAlert>
        </div>
      ) : null}
      {team === "loading" ? (
        <Loading label="Loading the team…" />
      ) : team === "failed" ? (
        <TitledAlert variant="danger" role="alert" title="The team could not be loaded">
          <Text elementType="p">Try again in a moment.</Text>
        </TitledAlert>
      ) : (
        <>
          <Text elementType="p">
            Team size: {activeCount} active {activeCount === 1 ? "member" : "members"}. An invited person joins the team, and counts
            towards its size and capabilities, once they accept.
          </Text>
          {manages ? (
            <ButtonGroup ariaLabel="Team actions">
              <Button
                variant="primary"
                onPress={() => {
                  clearOutcome();
                  setFailure(null);
                  setInviting(true);
                }}
                data-testid="organization-add-team-members-button"
              >
                Add team members
              </Button>
              {changeOwnerOffered ? (
                <Button variant="secondary" onPress={() => setChangingOwner(true)} data-testid="organization-change-owner-button">
                  Change owner
                </Button>
              ) : null}
            </ButtonGroup>
          ) : null}
          <div role="region" aria-labelledby="team-caption" tabIndex={0} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <caption id="team-caption" style={{ textAlign: "start" }}>
                <Text size="small" color="secondary">
                  Everyone who belongs to or has been invited to this organization
                </Text>
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>
                    Name
                  </th>
                  <th scope="col" style={cell}>
                    Membership
                  </th>
                  <th scope="col" style={cell}>
                    Capabilities
                  </th>
                  <th scope="col" style={cell}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <MemberRow
                    key={member.affiliationId}
                    viewer={viewer}
                    organization={organization}
                    member={member}
                    working={working}
                    onGiveRights={() => setGivingRightsTo(member)}
                    onRemoveRights={() => void act(() => setAdministratorRights(member.affiliationId, false))}
                    onRemove={() => setRemoving(member)}
                    onApprove={() => void act(() => acceptMembership(member.affiliationId))}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <Stack as="section" aria-labelledby="capabilities-heading" gap="medium" data-testid="organization-team-capabilities">
            <Heading level={3} id="capabilities-heading">
              Team capabilities
            </Heading>
            <Text elementType="p">Only active members count. An invited person’s capabilities count once they accept.</Text>
            {summary.held.length === 0 ? (
              <Text elementType="p">No active member holds a capability yet.</Text>
            ) : (
              <ul>
                {summary.held.map((name) => (
                  <li key={name} data-testid="organization-team-capability">
                    {name}: held
                  </li>
                ))}
              </ul>
            )}
          </Stack>
          {summary.missing.length > 0 ? (
            <Stack as="section" aria-labelledby="missing-capabilities-heading" gap="medium">
              <Heading level={3} id="missing-capabilities-heading">
                Capabilities the team does not have
              </Heading>
              <ul>
                {summary.missing.map((name) => (
                  <li key={name}>{name}: not held</li>
                ))}
              </ul>
            </Stack>
          ) : null}
        </>
      )}
      <InviteDialog open={inviting} working={working} onCancel={() => setInviting(false)} onSend={(emails) => void invite(emails)} />
      <AdminRightsDialog
        member={givingRightsTo}
        working={working}
        onCancel={() => setGivingRightsTo(null)}
        onConfirm={(member) => {
          // A confirmed dialog closes at once; what the service answers is shown on the tab.
          setGivingRightsTo(null);
          void act(() => setAdministratorRights(member.affiliationId, true));
        }}
      />
      <RemoveDialog
        organization={organization}
        member={removing}
        working={working}
        onCancel={() => setRemoving(null)}
        onConfirm={(member) => {
          setRemoving(null);
          void act(() => endMembership(member.affiliationId));
        }}
      />
      <ChangeOwnerDialog
        open={changingOwner}
        viewer={viewer}
        organization={organization}
        owner={owner ?? null}
        members={members}
        working={working}
        onCancel={() => setChangingOwner(false)}
        onConfirm={(affiliationId) => {
          setChangingOwner(false);
          void act(() => transferOwnership(affiliationId));
        }}
      />
    </Stack>
  );
}

function MemberRow({
  viewer,
  organization,
  member,
  working,
  onGiveRights,
  onRemoveRights,
  onRemove,
  onApprove,
}: {
  viewer: Account;
  organization: Organization;
  member: TeamMember;
  working: boolean;
  onGiveRights: () => void;
  onRemoveRights: () => void;
  onRemove: () => void;
  onApprove: () => void;
}) {
  const controls = rowControls(viewer, organization.viewerMembership, member);
  const shownName = member.name || "Name not given";
  return (
    <tr data-testid="organization-team-member-row">
      <td style={cell}>
        {shownName}
        {member.userId === viewer.id ? " (you)" : ""}
      </td>
      <td style={cell}>
        {member.membershipStatus === "PENDING" ? (
          <span style={badge} data-testid="organization-pending-badge">
            Pending
          </span>
        ) : member.membershipType === "OWNER" ? (
          <span style={badge} data-testid="organization-owner-badge">
            Owner
          </span>
        ) : (
          <span style={badge}>{MEMBERSHIP_LABELS[member.membershipType]}</span>
        )}
      </td>
      <td style={cell}>{member.capabilities.length}</td>
      <td style={cell}>
        {controls.approve || controls.giveAdminRights || controls.removeAdminRights || controls.remove ? (
          <Stack direction="row" gap="small">
            {controls.approve ? (
              <Button
                variant="tertiary"
                size="small"
                isDisabled={working}
                aria-label={`Approve ${shownName}`}
                onPress={onApprove}
                data-testid="organization-member-approve-button"
              >
                Approve
              </Button>
            ) : null}
            {controls.giveAdminRights ? (
              <Button
                variant="tertiary"
                size="small"
                isDisabled={working}
                aria-label={`Give administrator rights to ${shownName}`}
                onPress={onGiveRights}
                data-testid="organization-member-admin-toggle"
              >
                Give administrator rights
              </Button>
            ) : null}
            {controls.removeAdminRights ? (
              <Button
                variant="tertiary"
                size="small"
                isDisabled={working}
                aria-label={`Remove administrator rights from ${shownName}`}
                onPress={onRemoveRights}
                data-testid="organization-member-admin-toggle"
              >
                Remove administrator rights
              </Button>
            ) : null}
            {controls.remove ? (
              <Button
                variant="tertiary"
                size="small"
                danger
                isDisabled={working}
                aria-label={`Remove ${shownName}`}
                onPress={onRemove}
                data-testid="organization-member-remove-button"
              >
                Remove
              </Button>
            ) : null}
          </Stack>
        ) : null}
      </td>
    </tr>
  );
}

/**
 * Inviting people by email address, several at once. Each is sent as an ordinary member's
 * invitation (R-3.7, R-3.17); a field may hold several addresses pasted in together. An address
 * that is not a valid one is reported against its field and nothing is sent until each is.
 */
function InviteDialog({
  open,
  working,
  onCancel,
  onSend,
}: {
  open: boolean;
  working: boolean;
  onCancel: () => void;
  onSend: (emails: readonly string[]) => void;
}) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (open) {
      setEmails([""]);
      setChecked(false);
    }
  }, [open]);

  const allEmpty = addressesToInvite(emails).length === 0;
  const problemAt = (index: number): string => fieldProblem(emails[index] ?? "", index === 0 && allEmpty);

  function send() {
    setChecked(true);
    if (emails.some((_, index) => problemAt(index) !== "")) return;
    onSend(addressesToInvite(emails));
  }

  return (
    <Modal isOpen={open} isDismissable onOpenChange={(isOpen) => (!isOpen && !working ? onCancel() : undefined)}>
      <Dialog isCloseable data-testid="organization-invite-dialog">
        <div style={dialogBody}>
          <Stack gap="medium">
            <Heading level={2} slot="title">
              Add team members
            </Heading>
            <Text elementType="p">
              Each person is emailed an invitation and joins the team as a member once they accept. Only people with a vendor account can
              be invited. Anyone not yet registered is emailed an invitation to sign up instead.
            </Text>
            {emails.map((email, index) => (
              <TextField
                key={index}
                label={`Email address ${index + 1}`}
                type="email"
                isRequired={index === 0}
                value={email}
                onChange={(value) => setEmails((current) => current.map((entry, at) => (at === index ? value : entry)))}
                isInvalid={checked && problemAt(index) !== ""}
                errorMessage={problemAt(index)}
                data-testid="organization-invite-email-field"
              />
            ))}
            <div>
              <Button variant="tertiary" onPress={() => setEmails((current) => [...current, ""])} data-testid="organization-invite-add-email">
                Add another email address
              </Button>
            </div>
            <ButtonGroup alignment="end" ariaLabel="Invitation actions">
              <Button variant="secondary" isDisabled={working} onPress={onCancel} data-testid="organization-dialog-cancel">
                Cancel
              </Button>
              <Button variant="primary" isDisabled={working} onPress={send} data-testid="organization-invite-submit">
                Send invitations
              </Button>
            </ButtonGroup>
          </Stack>
        </div>
      </Dialog>
    </Modal>
  );
}

/** Giving administrator rights asks the giver to confirm what they allow first (R-3.12). */
function AdminRightsDialog({
  member,
  working,
  onCancel,
  onConfirm,
}: {
  member: TeamMember | null;
  working: boolean;
  onCancel: () => void;
  onConfirm: (member: TeamMember) => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => setConfirmed(false), [member]);
  const name = member?.name || "this member";
  return (
    <Modal isOpen={member !== null} isDismissable onOpenChange={(open) => (!open && !working ? onCancel() : undefined)}>
      <AlertDialog
        variant="confirmation"
        title={`Give ${name} administrator rights?`}
        data-testid="organization-admin-rights-dialog"
        buttons={
          <>
            <Button variant="secondary" isDisabled={working} onPress={onCancel} data-testid="organization-dialog-cancel">
              Cancel
            </Button>
            <Button
              variant="primary"
              isDisabled={!confirmed}
              aria-describedby="admin-rights-hint"
              onPress={() => (member && !working ? onConfirm(member) : undefined)}
              data-testid="organization-admin-rights-confirm"
            >
              Give administrator rights
            </Button>
          </>
        }
      >
        <Stack gap="medium">
          <Text elementType="p">{ADMIN_RIGHTS_STATEMENT}</Text>
          <Checkbox isSelected={confirmed} onChange={setConfirmed} data-testid="organization-admin-terms-checkbox">
            I have read this statement and confirm it
          </Checkbox>
          <Text id="admin-rights-hint" elementType="p" size="small" color="secondary">
            Confirm the statement to give administrator rights.
          </Text>
        </Stack>
      </AlertDialog>
    </Modal>
  );
}

/** Removing somebody from the team, or withdrawing an invitation, asks first (R-3.10). */
function RemoveDialog({
  organization,
  member,
  working,
  onCancel,
  onConfirm,
}: {
  organization: Organization;
  member: TeamMember | null;
  working: boolean;
  onCancel: () => void;
  onConfirm: (member: TeamMember) => void;
}) {
  const name = member?.name || "This person";
  return (
    <Modal isOpen={member !== null} isDismissable onOpenChange={(open) => (!open && !working ? onCancel() : undefined)}>
      <AlertDialog
        variant="destructive"
        title={`Remove ${name} from the team?`}
        data-testid="organization-member-remove-dialog"
        buttons={
          <>
            <Button variant="secondary" isDisabled={working} onPress={onCancel} data-testid="organization-dialog-cancel">
              Cancel
            </Button>
            <Button
              variant="primary"
              danger
              onPress={() => (member && !working ? onConfirm(member) : undefined)}
              data-testid="organization-member-remove-confirm"
            >
              Remove from team
            </Button>
          </>
        }
      >
        <Text elementType="p">
          {member?.membershipStatus === "PENDING"
            ? `${name}’s invitation to ${organization.legalName}’s team will be withdrawn. They can be invited again later.`
            : `${name} will no longer be on ${organization.legalName}’s team, and will stop counting towards its size and capabilities. They can be invited again later.`}
        </Text>
      </AlertDialog>
    </Modal>
  );
}

/**
 * Transferring ownership, by a service administrator, to a member who has joined (R-3.13). The
 * new owner is chosen first, then the transfer is confirmed in the same dialog, which closes as
 * soon as it is (decision record 0052). Its buttons are never shown disabled.
 */
function ChangeOwnerDialog({
  open,
  viewer,
  organization,
  owner,
  members,
  working,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  viewer: Account;
  organization: Organization;
  owner: TeamMember | null;
  members: readonly TeamMember[];
  working: boolean;
  onCancel: () => void;
  onConfirm: (affiliationId: string) => void;
}) {
  const [chosen, setChosen] = useState<string>("");
  const [checked, setChecked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (open) {
      setChosen("");
      setChecked(false);
      setConfirming(false);
    }
  }, [open]);
  const candidates = members.filter((member) => ownershipTransferRefusal(viewer, member) === null);
  const items = candidates.map((member) => ({ id: member.affiliationId, label: member.name || "Name not given" }));
  const newOwner = candidates.find((member) => member.affiliationId === chosen) ?? null;
  const ownerWords = owner ? `${owner.name}, the current owner,` : "The current owner";
  return (
    <Modal isOpen={open} isDismissable onOpenChange={(isOpen) => (!isOpen ? onCancel() : undefined)}>
      <Dialog isCloseable data-testid="organization-change-owner-dialog">
        <div style={dialogBody}>
          {confirming && newOwner ? (
            <Stack gap="medium">
              <Heading level={2} slot="title">
                Make {newOwner.name || "this member"} the owner?
              </Heading>
              <Text elementType="p">
                {newOwner.name || "This member"} will own {organization.legalName}. {ownerWords} will become an ordinary member.
              </Text>
              <ButtonGroup alignment="end" ariaLabel="Change owner actions">
                <Button variant="secondary" onPress={() => setConfirming(false)} data-testid="organization-dialog-cancel">
                  Back
                </Button>
                <Button
                  variant="primary"
                  onPress={() => (working ? undefined : onConfirm(newOwner.affiliationId))}
                  data-testid="organization-change-owner-confirm"
                >
                  Yes, change owner
                </Button>
              </ButtonGroup>
            </Stack>
          ) : (
            <Stack gap="medium">
              <Heading level={2} slot="title">
                Change owner
              </Heading>
              <Text elementType="p">
                {ownerWords} will become an ordinary member. Only members who have accepted their invitation can be chosen.
              </Text>
              <Select
                label="New owner"
                isRequired
                items={items}
                value={chosen === "" ? null : chosen}
                onChange={(key) => setChosen(key === null ? "" : String(key))}
                isInvalid={checked && newOwner === null}
                errorMessage="Choose the new owner"
                data-testid="organization-new-owner-field"
              />
              <ButtonGroup alignment="end" ariaLabel="Change owner actions">
                <Button variant="secondary" onPress={onCancel} data-testid="organization-dialog-cancel">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={() => {
                    setChecked(true);
                    if (newOwner) setConfirming(true);
                  }}
                  data-testid="organization-change-owner-confirm"
                >
                  Change owner
                </Button>
              </ButtonGroup>
            </Stack>
          )}
        </div>
      </Dialog>
    </Modal>
  );
}

/**
 * Every grant and withdrawal of administrator rights and every transfer of ownership, newest
 * first, with whom it concerned, when, and who made it (R-3.33).
 */
export function ChangelogTab({ organization }: { organization: Organization }) {
  return (
    <Stack as="section" aria-labelledby="tab-heading" gap="medium">
      <Heading level={2} id="tab-heading">
        Changelog
      </Heading>
      {organization.changelog.length === 0 ? (
        <Text elementType="p" data-testid="organization-changelog-empty">
          No administrator rights have been given or withdrawn, and ownership has not been transferred.
        </Text>
      ) : (
        <div role="region" aria-labelledby="changelog-caption" tabIndex={0} style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <caption id="changelog-caption" style={{ textAlign: "start" }}>
              <Text size="small" color="secondary">
                Changes to administrator rights and ownership, newest first
              </Text>
            </caption>
            <thead>
              <tr>
                <th scope="col" style={cell}>
                  Date
                </th>
                <th scope="col" style={cell}>
                  Change
                </th>
                <th scope="col" style={cell}>
                  Member
                </th>
                <th scope="col" style={cell}>
                  Made by
                </th>
              </tr>
            </thead>
            <tbody>
              {organization.changelog.map((entry) => {
                const when = readMoment(entry.createdAt);
                return (
                  <tr key={entry.id} data-testid="organization-changelog-entry">
                    <td style={cell}>{when ? <time dateTime={when.dateTime}>{when.label}</time> : entry.createdAt}</td>
                    <td style={cell}>{AFFILIATION_EVENT_LABELS[entry.event]}</td>
                    <td style={cell}>{entry.memberName}</td>
                    <td style={cell}>{entry.createdByName}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Stack>
  );
}
