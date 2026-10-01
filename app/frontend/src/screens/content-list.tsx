import { useEffect, useState } from "react";
import { Heading, Link, Text } from "@bcgov/design-system-react-components";
import { useRouterState } from "@tanstack/react-router";
import { comparePagesByTitle } from "@rules/content";
import { Page, fetchPageList } from "../api/content";
import { AdministratorsOnly } from "../app/administrators-only";
import { page as pageLayout } from "../app/layout";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { readDate } from "../lib/dates";
import { RemovedPageNotice, contentNoticeOf } from "./content-notices";

/**
 * Content Management, at `/content` (content-list). An administrator sees every page once, in
 * order of title, with its public address, whether the service needs it, and when it was
 * created and last updated (R-7.5). On a fresh installation that is the pages the service
 * created for itself, each still titled by its address (R-7.12). Anybody else is shown the
 * missing page (R-7.6).
 */
export function ContentListScreen() {
  return (
    <AdministratorsOnly title="Content Management" loadingLabel="Loading pages…">
      {() => <ContentList />}
    </AdministratorsOnly>
  );
}

const toolbar = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
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

function DateCell({ iso, testId }: { iso: string; testId: string }) {
  const date = readDate(iso);
  return (
    <time dateTime={date?.dateTime} data-testid={testId}>
      {date?.label ?? ""}
    </time>
  );
}

function ContentList() {
  useScreenTitle("Content Management");
  const [answer, setAnswer] = useState<readonly Page[] | "loading" | "refused" | "failed">("loading");
  const removed = contentNoticeOf(useRouterState({ select: (state) => state.location.state }));

  useEffect(() => {
    let current = true;
    void fetchPageList().then((found) => {
      if (!current) return;
      setAnswer(found.kind === "listed" ? [...found.pages].sort(comparePagesByTitle) : found.kind);
    });
    return () => {
      current = false;
    };
  }, []);

  if (answer === "refused") return <NotFound />;
  return (
    <div style={pageLayout}>
      <div style={toolbar}>
        <Heading level={1}>Content Management</Heading>
        <Link href="/content/create" isButton buttonVariant="primary" data-testid="content-create-link">
          Create page
        </Link>
      </div>
      {removed?.kind === "removed" ? <RemovedPageNotice title={removed.title} slug={removed.slug} /> : null}
      {answer === "loading" ? (
        <Loading label="Loading pages…" />
      ) : answer === "failed" ? (
        <TitledAlert variant="danger" role="alert" title="The pages could not be loaded">
          <Text elementType="p">Reload the page to try again.</Text>
        </TitledAlert>
      ) : (
        <>
          <Text elementType="p">
            Pages marked "Needed by the service" are linked to or embedded by the service. Their title and body can be
            changed, but they cannot be moved to another address or removed.
          </Text>
          <div role="region" aria-labelledby="content-list-caption" tabIndex={0} style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }} data-testid="content-list-table">
              <caption id="content-list-caption" style={{ textAlign: "start" }}>
                <Text size="small" color="secondary">
                  Every page, in order of title
                </Text>
              </caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>
                    Title
                  </th>
                  <th scope="col" style={cell}>
                    Public address
                  </th>
                  <th scope="col" style={cell}>
                    Needed by the service
                  </th>
                  <th scope="col" style={cell}>
                    Created
                  </th>
                  <th scope="col" style={cell}>
                    Last updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {answer.map((page) => (
                  <tr key={page.id} data-testid="content-list-row">
                    <td style={cell}>
                      <Link href={`/content/${page.slug}/edit`} data-testid="content-list-title-link">
                        {page.title}
                      </Link>
                    </td>
                    <td style={cell}>
                      <Link href={`/content/${page.slug}`} data-testid="content-list-address-link">
                        {`/content/${page.slug}`}
                      </Link>
                    </td>
                    <td style={cell}>
                      <span data-testid="content-list-fixed">{page.fixed ? <span style={badge}>Yes</span> : "No"}</span>
                    </td>
                    <td style={cell}>
                      <DateCell iso={page.createdAt} testId="content-list-created" />
                    </td>
                    <td style={cell}>
                      <DateCell iso={page.updatedAt} testId="content-list-updated" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
