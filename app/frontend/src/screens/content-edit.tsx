import { useEffect, useState } from "react";
import {
  AlertDialog,
  Button,
  ButtonGroup,
  Heading,
  Link,
  Modal,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Author, ManagedPage, fetchManagedPage, publishChanges, removePage } from "../api/content";
import { AdministratorsOnly } from "../app/administrators-only";
import { definition, facts, page as pageLayout, stack, term } from "../app/layout";
import { Loading } from "../app/loading";
import { NotFound } from "../app/not-found";
import { useScreenTitle } from "../app/screen-title";
import { TitledAlert } from "../app/titled-alert";
import { readDate } from "../lib/dates";
import { PageForm } from "./content-form";
import {
  ChangesPublishedNotice,
  ContentNotice,
  PublishedPageNotice,
  contentNoticeOf,
  withContentNotice,
} from "./content-notices";

/**
 * A page's managing screen, at `/content/:slug/edit` (content-edit). An administrator sees the
 * page's public address, when it was published and last updated and by whom (R-7.27), and only
 * its current wording — no history and no way back to an earlier version (R-7.23). They can edit
 * it and publish the change (R-7.8), move it to a new address (R-7.24), and remove an ordinary
 * page (R-7.9). A page the service needs says so, keeps its address and offers no removal
 * (R-7.25). Anybody else, and an address no page holds, is shown the missing page (R-7.6).
 */
export function ContentEditScreen({ slug }: { slug: string }) {
  return (
    <AdministratorsOnly title="Manage a page" loadingLabel="Loading page…">
      {() => <ContentEdit slug={slug} />}
    </AdministratorsOnly>
  );
}

type Loaded = ManagedPage | "loading" | "missing";

