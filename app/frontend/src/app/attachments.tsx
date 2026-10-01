import { useCallback, useRef, useState } from "react";
import { Button, Heading, Link, Text, TextField } from "@bcgov/design-system-react-components";
import {
  FILE_SIZE_LIMIT_BYTES,
  FILE_SIZE_LIMIT_LABEL,
  attachmentName,
  fileContentAddress,
  fileNameError,
  readableSize,
} from "@rules/files";
import { downloadFile } from "../api/files";
import { Attachment, uploadAttachment } from "../api/opportunities";
import { panel, plainList, row, tight } from "./layout";
import { TitledAlert } from "./titled-alert";

/**
 * The attachment control (design/DESIGN.md, files, file-attachment-control), shared by the
 * opportunity forms.
 *
 * The limit is stated before a file is chosen, and the trigger points at it (R-8.17). A new
 * attachment can be renamed until it is saved, with its original ending put back if it is left off
 * (R-8.27); an attachment already stored is shown with its name read-only. Files are stored when
 * the host form is saved, with no read access recorded against the file itself, so the opportunity
 * decides who may read them (R-8.19, R-8.20).
 */

/** A file chosen on this device and not yet stored. */
export interface NewAttachment {
  readonly key: string;
  readonly file: File;
  readonly typedName: string;
  /** Why the file cannot be attached: too large, or refused when it was stored. */
  readonly refusal: string | null;
  /** Shown once a save has been tried: the resulting name is not a name a file may have (R-8.23). */
  readonly nameError: string | null;
}

export const SIZE_RULE = `Any type of file, up to ${FILE_SIZE_LIMIT_LABEL} each.`;

/** The words on a row whose file is over the limit, giving its size and the limit (R-8.17). */
export function tooLargeMessage(file: Pick<File, "size">): string {
  return `It is ${readableSize(file.size)}. Attachments must be ${FILE_SIZE_LIMIT_LABEL} or smaller. Remove it, then attach a smaller file.`;
}

function nameErrorFor(attachment: NewAttachment): string | null {
  const name = attachmentName(attachment.file.name, attachment.typedName);
  const error = fileNameError(name);
  return error ? `${error} With its ending, this one is ${name.length}.` : null;
}

/** What storing the new attachments came to. */
export type StoredAttachments =
  | { readonly ok: true; readonly ids: readonly string[] }
  | { readonly ok: false };

/** The attachments a form is holding: those already stored that it keeps, and those it adds. */
export function useAttachments(initial: readonly Attachment[]) {
  const [kept, setKept] = useState<readonly Attachment[]>(initial);
  const [fresh, setFresh] = useState<readonly NewAttachment[]>([]);
  const counter = useRef(0);

  const add = useCallback((files: readonly File[]) => {
    setFresh((current) => [
      ...current,
      ...files.map((file) => {
        counter.current += 1;
        return {
          key: `new-${counter.current}`,
          file,
          typedName: "",
          refusal: file.size > FILE_SIZE_LIMIT_BYTES ? tooLargeMessage(file) : null,
          nameError: null,
        };
      }),
    ]);
  }, []);

  const rename = useCallback((key: string, typedName: string) => {
    setFresh((current) =>
      current.map((attachment) =>
        attachment.key === key
          ? { ...attachment, typedName, nameError: attachment.nameError ? nameErrorFor({ ...attachment, typedName }) : null }
          : attachment,
      ),
    );
  }, []);

  const removeNew = useCallback((key: string) => {
    setFresh((current) => current.filter((attachment) => attachment.key !== key));
  }, []);

  const removeKept = useCallback((id: string) => {
    setKept((current) => current.filter((attachment) => attachment.id !== id));
  }, []);

  /**
   * Stores every new attachment under its resulting name, and answers with the identifiers the
   * opportunity should carry. A row that cannot be stored — too large, a name of the wrong length,
   * or refused by the service — is marked with its reason, and nothing is saved.
   */
  const store = useCallback(async (): Promise<StoredAttachments> => {
    const checked = fresh.map((attachment) => ({ ...attachment, nameError: nameErrorFor(attachment) }));
    setFresh(checked);
    if (checked.some((attachment) => attachment.refusal || attachment.nameError)) return { ok: false };
    const ids: string[] = kept.map((attachment) => attachment.id);
    const stored: Attachment[] = [];
    for (const attachment of checked) {
      const answer = await uploadAttachment(attachment.file, attachmentName(attachment.file.name, attachment.typedName));
      if (answer.kind !== "stored") {
        const refusal =
          answer.kind === "refused" && answer.reasons.length > 0
            ? answer.reasons.join(" ")
            : "The file could not be stored. Try again.";
        setFresh((current) => current.map((row) => (row.key === attachment.key ? { ...row, refusal } : row)));
        return { ok: false };
      }
      stored.push(answer.attachment);
      ids.push(answer.attachment.id);
    }
    // Once the form is saved, what was added is stored like the rest.
    setKept((current) => [...current, ...stored]);
    setFresh([]);
    return { ok: true, ids };
  }, [fresh, kept]);

  return { kept, fresh, add, rename, removeNew, removeKept, store };
}

export type AttachmentsState = ReturnType<typeof useAttachments>;

const hiddenInput = { display: "none" } as const;

const item = {
  display: "grid",
  gap: "var(--layout-margin-small)",
  padding: "var(--layout-padding-small)",
  border: "var(--layout-border-width-small) solid var(--surface-color-border-medium)",
  borderRadius: "var(--layout-border-radius-medium)",
} as const;

