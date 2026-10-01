import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FileTrigger, Toolbar } from "react-aria-components";
import {
  AlertDialog,
  Button,
  ButtonGroup,
  Form,
  Link,
  Modal,
  Text,
  TextArea,
  TextField,
} from "@bcgov/design-system-react-components";
import {
  ADDRESS_IN_USE,
  PageField,
  PageProblem,
  PAGE_FIELD_LABELS,
  bodyProblem,
  slugProblem,
  titleProblem,
} from "@rules/content";
import {
  EMBEDDED_IMAGE_PLACEHOLDER_ALT,
  FILE_SIZE_LIMIT_BYTES,
  FILE_SIZE_LIMIT_LABEL,
  IMAGE_SIGNATURE_LENGTH,
  IMAGE_TYPES,
  embeddedImageReference,
  imageKindOf,
} from "@rules/files";
import { PageWording, PublishAnswer } from "../api/content";
import { originOfThisApp } from "../api/client";
import { uploadEmbeddedImage } from "../api/files";
import { stack, statusRow } from "../app/layout";
import { Loading } from "../app/loading";
import { TitledAlert } from "../app/titled-alert";
import {
  FORMATTING_LABELS,
  Formatting,
  TextEdit,
  applyFormatting,
  insertImageReference,
} from "../lib/formatted-text/editing";

/**
 * The one form a page is written in, on the create screen and on the managing screen in edit
 * mode (design/DESIGN.md, content, "Forms and validation"): title, address and body, each
 * marked with its reason when the person leaves it (R-7.20, R-7.21); the address rule and the
 * full public address beside the address (R-7.21 note); the body editor with its formatting
 * buttons, its image control and its link to the formatting guide (R-7.26, R-8.29); and a
 * publish button that is unavailable until every field is valid and asks to be confirmed,
 * because a page is public as soon as it is published.
 */

const tools = { display: "flex", flexWrap: "wrap", gap: "var(--layout-margin-small)" } as const;

export const ADDRESS_RULE =
  "Use lowercase letters and numbers, in groups joined by single hyphens, like about-us. No capital letters, spaces or underscores, and no hyphen at the start or end.";

const FIELD_IDS: Readonly<Record<PageField, string>> = {
  title: "content-title",
  slug: "content-slug",
  body: "content-body",
};

const FORMATTING_ORDER: readonly Formatting[] = ["bold", "italic", "heading", "bulleted", "numbered", "link"];

export interface PageFormProps {
  /** Creating a page, or publishing a change to one. */
  readonly purpose: "create" | "change";
  readonly initial: PageWording;
  /** A page the service needs keeps its address (R-7.25). */
  readonly addressLocked?: boolean;
  /** Said once, before the fields. */
  readonly intro: ReactNode;
  readonly onCancel: () => void;
  readonly onPublish: (wording: PageWording) => Promise<PublishAnswer>;
  /** The page was published; the screen moves on. */
  readonly onPublished: (answer: Extract<PublishAnswer, { kind: "published" }>) => void;
}

const WORDS = {
  create: {
    button: "Publish page",
    buttonTestId: "content-publish-button",
    actions: "Page actions",
    toPublish: "to publish the page",
    ready: "You will be asked to confirm before the page is published.",
    dialogTitle: "Publish this page?",
    dialogTestId: "content-publish-dialog",
    confirmTestId: "content-publish-confirm",
    notPublished: "so this page was not created",
  },
  change: {
    button: "Publish changes",
    buttonTestId: "content-publish-changes-button",
    actions: "Edit actions",
    toPublish: "to publish your changes",
    ready: "You will be asked to confirm before your changes are published.",
    dialogTitle: "Publish your changes?",
    dialogTestId: "content-publish-changes-dialog",
    confirmTestId: "content-publish-changes-confirm",
    notPublished: "so your changes were not published",
  },
} as const;

/** The image control's last outcome, shown between the rule and the body (file-embedded-image). */
type ImageState =
  | { readonly kind: "idle" }
  | { readonly kind: "uploading"; readonly name: string }
  | { readonly kind: "inserted"; readonly name: string }
  | { readonly kind: "failed"; readonly name: string; readonly reason: string };

