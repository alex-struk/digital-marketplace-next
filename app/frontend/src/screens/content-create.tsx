import { Heading, Text } from "@bcgov/design-system-react-components";
import { useNavigate } from "@tanstack/react-router";
import { createPage } from "../api/content";
import { AdministratorsOnly } from "../app/administrators-only";
import { page } from "../app/layout";
import { useScreenTitle } from "../app/screen-title";
import { PageForm } from "./content-form";
import { withContentNotice } from "./content-notices";

/**
 * Create a New Page, at `/content/create` (content-create). An administrator gives a page its
 * title, address and body and confirms publishing it; it is public at its address at once and
 * they are taken to its managing screen (R-7.7). Anybody else is shown the missing page (R-7.6).
 */
export function ContentCreateScreen() {
  return (
    <AdministratorsOnly title="Create a New Page" loadingLabel="Loading…">
      {() => <ContentCreate />}
    </AdministratorsOnly>
  );
}

function ContentCreate() {
  useScreenTitle("Create a New Page");
  const navigate = useNavigate();
  return (
    <div style={page}>
      <Heading level={1}>Create a New Page</Heading>
      <PageForm
        purpose="create"
        initial={{ title: "", slug: "", body: "" }}
        intro={
          <Text elementType="p">
            Every field is required. A page can be read by anyone, including people who are not signed in, as soon as it
            is published.
          </Text>
        }
        onCancel={() => void navigate({ to: "/content" })}
        onPublish={createPage}
        onPublished={({ page: created }) =>
          void navigate({
            to: "/content/$slug/edit",
            params: { slug: created.slug },
            state: withContentNotice({ kind: "created" }) as never,
          })
        }
      />
    </div>
  );
}