/** A download link: the file's own address, fetched with the person's token when followed (R-8.10). */
function DownloadLink({ attachment }: { attachment: Attachment }) {
  return (
    <Link
      href={fileContentAddress(attachment.id)}
      data-testid="attachment-download-link"
      onClick={(event) => {
        event.preventDefault();
        void downloadFile(attachment.id, attachment.name);
      }}
    >
      {`Download ${attachment.name}`}
    </Link>
  );
}

/** The editable control, as the last card section of an opportunity form. */
export function AttachmentControl({ state, headingLevel }: { state: AttachmentsState; headingLevel: 2 | 3 }) {
  const input = useRef<HTMLInputElement>(null);
  const { kept, fresh } = state;
  const empty = kept.length === 0 && fresh.length === 0;
  return (
    <section aria-labelledby="form-attachments" style={panel}>
      <Heading level={headingLevel} id="form-attachments">
        Attachments
      </Heading>
      <Text elementType="p">
        Attach any documents proponents need. Anyone who can read this opportunity can read its attachments. Removing an
        attachment stops it being readable through this opportunity once you save.
      </Text>
      {empty ? (
        <Text elementType="p">No attachments have been added.</Text>
      ) : (
        <ul style={plainList} data-testid="attachment-list">
          {kept.map((attachment) => (
            <li key={attachment.id} style={item} data-testid="attachment-existing-row">
              <TextField
                label="Attachment name"
                value={attachment.name}
                isReadOnly
                description="Already stored, so its name cannot be changed."
                data-testid="attachment-existing-name"
              />
              <div style={row}>
                <DownloadLink attachment={attachment} />
                <Button
                  variant="secondary"
                  size="small"
                  aria-label={`Remove ${attachment.name}`}
                  data-testid="attachment-remove-button"
                  onPress={() => state.removeKept(attachment.id)}
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
          {fresh.map((attachment) => (
            <NewAttachmentRow key={attachment.key} attachment={attachment} state={state} />
          ))}
        </ul>
      )}
      <div id="attachment-size-limit" data-testid="attachment-size-limit">
        <Text elementType="p" size="small" color="secondary">
          {SIZE_RULE}
        </Text>
      </div>
      {/* The control's own file input, opened by the button. React Aria's FileTrigger is not used:
          the design system bundles its own copy of React Aria, so FileTrigger's press handler
          never reached its Button (as in the image picker and the body editor). */}
      <input
        ref={input}
        type="file"
        multiple
        tabIndex={-1}
        aria-hidden="true"
        style={hiddenInput}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          // Cleared so that choosing the same file again is still noticed.
          event.currentTarget.value = "";
          if (files.length > 0) state.add(files);
        }}
      />
      <div>
        <Button
          variant="secondary"
          aria-describedby="attachment-size-limit"
          data-testid="attachment-add-button"
          onPress={() => input.current?.click()}
        >
          Add attachment
        </Button>
      </div>
    </section>
  );
}

function NewAttachmentRow({ attachment, state }: { attachment: NewAttachment; state: AttachmentsState }) {
  const { file } = attachment;
  const resultId = `${attachment.key}-result`;
  const tooLarge = file.size > FILE_SIZE_LIMIT_BYTES;
  return (
    <li style={item} data-testid="attachment-new-row">
      <Text elementType="p">
        {tooLarge ? `New: ${file.name}, ${readableSize(file.size)}.` : `New: ${file.name}, ${readableSize(file.size)}. It is uploaded when you save.`}
      </Text>
      {attachment.refusal ? (
        <div data-testid="attachment-size-error">
          <TitledAlert
            variant="danger"
            role="alert"
            title={tooLarge ? `${file.name} is too large to attach` : `${file.name} could not be attached`}
          >
            <Text elementType="p">{attachment.refusal}</Text>
          </TitledAlert>
        </div>
      ) : (
        <div style={tight}>
          <TextField
            label={`Name for ${file.name} (optional)`}
            value={attachment.typedName}
            onChange={(value) => state.rename(attachment.key, value)}
            description={describeRename(file.name)}
            isInvalid={attachment.nameError !== null}
            errorMessage={attachment.nameError ?? undefined}
            aria-describedby={resultId}
            data-testid="attachment-name-field"
          />
          <div id={resultId} data-testid="attachment-resulting-name">
            <Text elementType="p" size="small" color="secondary">
              {`Will be saved as: ${attachmentName(file.name, attachment.typedName)}`}
            </Text>
          </div>
        </div>
      )}
      <div>
        <Button
          variant="secondary"
          size="small"
          aria-label={`Remove ${file.name}`}
          data-testid="attachment-remove-button"
          onPress={() => state.removeNew(attachment.key)}
        >
          Remove
        </Button>
      </div>
    </li>
  );
}

function describeRename(original: string): string {
  const dot = original.lastIndexOf(".");
  const ending = dot > 0 && dot < original.length - 1 ? original.slice(dot) : null;
  return ending
    ? `Leave it empty to keep the name ${original}. If you leave off the ending, ${ending} is added.`
    : `Leave it empty to keep the name ${original}.`;
}

/** The attachments on an opportunity's own page: download links, nothing to change (public-view). */
export function AttachmentList({
  attachments,
  heading = true,
}: {
  attachments: readonly Attachment[];
  /** Whether the list brings its own "Attachments" heading, as it does in a Description section. */
  heading?: boolean;
}) {
  if (attachments.length === 0) return null;
  return (
    <>
      {heading ? (
        <Heading level={3} id="view-attachments">
          Attachments
        </Heading>
      ) : null}
      <ul style={plainList} aria-labelledby={heading ? "view-attachments" : "form-attachments"} data-testid="attachment-list">
        {attachments.map((attachment) => (
          <li key={attachment.id} data-testid="attachment-existing-row">
            <DownloadLink attachment={attachment} />
          </li>
        ))}
      </ul>
    </>
  );
}