function megabytes(size: number): string {
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

/** Why a chosen image cannot be inserted, before anything is sent, or null. */
export async function checkChosenImage(file: Pick<File, "size" | "slice">): Promise<string | null> {
  if (file.size > FILE_SIZE_LIMIT_BYTES) {
    return `It is ${megabytes(file.size)}. Images must be ${FILE_SIZE_LIMIT_LABEL} or smaller. Nothing was added to the body.`;
  }
  try {
    const start = new Uint8Array(await file.slice(0, IMAGE_SIGNATURE_LENGTH).arrayBuffer());
    if (imageKindOf(start) === null) {
      return "It is not a JPEG or PNG image. Choose a JPEG or PNG image. Nothing was added to the body.";
    }
  } catch {
    // A file the browser cannot read here is left for the service to judge.
  }
  return null;
}

export function PageForm({
  purpose,
  initial,
  addressLocked = false,
  intro,
  onCancel,
  onPublish,
  onPublished,
}: PageFormProps) {
  const words = WORDS[purpose];
  const [wording, setWording] = useState<PageWording>(initial);
  const [touched, setTouched] = useState<ReadonlySet<PageField>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  /** The address the service last said another page holds (R-7.22). */
  const [addressInUse, setAddressInUse] = useState<string | null>(null);
  const [failure, setFailure] = useState<readonly string[] | null>(null);
  const [image, setImage] = useState<ImageState>({ kind: "idle" });
  const duplicateRef = useRef<HTMLDivElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const pendingSelection = useRef<{ start: number; end: number } | null>(null);

  const problems = useMemo(() => {
    const found: Partial<Record<PageField, PageProblem>> = {};
    const title = titleProblem(wording.title);
    const slug = addressLocked ? null : slugProblem(wording.slug);
    const body = bodyProblem(wording.body);
    if (title) found.title = title;
    if (slug) found.slug = slug;
    if (body) found.body = body;
    return found;
  }, [wording, addressLocked]);

  const ready = Object.keys(problems).length === 0;
  const shown = (["title", "slug", "body"] as const)
    .filter((field) => touched.has(field) && problems[field])
    .map((field) => problems[field] as PageProblem);
  const slugIsInUse = addressInUse !== null && addressInUse === wording.slug;

  useEffect(() => {
    if (addressInUse !== null) duplicateRef.current?.focus();
  }, [addressInUse]);

  useEffect(() => {
    if (failure) failureRef.current?.focus();
  }, [failure]);

  // A formatting button or an inserted image says where the selection goes once the new text
  // is drawn.
  useLayoutEffect(() => {
    const selection = pendingSelection.current;
    const textarea = bodyField();
    if (!selection || !textarea) return;
    pendingSelection.current = null;
    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
  });

  function bodyField(): HTMLTextAreaElement | null {
    return editorRef.current?.querySelector("textarea") ?? null;
  }

  function selectionOfBody(): { start: number; end: number } {
    const textarea = bodyField();
    if (!textarea) return { start: wording.body.length, end: wording.body.length };
    return { start: textarea.selectionStart, end: textarea.selectionEnd };
  }

  function change(field: PageField, value: string) {
    setWording((current) => ({ ...current, [field]: value }));
  }

  function leave(field: PageField) {
    setTouched((current) => (current.has(field) ? current : new Set([...current, field])));
  }

  function applyEdit(edit: TextEdit) {
    pendingSelection.current = { start: edit.selectionStart, end: edit.selectionEnd };
    change("body", edit.value);
  }

  function format(formatting: Formatting) {
    const { start, end } = selectionOfBody();
    applyEdit(applyFormatting(wording.body, start, end, formatting));
  }

  async function insertImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    // Where the cursor was when the image was chosen is where it goes.
    const at = selectionOfBody();
    const refusal = await checkChosenImage(file);
    if (refusal) {
      setImage({ kind: "failed", name: file.name, reason: refusal });
      return;
    }
    setImage({ kind: "uploading", name: file.name });
    const stored = await uploadEmbeddedImage(file);
    if (stored.kind !== "stored") {
      const reasons = stored.kind === "refused" && stored.reasons.length > 0 ? `${stored.reasons.join(" ")} ` : "The image could not be stored. ";
      setImage({ kind: "failed", name: file.name, reason: `${reasons}Nothing was added to the body.` });
      return;
    }
    setImage({ kind: "inserted", name: file.name });
    setWording((current) => {
      const edit = insertImageReference(
        current.body,
        at.start,
        at.end,
        embeddedImageReference(stored.id),
        EMBEDDED_IMAGE_PLACEHOLDER_ALT,
      );
      pendingSelection.current = { start: edit.selectionStart, end: edit.selectionEnd };
      return { ...current, body: edit.value };
    });
  }

  async function publish() {
    if (!ready || publishing) return;
    setPublishing(true);
    setFailure(null);
    const answer = await onPublish(wording);
    setPublishing(false);
    setConfirming(false);
    if (answer.kind === "published") {
      onPublished(answer);
      return;
    }
    if (answer.kind === "address-in-use") {
      setAddressInUse(wording.slug);
      setTouched((current) => new Set([...current, "slug"]));
      return;
    }
    setFailure(answer.kind === "refused" ? answer.reasons : []);
  }

  const fieldError = (field: PageField): string | undefined =>
    field === "slug" && slugIsInUse
      ? ADDRESS_IN_USE
      : touched.has(field)
        ? problems[field]?.message
        : undefined;

  const publicAddress = slugProblem(wording.slug)
    ? wording.slug === ""
      ? `Public address: ${originOfThisApp()}/content/`
      : "Public address: shown once the address is valid."
    : `Public address: ${originOfThisApp()}/content/${wording.slug}`;

  const addressDescription = addressLocked
    ? "The service needs this page at this address, so the address cannot be changed."
    : purpose === "change"
      ? "Changing the address moves the page at once. Links to the old address will stop working."
      : undefined;

  return (
    <>
      {addressInUse !== null ? (
        <div tabIndex={-1} ref={duplicateRef} data-testid="content-duplicate-slug-error">
          <TitledAlert variant="danger" role="alert" title="This address is already in use">
            <Text elementType="p">
              {`Another page is already published at /content/${addressInUse}, ${words.notPublished}. `}
              <Link href={`#${FIELD_IDS.slug}`}>Choose a different address</Link>.
            </Text>
          </TitledAlert>
        </div>
      ) : null}
      {failure ? (
        <div tabIndex={-1} ref={failureRef}>
          <TitledAlert
            variant="danger"
            role="alert"
            title={purpose === "create" ? "The page was not published" : "Your changes were not published"}
          >
            <Text elementType="p">
              {failure.length > 0 ? failure.join(" ") : "The service could not publish it. Nothing you entered has been lost. Try again."}
            </Text>
          </TitledAlert>
        </div>
      ) : null}
      {intro}
      <Form
        validationBehavior="aria"
        style={stack}
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) setConfirming(true);
        }}
      >
        <TextField
          id={FIELD_IDS.title}
          label="Title"
          isRequired
          description="Between 1 and 100 characters."
          value={wording.title}
          onChange={(value) => change("title", value)}
          onBlur={() => leave("title")}
          isInvalid={fieldError("title") !== undefined}
          errorMessage={fieldError("title")}
          data-testid="content-title-field"
        />
        {addressLocked ? (
          <TextField
            id={FIELD_IDS.slug}
            label="Address"
            isReadOnly
            description={addressDescription}
            value={wording.slug}
            data-testid="content-slug-field"
          />
        ) : (
          <div style={stack}>
            <TextField
              id={FIELD_IDS.slug}
              label="Address"
              isRequired
              description={addressDescription}
              value={wording.slug}
              onChange={(value) => change("slug", value)}
              onBlur={() => leave("slug")}
              isInvalid={fieldError("slug") !== undefined}
              errorMessage={fieldError("slug")}
              aria-describedby="content-slug-rule content-resulting-address"
              data-testid="content-slug-field"
            />
            <div id="content-slug-rule" data-testid="content-slug-rule">
              <Text elementType="p" size="small" color="secondary">
                {ADDRESS_RULE}
              </Text>
            </div>
            <div id="content-resulting-address" data-testid="content-resulting-address">
              <Text elementType="p" size="small" color="secondary">
                {publicAddress}
              </Text>
            </div>
          </div>
        )}
        <div style={stack} ref={editorRef}>
          <Toolbar aria-label="Formatting for Body" style={tools}>
            {FORMATTING_ORDER.map((formatting) => (
              <Button key={formatting} variant="tertiary" size="small" onPress={() => format(formatting)}>
                {FORMATTING_LABELS[formatting]}
              </Button>
            ))}
            <FileTrigger acceptedFileTypes={[...IMAGE_TYPES]} onSelect={(files) => void insertImage(files)}>
              <Button
                variant="tertiary"
                size="small"
                isDisabled={image.kind === "uploading"}
                aria-describedby="embedded-image-rule"
                data-testid="content-body-image-button"
              >
                Insert image
              </Button>
            </FileTrigger>
          </Toolbar>
          <div id="embedded-image-rule" data-testid="image-file-rule">
            <Text elementType="p" size="small" color="secondary">
              {`Insert image takes a JPEG or PNG image, up to ${FILE_SIZE_LIMIT_LABEL}. An inserted image is stored as soon as you choose it and anyone can see it.`}
            </Text>
          </div>
          {image.kind === "uploading" ? (
            <div style={statusRow} data-testid="embedded-image-uploading">
              <Loading label={`Uploading ${image.name}…`} />
            </div>
          ) : null}
          <div role="status">
            {image.kind === "inserted" ? (
              <Text elementType="p">
                {`${image.name} was inserted at the cursor. Replace "${EMBEDDED_IMAGE_PLACEHOLDER_ALT}" with a description of what it shows.`}
              </Text>
            ) : null}
          </div>
          {image.kind === "failed" ? (
            <div data-testid="embedded-image-error">
              <TitledAlert variant="danger" role="alert" title={`${image.name} could not be inserted`}>
                <Text elementType="p">{image.reason}</Text>
              </TitledAlert>
            </div>
          ) : null}
          <TextArea
            id={FIELD_IDS.body}
            label="Body"
            isRequired
            description="Formatted text, between 1 and 50,000 characters. An inserted image is placed at the cursor."
            value={wording.body}
            onChange={(value) => change("body", value)}
            onBlur={() => leave("body")}
            isInvalid={fieldError("body") !== undefined}
            errorMessage={fieldError("body")}
            data-testid="content-body-field"
          />
          <Text elementType="p" size="small">
            <Link href="/content/markdown-guide" target="_blank">
              How to format text (opens in a new tab)
            </Link>
          </Text>
        </div>
        {shown.length > 0 ? (
          <div id="content-publish-hint">
            <TitledAlert
              variant="danger"
              title={`Fix ${shown.length} ${shown.length === 1 ? "field" : "fields"} ${words.toPublish}`}
            >
              <ul>
                {shown.map((problem) => (
                  <li key={problem.field} data-testid="field-error">
                    <Link href={`#${FIELD_IDS[problem.field]}`}>
                      {`${PAGE_FIELD_LABELS[problem.field]}: ${problem.summary}`}
                    </Link>
                  </li>
                ))}
              </ul>
            </TitledAlert>
          </div>
        ) : (
          <Text elementType="p" id="content-publish-hint">
            {ready
              ? words.ready
              : purpose === "create"
                ? "Fill in the title, address and body to publish the page."
                : addressLocked
                  ? "Fill in the title and body to publish your changes."
                  : "Fill in the title, address and body to publish your changes."}
          </Text>
        )}
        <ButtonGroup ariaLabel={words.actions}>
          <Button variant="secondary" onPress={onCancel} data-testid="content-cancel-button">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isDisabled={!ready}
            aria-describedby="content-publish-hint"
            data-testid={words.buttonTestId}
          >
            {words.button}
          </Button>
        </ButtonGroup>
      </Form>
      <Modal isOpen={confirming} isDismissable onOpenChange={(open) => (publishing ? undefined : setConfirming(open))}>
        <AlertDialog
          variant="confirmation"
          title={words.dialogTitle}
          data-testid={words.dialogTestId}
          buttons={
            <>
              <Button
                variant="secondary"
                isDisabled={publishing}
                onPress={() => setConfirming(false)}
                data-testid="content-dialog-cancel"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                isDisabled={publishing}
                onPress={() => void publish()}
                data-testid={words.confirmTestId}
              >
                {words.button}
              </Button>
            </>
          }
        >
          <Text elementType="p">
            {purpose === "create"
              ? `"${wording.title}" will be public at /content/${wording.slug} as soon as it is published. Anyone can read it, including people who are not signed in.`
              : `Everyone reading /content/${wording.slug} will see the new wording straight away. The wording it replaces is kept on record, but it cannot be viewed or restored from the service.`}
          </Text>
        </AlertDialog>
      </Modal>
    </>
  );
}
