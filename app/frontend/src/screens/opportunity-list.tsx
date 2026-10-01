import { useEffect, useMemo, useState } from "react";
import { Button, Checkbox, Heading, Link, Select, Text, TextField } from "@bcgov/design-system-react-components";
import { PROGRAMS, PROGRAM_NAMES, Program, isProgram } from "@rules/opportunities";
import {
  LIST_GROUPS,
  ListFilters,
  ListGroup,
  NO_FILTERS,
  STATUS_FILTER_LABELS,
  groupedForList,
  isStatusFilter,
  matchesFilters,
  mayWatch,
  statusFiltersFor,
} from "@rules/opportunity-list";
import { Account, changeOwnAccount } from "../api/accounts";
import { ListedOpportunity, listAllOpportunities } from "../api/opportunity-list";
import { setWatching } from "../api/watching";
import { page, panel, plainList, row, stack } from "../app/layout";
import { Loading } from "../app/loading";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { holdAccount, useSession } from "../auth/session";
import { StatusBadge, deadlineLabel } from "./opportunity-parts";

/**
 * The opportunity list, at `/opportunities` (opportunity-list, notification-optin-opportunity-list).
 *
 * Anyone reads it. What it holds is what the service lets the person read: published
 * opportunities, and to public sector staff their own unpublished ones and to administrators every
 * one (R-1.2, R-1.3). They are grouped into unpublished, open and closed, each in its own order
 * (R-1.38), and narrowed by program, state, remote work and words in the title or location, every
 * condition at once, as the person chooses (R-1.39).
 *
 * A signed-in person may watch any opportunity they did not create from its card (R-1.5), and turn
 * the new-opportunity emails on or off from the control between the filters and the first group,
 * which saves at once with no question asked and is there at every width (R-6.21, R-6.27).
 */
type Listing =
  | { readonly kind: "loading" }
  | { readonly kind: "listed"; readonly opportunities: readonly ListedOpportunity[] }
  | { readonly kind: "failed" };

const GROUP_HEADINGS: Readonly<Record<ListGroup, { heading: string; order: string; none: string }>> = {
  unpublished: {
    heading: "Unpublished",
    order: "Drafts and opportunities under review, most recently changed first.",
    none: "There are no unpublished opportunities.",
  },
  open: {
    heading: "Open",
    order: "Accepting proposals, nearest proposal deadline first.",
    none: "No opportunities are accepting proposals.",
  },
  closed: {
    heading: "Closed",
    order: "No longer accepting proposals, most recently closed first.",
    none: "No opportunities have closed.",
  },
};

const card = {
  ...panel,
  gap: "var(--layout-margin-small)",
} as const;

const filterRow = { ...row, alignItems: "end" } as const;

