import { FormEvent, useState } from "react";
import { AlertDialog, Button, Form, Heading, Link, Modal, Text, TextArea } from "@bcgov/design-system-react-components";
import { fileContentAddress } from "@rules/files";
import { ADDENDUM_MAX, NOTE_MAX, addendumProblem, cancellationNoteProblem, historyEntryLabel } from "@rules/opportunities";
import { downloadFile } from "../api/files";
import { Addendum, Attachment, HistoryEntry, Reporting } from "../api/opportunities";
import { Stack } from "../app/page-layout";
import { readDate } from "../lib/dates";
import { Fact, momentLabel } from "./opportunity-parts";

/**
 * Running an opportunity once it is under way, as every program's manage page does it (design/
 * DESIGN.md, opportunities; decision record 0043): its addenda and the form that adds one
 * (R-1.32), its history with any private notes and their files, which no screen adds (R-1.33),
 * the dialog that cancels it (R-1.28), and the reporting figures on its summary (R-1.30). Nothing here knows which program it is in;
 * what is sent is the page's to say.
 */

/** What sending an action came to: nothing to say, or why it was refused. */
export type Sent = string | null;

/** "Addendum of September 20, 2026". */
export function addendumHeading(addendum: Addendum): string {
  const day = readDate(addendum.createdAt)?.label;
  return day ? `Addendum of ${day}` : "Addendum";
}

/**
 * Every addendum, oldest first, each under its own heading. On the manage page each says who added
 * it; on the public page it does not (opportunity-cwu-view).
 */
export function AddendaList({ addenda, showAuthor }: { addenda: readonly Addendum[]; showAuthor: boolean }) {
  if (addenda.length === 0) return <Text elementType="p">No addenda have been added.</Text>;
  return (
    <>
      {addenda.map((addendum, index) => (
        <Stack as="article" gap="small" aria-labelledby={`addendum-${index + 1}`} key={addendum.id} data-testid="addendum">
          <Heading level={3} id={`addendum-${index + 1}`}>
            {addendumHeading(addendum)}
          </Heading>
          {showAuthor && addendum.createdBy ? (
            <Text elementType="p" size="small" color="secondary">
              {`Added by ${addendum.createdBy.name}`}
            </Text>
          ) : null}
          <Text elementType="p">{addendum.description}</Text>
        </Stack>
      ))}
    </>
  );
}

/**
 * The Addenda tab: the addenda so far, and for the author and administrators the form that adds
 * one. It does not ask first; the sentence before its button says the addendum is permanent and
 * who will be emailed (R-1.32, R-1.35).
 */
export function AddendaTab({
  addenda,
  mayAdd,
  announced,
  onAdd,
}: {
  addenda: readonly Addendum[];
  mayAdd: boolean;
  /** Whether adding one emails anybody: not once the opportunity has been cancelled (R-1.35). */
  announced: boolean;
  onAdd: (addendum: string) => Promise<Sent>;
}) {
  const [text, setText] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function add(event: FormEvent) {
    event.preventDefault();
    if (sending) return;
    const local = addendumProblem(text);
    if (local) {
      setProblem(local);
      return;
    }
    setSending(true);
    const refusal = await onAdd(text);
    setSending(false);
    if (refusal === null) {
      setText("");
      setProblem(null);
    } else setProblem(refusal);
  }

  return (
    <>
      <AddendaList addenda={addenda} showAuthor />
      {mayAdd ? (
        <Form validationBehavior="aria" onSubmit={(event) => void add(event)}>
          <Stack gap="medium">
            <TextArea
              label="New addendum"
              isRequired
              description={`Up to ${ADDENDUM_MAX.toLocaleString("en-CA")} characters.`}
              value={text}
              onChange={(value) => {
                setText(value);
                if (problem) setProblem(null);
              }}
              isInvalid={problem !== null}
              errorMessage={problem ?? undefined}
              data-testid="addendum-text-field"
            />
            <Text elementType="p">
              {announced
                ? "An addendum cannot be changed or removed once it is added. Everyone watching this opportunity, everyone who has submitted a proposal, and its author will be emailed."
                : "An addendum cannot be changed or removed once it is added. Nobody is emailed, because this opportunity has been cancelled."}
            </Text>
            <div>
              <Button type="submit" variant="primary" isDisabled={sending} data-testid="addendum-add-button">
                Add addendum
              </Button>
            </div>
          </Stack>
        </Form>
      ) : null}
    </>
  );
}

const cell = {
  textAlign: "start",
  verticalAlign: "top",
  padding: "var(--layout-padding-small)",
  borderBottom: "var(--layout-border-width-small) solid var(--surface-color-border-default)",
} as const;