function ContentEdit({ slug }: { slug: string }) {
  const navigate = useNavigate();
  const arrivedWith = contentNoticeOf(useRouterState({ select: (state) => state.location.state }));
  const [page, setPage] = useState<Loaded>("loading");
  const [notice, setNotice] = useState<ContentNotice | null>(arrivedWith);
  const [editing, setEditing] = useState(false);
  useScreenTitle(typeof page === "object" ? page.title : "Manage a page");

  useEffect(() => {
    // A page just moved to this address is already in hand.
    if (typeof page === "object" && page.slug === slug) return;
    let current = true;
    setPage("loading");
    void fetchManagedPage(slug).then((answer) => {
      if (current) setPage(answer.kind === "found" ? answer.page : "missing");
    });
    return () => {
      current = false;
    };
    // Only the address decides which page this screen manages.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (page === "missing") return <NotFound />;
  if (page === "loading") {
    return (
      <div style={pageLayout}>
        <Heading level={1}>Manage a page</Heading>
        <Loading label="Loading page…" />
      </div>
    );
  }

  const heading = (
    <div style={stack}>
      <Text elementType="p" size="small" color="secondary">
        Manage a page
      </Text>
      <Heading level={1}>{page.title}</Heading>
    </div>
  );
  const warning = page.fixed ? <NeededPageWarning slug={page.slug} /> : null;

  if (editing) {
    return (
      <div style={pageLayout}>
        {heading}
        {warning}
        <section aria-labelledby="content-edit-heading" style={stack}>
          <Heading level={2} id="content-edit-heading">
            Edit the page
          </Heading>
          <PageForm
            purpose="change"
            initial={{ title: page.title, slug: page.slug, body: page.body }}
            addressLocked={page.fixed}
            intro={
              <Text elementType="p">
                {page.fixed
                  ? "The title and body are required. Your changes are public as soon as you publish them."
                  : "Every field is required. Your changes are public as soon as you publish them."}
              </Text>
            }
            onCancel={() => setEditing(false)}
            onPublish={(wording) => publishChanges(page.id, wording)}
            onPublished={({ page: changed }) => {
              setPage(changed);
              setEditing(false);
              setNotice({ kind: "changes-published" });
              if (changed.slug !== slug) {
                // The page has moved; the screen follows it there, and nothing is left at the old
                // address (R-7.24).
                void navigate({
                  to: "/content/$slug/edit",
                  params: { slug: changed.slug },
                  replace: true,
                  state: withContentNotice({ kind: "changes-published" }) as never,
                });
              }
            }}
          />
        </section>
      </div>
    );
  }

  return (
    <ManagingView
      page={page}
      heading={heading}
      warning={warning}
      notice={notice}
      onEdit={() => {
        setNotice(null);
        setEditing(true);
      }}
      onRemoved={() =>
        void navigate({
          to: "/content",
          state: withContentNotice({ kind: "removed", title: page.title, slug: page.slug }) as never,
        })
      }
    />
  );
}

function NeededPageWarning({ slug }: { slug: string }) {
  return (
    <div data-testid="content-fixed-page-warning">
      <TitledAlert variant="warning" title="The service needs this page">
        <Text elementType="p">
          {`Parts of the service link to this page or show its text, so it must stay at /content/${slug}. You can change its title and body, but you cannot change its address or delete it.`}
        </Text>
      </TitledAlert>
    </div>
  );
}

/** Who published or last changed a page: the person, linked to their profile, or the service itself. */
function AuthorName({ author, testId }: { author: Author | null; testId: string }) {
  return author ? (
    <Link href={`/users/${author.id}`} data-testid={testId}>
      {author.name}
    </Link>
  ) : (
    <span data-testid={testId}>System</span>
  );
}

function DateFact({ iso, testId }: { iso: string; testId: string }) {
  const date = readDate(iso);
  return (
    <time dateTime={date?.dateTime} data-testid={testId}>
      {date?.label ?? ""}
    </time>
  );
}

function ManagingView({
  page,
  heading,
  warning,
  notice,
  onEdit,
  onRemoved,
}: {
  page: ManagedPage;
  heading: JSX.Element;
  warning: JSX.Element | null;
  notice: ContentNotice | null;
  onEdit: () => void;
  onRemoved: () => void;
}) {
  const [asking, setAsking] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);

  async function remove() {
    setRemoving(true);
    setRefusal(null);
    const answer = await removePage(page.id);
    setRemoving(false);
    setAsking(false);
    if (answer.kind === "removed") {
      onRemoved();
      return;
    }
    setRefusal(answer.kind === "refused" ? answer.reasons.join(" ") : "The service could not remove it. Try again.");
  }

  return (
    <div style={pageLayout}>
      {heading}
      {notice?.kind === "created" ? <PublishedPageNotice slug={page.slug} /> : null}
      {notice?.kind === "changes-published" ? <ChangesPublishedNotice slug={page.slug} /> : null}
      <dl style={facts}>
        <div>
          <dt style={term}>Public address</dt>
          <dd style={definition}>
            <Link href={`/content/${page.slug}`} data-testid="content-page-address">
              {`/content/${page.slug}`}
            </Link>
          </dd>
        </div>
        <div>
          <dt style={term}>Published</dt>
          <dd style={definition}>
            <DateFact iso={page.createdAt} testId="content-published-date" />
          </dd>
        </div>
        <div>
          <dt style={term}>Published by</dt>
          <dd style={definition}>
            <AuthorName author={page.createdBy} testId="content-published-by" />
          </dd>
        </div>
        <div>
          <dt style={term}>Last updated</dt>
          <dd style={definition}>
            <DateFact iso={page.updatedAt} testId="content-updated-date" />
          </dd>
        </div>
        <div>
          <dt style={term}>Last updated by</dt>
          <dd style={definition}>
            <AuthorName author={page.updatedBy} testId="content-updated-by" />
          </dd>
        </div>
      </dl>
      {refusal ? (
        <TitledAlert variant="danger" role="alert" title="The page was not removed">
          <Text elementType="p">{refusal}</Text>
        </TitledAlert>
      ) : null}
      {warning}
      <ButtonGroup ariaLabel="Page actions">
        <Button variant="primary" onPress={onEdit} data-testid="content-edit-button">
          Edit page
        </Button>
        {page.fixed ? null : (
          <Button variant="secondary" danger onPress={() => setAsking(true)} data-testid="content-delete-button">
            Delete page
          </Button>
        )}
      </ButtonGroup>
      <section aria-labelledby="content-current-heading" style={stack}>
        <Heading level={2} id="content-current-heading">
          Current wording
        </Heading>
        <TextField label="Title" isReadOnly value={page.title} data-testid="content-title-field" />
        <TextField label="Address" isReadOnly value={page.slug} data-testid="content-slug-field" />
        <TextArea label="Body" isReadOnly value={page.body} data-testid="content-body-field" />
      </section>
      <Modal isOpen={asking} isDismissable onOpenChange={(open) => (removing ? undefined : setAsking(open))}>
        <AlertDialog
          variant="destructive"
          title={`Delete “${page.title}”?`}
          data-testid="content-delete-dialog"
          buttons={
            <>
              <Button
                variant="secondary"
                isDisabled={removing}
                onPress={() => setAsking(false)}
                data-testid="content-dialog-cancel"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                danger
                isDisabled={removing}
                onPress={() => void remove()}
                data-testid="content-delete-confirm"
              >
                Delete page
              </Button>
            </>
          }
        >
          <Text elementType="p">
            {`The page and every earlier version of it will be removed permanently, and /content/${page.slug} will stop answering. Links to it from anywhere will lead to the not-found page. This cannot be undone.`}
          </Text>
        </AlertDialog>
      </Modal>
    </div>
  );
}