/** The new-opportunity emails control: a bordered row that wraps on a narrow screen rather than hiding. */
const optin = {
  ...row,
  padding: "var(--layout-padding-large)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

const programItems = [
  { id: "all", label: "All programs" },
  ...PROGRAMS.map((program) => ({ id: program, label: PROGRAM_NAMES[program] })),
];

export function OpportunityListScreen() {
  useScreenTitle("Opportunities");
  const session = useSession();
  const ready = session.status !== "starting";
  const account = session.status === "signed-in" ? session.account : null;
  const viewerId = account?.id ?? null;
  const [listing, setListing] = useState<Listing>({ kind: "loading" });
  const [filters, setFilters] = useState<ListFilters>(NO_FILTERS);
  // A watch the person has just changed, shown before the list is read again.
  const [watched, setWatched] = useState<Readonly<Record<string, boolean>>>({});
  const [watchFailed, setWatchFailed] = useState<string | null>(null);

  // Asked again whoever is signed in, since what the service lists depends on who asks.
  useEffect(() => {
    if (!ready) return;
    let current = true;
    setListing({ kind: "loading" });
    setWatched({});
    void listAllOpportunities().then((answer) => {
      if (current) setListing(answer.kind === "listed" ? answer : { kind: "failed" });
    });
    return () => {
      current = false;
    };
  }, [ready, viewerId]);

  const shown = useMemo(
    () => (listing.kind === "listed" ? listing.opportunities.filter((opportunity) => matchesFilters(opportunity, filters)) : []),
    [listing, filters],
  );

  if (listing.kind === "loading") {
    return (
      <div style={page}>
        <Heading level={1}>Opportunities</Heading>
        <Loading label="Loading opportunities…" />
      </div>
    );
  }

  const groups = groupedForList(shown, new Date());
  const staff = account?.type === "GOV" || account?.type === "ADMIN";
  const statusItems = [
    { id: "all", label: "All statuses" },
    ...statusFiltersFor(account).map((filter) => ({ id: filter, label: STATUS_FILTER_LABELS[filter] })),
  ];

  async function toggleWatch(opportunity: ListedOpportunity, value: boolean) {
    setWatchFailed(null);
    setWatched((before) => ({ ...before, [opportunity.id]: value }));
    if (!(await setWatching(opportunity.program, opportunity.id, value))) {
      setWatched((before) => ({ ...before, [opportunity.id]: !value }));
      setWatchFailed(opportunity.title || "this opportunity");
    }
  }

  return (
    <div style={page}>
      <Heading level={1}>Opportunities</Heading>
      <form role="search" aria-label="Filter opportunities" style={filterRow} onSubmit={(event) => event.preventDefault()}>
        <Select
          label="Program"
          items={programItems}
          value={filters.program}
          onChange={(key) => setFilters((before) => ({ ...before, program: isProgram(key) ? (key as Program) : "all" }))}
          data-testid="opportunity-filter-program"
        />
        <Select
          label="Status"
          items={statusItems}
          value={filters.status}
          onChange={(key) => setFilters((before) => ({ ...before, status: isStatusFilter(key) ? key : "all" }))}
          data-testid="opportunity-filter-status"
        />
        <Checkbox
          isSelected={filters.remoteOnly}
          onChange={(remoteOnly) => setFilters((before) => ({ ...before, remoteOnly }))}
          data-testid="opportunity-filter-remote"
        >
          Remote work accepted only
        </Checkbox>
        <TextField
          type="search"
          label="Search by title or location"
          value={filters.search}
          onChange={(search) => setFilters((before) => ({ ...before, search }))}
          data-testid="opportunity-search"
        />
      </form>
      {listing.kind === "failed" ? (
        <TitledAlert variant="danger" role="alert" title="The opportunities could not be loaded">
          <Text elementType="p">Reload the page to try again.</Text>
        </TitledAlert>
      ) : (
        <div role="status">
          <Text elementType="p" size="small" color="secondary">
            {`Showing ${shown.length} ${shown.length === 1 ? "opportunity" : "opportunities"}. The list changes as you choose.`}
          </Text>
        </div>
      )}
      {account ? <NewOpportunityNotices account={account} /> : null}
      {account ? (
        <Text elementType="p">
          {staff
            ? "Tick Watch on an opportunity to be emailed whenever it changes. You cannot watch one you created."
            : "Tick Watch on an opportunity to be emailed whenever it changes."}
        </Text>
      ) : null}
      {watchFailed ? (
        <TitledAlert variant="danger" role="alert" title="Your choice could not be saved">
          <Text elementType="p">{`Whether you watch ${watchFailed} has not changed. Please try again.`}</Text>
        </TitledAlert>
      ) : null}
      {listing.kind === "listed"
        ? LIST_GROUPS.filter((group) => group !== "unpublished" || groups.unpublished.length > 0).map((group) => (
            <section key={group} aria-labelledby={`group-${group}`} style={stack} data-testid={`opportunity-group-${group}`}>
              <Heading level={2} id={`group-${group}`}>
                {GROUP_HEADINGS[group].heading}
              </Heading>
              <Text elementType="p" size="small" color="secondary">
                {GROUP_HEADINGS[group].order}
              </Text>
              {groups[group].length === 0 ? (
                <Text elementType="p">{GROUP_HEADINGS[group].none}</Text>
              ) : (
                <ul style={plainList}>
                  {groups[group].map((opportunity) => (
                    <li key={`${opportunity.program}-${opportunity.id}`}>
                      <OpportunityCard
                        opportunity={opportunity}
                        account={account}
                        watching={watched[opportunity.id] ?? opportunity.subscribed}
                        onWatch={(value) => void toggleWatch(opportunity, value)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))
        : null}
    </div>
  );
}

function OpportunityCard({
  opportunity,
  account,
  watching,
  onWatch,
}: {
  opportunity: ListedOpportunity;
  account: Account | null;
  watching: boolean;
  onWatch: (value: boolean) => void;
}) {
  const title = opportunity.title || "Untitled opportunity";
  const headingId = `opportunity-${opportunity.id}`;
  const where = [opportunity.location || "Location not entered", opportunity.remoteOk ? "Remote work accepted" : "On site only"].join(" · ");
  const amount = opportunity.value.amount > 0 ? `$${opportunity.value.amount.toLocaleString("en-CA")}` : "Not entered";
  return (
    <article aria-labelledby={headingId} style={card}>
      <Text elementType="p" size="small" color="secondary">
        {PROGRAM_NAMES[opportunity.program]}
      </Text>
      <Heading level={3} id={headingId}>
        <Link href={`/opportunities/${opportunity.program}/${opportunity.id}`}>{title}</Link>
      </Heading>
      <div>
        <StatusBadge status={opportunity.status} />
      </div>
      <Text elementType="p">{where}</Text>
      <Text elementType="p">{`${opportunity.value.term}: ${amount}`}</Text>
      <Text elementType="p">
        Proposal deadline: <span data-testid="opportunity-proposal-deadline">{deadlineLabel(opportunity.proposalDeadline)}</span>
      </Text>
      {mayWatch(account, { createdBy: opportunity.createdBy?.id ?? null }) ? (
        <Checkbox isSelected={watching} onChange={onWatch} aria-label={`Watch ${title}`} data-testid="opportunity-watch-toggle">
          Watch
        </Checkbox>
      ) : null}
    </article>
  );
}

/**
 * The new-opportunity emails, turned on or off from the list itself (R-6.21). Pressing the button
 * saves at once, either way, with no question asked; the button then offers the opposite choice,
 * focus stays on it, and the change is announced. It is shown at every width (R-6.27). A new
 * account starts with the emails off until its holder asks (R-6.20).
 */
function NewOpportunityNotices({ account }: { account: Account }) {
  const on = account.notificationsOn !== null;
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function change(value: boolean) {
    setSaving(true);
    setFailed(false);
    setStatus(null);
    const answer = await changeOwnAccount(account.id, "updateNotifications", value);
    setSaving(false);
    if (answer.kind !== "saved") {
      setFailed(true);
      return;
    }
    holdAccount(answer.account);
    setStatus(
      value
        ? "Saved. You will be emailed when the next opportunity is posted."
        : "Saved. You will no longer be emailed when new opportunities are posted.",
    );
  }

  const state = on
    ? account.email
      ? `You are emailed at ${account.email} when new opportunities are posted.`
      : "You have asked to be emailed when new opportunities are posted, but no email address is held for you."
    : "You are not emailed when new opportunities are posted.";

  return (
    <section aria-labelledby="notification-optin-heading" style={optin} data-testid="notification-optin-control">
      <Heading level={2} id="notification-optin-heading">
        New opportunity emails
      </Heading>
      <Text elementType="p" data-testid="notification-optin-state">
        {state}
      </Text>
      {/* Not disabled while saving, which would take focus off it; a second press waits instead. */}
      <Button
        variant="secondary"
        onPress={() => (saving ? undefined : void change(!on))}
        data-testid="notification-optin-toggle"
      >
        {on ? "Stop emailing me about new opportunities" : "Email me about new opportunities"}
      </Button>
      <div role="status">
        {status ? <Text elementType="p">{status}</Text> : null}
        {failed ? <Text elementType="p">Your choice could not be saved. Nothing has changed. Please try again.</Text> : null}
      </div>
    </section>
  );
}
