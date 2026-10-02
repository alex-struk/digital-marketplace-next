import { useEffect, useMemo, useRef, useState } from "react";
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
import { LIST_RETRY_DELAYS_MS, ListedOpportunity, listAllOpportunities } from "../api/opportunity-list";
import { setWatching } from "../api/watching";
import { card } from "../app/layout";
import { Stack } from "../app/page-layout";
import { Loading, useLoadingShown } from "../app/loading";
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

  // What the service lists depends on who asks. The list is asked for at once, beside the question
  // of who is asking — the browser asks both with the same sign-in — and its answer is kept when
  // the session is known. It is asked again only if who is asking changes after that (decision
  // record 0039).
  const asking = useRef<{ whom: string | null | undefined; serial: number } | null>(null);
  const serial = useRef(0);
  useEffect(() => {
    const whom = ready ? viewerId : undefined;
    const current = asking.current;
    if (current && (current.whom === whom || current.whom === undefined)) {
      current.whom = whom;
      return;
    }
    const mine = ++serial.current;
    asking.current = { whom, serial: mine };
    setListing({ kind: "loading" });
    setWatched({});
    void listAllOpportunities(LIST_RETRY_DELAYS_MS).then((answer) => {
      if (asking.current?.serial === mine) setListing(answer.kind === "listed" ? answer : { kind: "failed" });
    });
  }, [ready, viewerId]);

  const shown = useMemo(
    () => (listing.kind === "listed" ? listing.opportunities.filter((opportunity) => matchesFilters(opportunity, filters)) : []),
    [listing, filters],
  );

  // Who is asking decides the groups, so the list is drawn once both are known.
  const loading = listing.kind === "loading" || !ready;
  const loadingShown = useLoadingShown(loading);

  if (loading) {
    // Drawn whole once it has arrived; the loading state only if that takes a while (decision record 0039).
    if (!loadingShown) return null;
    return (
      <Stack gap="large">
        <Heading level={1}>Opportunities</Heading>
        <Loading label="Loading opportunities…" />
      </Stack>
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
    <Stack gap="large">
      <Heading level={1}>Opportunities</Heading>
      <form role="search" aria-label="Filter opportunities" onSubmit={(event) => event.preventDefault()}>
        <Stack direction="row" align="end" gap="medium">
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
        </Stack>
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
        ? LIST_GROUPS.filter((group) => group !== "unpublished" || staff || groups.unpublished.length > 0).map((group) => (
            <Stack as="section" gap="medium" key={group} aria-labelledby={`group-${group}`} data-testid={`opportunity-group-${group}`}>
              <Heading level={2} id={`group-${group}`}>
                {GROUP_HEADINGS[group].heading}
              </Heading>
              <Text elementType="p" size="small" color="secondary">
                {GROUP_HEADINGS[group].order}
              </Text>
              {groups[group].length === 0 ? (
                <Text elementType="p">{GROUP_HEADINGS[group].none}</Text>
              ) : (
                <Stack as="ul" gap="medium">
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
                </Stack>
              )}
            </Stack>
          ))
        : null}
    </Stack>
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
      <Stack gap="small">
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
      </Stack>
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
    <section aria-labelledby="notification-optin-heading" style={card} data-testid="notification-optin-control">
      <Stack direction="row" gap="medium" align="center">
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
      </Stack>
    </section>
  );
}