/** Every change of state and every event, newest first, with who made it (R-1.4, R-1.30). */
export function HistoryTable({ history }: { history: readonly HistoryEntry[] }) {
  return (
    <div role="region" aria-labelledby="history-caption" tabIndex={0} style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <caption id="history-caption" style={{ textAlign: "start" }}>
          <Text size="small" color="secondary">
            Every change of state and every event, newest first
          </Text>
        </caption>
        <thead>
          <tr>
            <th scope="col" style={cell}>
              Date
            </th>
            <th scope="col" style={cell}>
              Entry
            </th>
            <th scope="col" style={cell}>
              By
            </th>
            <th scope="col" style={cell}>
              Note
            </th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry, index) => (
            <tr key={`${entry.createdAt}-${index}`}>
              <td style={cell}>
                <time dateTime={entry.createdAt}>{momentLabel(entry.createdAt)}</time>
              </td>
              <td style={cell}>{historyEntryLabel(entry)}</td>
              <td style={cell}>{entry.createdBy?.name ?? ""}</td>
              <td style={cell}>
                <HistoryNote note={entry.note} attachments={entry.attachments} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** What a history entry's Note column holds: the note, and the files a private note carries. */
export function HistoryNote({ note, attachments }: { note: string | null; attachments: readonly Attachment[] }) {
  return (
    <>
      {note ? <span style={{ whiteSpace: "pre-wrap" }}>{note}</span> : null}
      {attachments.map((attachment) => (
        <span key={attachment.id}>
          {note ? " " : ""}
          {"Attachment: "}
          <Link
            href={fileContentAddress(attachment.id)}
            onClick={(event) => {
              event.preventDefault();
              void downloadFile(attachment.id, attachment.name);
            }}
          >
            {attachment.name}
          </Link>
        </span>
      ))}
    </>
  );
}

/**
 * The confirmation before an administrator cancels an opportunity, with an optional note of up to
 * 1,000 characters (R-1.28); its body says who will be told (R-1.36).
 */
export function CancelDialog({
  isOpen,
  isSending,
  onKeep,
  onConfirm,
}: {
  isOpen: boolean;
  isSending: boolean;
  onKeep: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const problem = cancellationNoteProblem(note);
  return (
    <Modal isOpen={isOpen} isDismissable onOpenChange={(open) => (!open && !isSending ? onKeep() : undefined)}>
      <AlertDialog
        variant="destructive"
        title="Cancel this opportunity?"
        data-testid="opportunity-cancel-dialog"
        buttons={
          <>
            <Button variant="secondary" isDisabled={isSending} onPress={onKeep} data-testid="opportunity-dialog-cancel">
              Keep opportunity
            </Button>
            <Button
              variant="primary"
              danger
              isDisabled={isSending || problem !== null}
              onPress={() => onConfirm(note)}
              data-testid="opportunity-cancel-confirm"
            >
              Cancel opportunity
            </Button>
          </>
        }
      >
        <Stack gap="medium">
          <Text elementType="p">
            It will stop accepting proposals, and this cannot be undone. Everyone watching it and everyone who has submitted a
            proposal will be told it has been cancelled, and its author will be told separately.
          </Text>
          <TextArea
            label="Note (optional)"
            description={`Up to ${NOTE_MAX.toLocaleString("en-CA")} characters.`}
            value={note}
            onChange={setNote}
            isInvalid={problem !== null}
            errorMessage={problem ?? undefined}
            data-testid="opportunity-cancel-note-field"
          />
        </Stack>
      </AlertDialog>
    </Modal>
  );
}

/**
 * The Summary tab's reporting figures, for the author and administrators once the opportunity is
 * published (R-1.30); before then, the sentence that says they are counted from publication.
 */
export function ReportingSection({ reporting, unpublished }: { reporting: Reporting | undefined; unpublished: boolean }) {
  if (unpublished || !reporting) {
    return unpublished ? (
      <Text elementType="p" size="small" color="secondary">
        Views, watchers and proposals are counted once the opportunity is published.
      </Text>
    ) : null;
  }
  return (
    <Stack as="section" gap="medium" aria-labelledby="reporting-heading">
      <Heading level={3} id="reporting-heading">
        Reporting
      </Heading>
      <Stack as="dl" direction="row" gap="medium">
        <Fact label="Views" testId="reporting-views">
          {String(reporting.numViews)}
        </Fact>
        <Fact label="Watchers" testId="reporting-watchers">
          {String(reporting.numWatchers)}
        </Fact>
        <Fact label="Proposals submitted" testId="reporting-proposals">
          {String(reporting.numProposals)}
        </Fact>
      </Stack>
    </Stack>
  );
}
