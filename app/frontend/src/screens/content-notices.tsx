import { Text } from "@bcgov/design-system-react-components";
import { TitledAlert } from "../app/titled-alert";

/**
 * What a content screen tells the person it has just sent them to: the managing screen of a page
 * they have just created (R-7.7) or changed (R-7.8), or the list after a page was removed
 * (R-7.9). It travels in the history entry's state, so it is said once, on arrival, and a
 * reload does not say it again.
 */
export type ContentNotice =
  | { readonly kind: "created" }
  | { readonly kind: "changes-published" }
  | { readonly kind: "removed"; readonly title: string; readonly slug: string };

const KEY = "contentNotice";

/** The history state that carries a notice to the next screen. */
export function withContentNotice(notice: ContentNotice): Record<string, unknown> {
  return { [KEY]: notice };
}

/** The notice the history entry carries, if any. */
export function contentNoticeOf(state: unknown): ContentNotice | null {
  const notice = (state as Record<string, unknown> | null | undefined)?.[KEY] as ContentNotice | undefined;
  if (!notice || typeof notice !== "object") return null;
  if (notice.kind === "created" || notice.kind === "changes-published") return notice;
  if (notice.kind === "removed" && typeof notice.title === "string" && typeof notice.slug === "string") {
    return notice;
  }
  return null;
}

export function PublishedPageNotice({ slug }: { slug: string }) {
  return (
    <div data-testid="content-published-success">
      <TitledAlert variant="success" role="status" title="Page published">
        <Text elementType="p">{`Anyone can now read it at /content/${slug}.`}</Text>
      </TitledAlert>
    </div>
  );
}

export function ChangesPublishedNotice({ slug }: { slug: string }) {
  return (
    <div data-testid="content-changes-published-success">
      <TitledAlert variant="success" role="status" title="Changes published">
        <Text elementType="p">{`Readers of /content/${slug} now see the new wording.`}</Text>
      </TitledAlert>
    </div>
  );
}

export function RemovedPageNotice({ title, slug }: { title: string; slug: string }) {
  return (
    <div data-testid="content-deleted-success">
      <TitledAlert variant="success" role="status" title="Page removed">
        <Text elementType="p">
          {`"${title}" and every earlier version of it have been removed. Its address, /content/${slug}, no longer answers.`}
        </Text>
      </TitledAlert>
    </div>
  );
}
