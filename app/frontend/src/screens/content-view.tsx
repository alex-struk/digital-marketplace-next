import { useEffect, useState } from "react";
import {
  Heading,
  ProgressCircle,
  Text,
} from "@bcgov/design-system-react-components";
import { Page, PageAnswer, fetchPage } from "../api/content";
import { FormattedText } from "../lib/formatted-text/formatted-text";
import { readDate } from "../lib/dates";
import { NotFound } from "../app/not-found";
import { useScreenTitle } from "../app/screen-title";
import { definition, facts, page as pageLayout, stack, statusRow, term } from "../app/layout";

/**
 * A page of the service's own prose, at its own address.
 *
 * Anyone can read it, including a visitor who has not signed in, and it shows the page's
 * title, its body as formatted text, and the dates it was first published and last updated
 * (R-7.1). No authorship is shown: that is for an administrator on the managing screen.
 */
export function ContentViewScreen({ address }: { readonly address: string }) {
  const [answer, setAnswer] = useState<PageAnswer | null>(null);

  useEffect(() => {
    let reading = true;
    setAnswer(null);
    void fetchPage(address).then((result) => {
      if (reading) setAnswer(result);
    });
    return () => {
      reading = false;
    };
  }, [address]);

  if (answer === null) return <LoadingPage />;
  // An address no page holds, an address that is not well formed, and a page that cannot be
  // read all come to the same screen (R-7.2, R-7.3).
  if (answer.kind === "missing") return <NotFound />;
  return <PublishedPage page={answer.page} />;
}

function LoadingPage() {
  return (
    <div style={pageLayout}>
      <div style={statusRow} role="status">
        <ProgressCircle isIndeterminate aria-label="Loading page" />
        <Text>Loading page…</Text>
      </div>
    </div>
  );
}

export function PublishedPage({ page }: { readonly page: Page }) {
  // The browser calls this screen by the page's own title.
  useScreenTitle(page.title);
  const published = readDate(page.createdAt);
  const updated = readDate(page.updatedAt);
  return (
    <article
      style={pageLayout}
      aria-labelledby="content-page-heading"
      data-testid="content-page"
    >
      <div style={stack}>
        <Heading level={1} id="content-page-heading">
          <span data-testid="content-page-title">{page.title}</span>
        </Heading>
        <dl style={facts}>
          <div>
            <dt style={term}>Published</dt>
            <dd style={definition}>
              <time
                dateTime={published?.dateTime}
                data-testid="content-published-date"
              >
                {published?.label ?? ""}
              </time>
            </dd>
          </div>
          <div>
            <dt style={term}>Last updated</dt>
            <dd style={definition}>
              <time
                dateTime={updated?.dateTime}
                data-testid="content-updated-date"
              >
                {updated?.label ?? ""}
              </time>
            </dd>
          </div>
        </dl>
      </div>
      <FormattedText markup={page.body} testId="content-page-body" />
      <Text elementType="p" size="small" color="secondary">
        Address of this page:{" "}
        <span data-testid="content-page-address">{`/content/${page.slug}`}</span>
      </Text>
    </article>
  );
}
