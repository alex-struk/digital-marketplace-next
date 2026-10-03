import { useEffect, useRef, useState } from "react";
import { Button, InlineAlert, Text } from "@bcgov/design-system-react-components";
import {
  FILE_SIZE_LIMIT_BYTES,
  FILE_SIZE_LIMIT_LABEL,
  IMAGE_SIGNATURE_LENGTH,
  IMAGE_TYPES,
  hasImageEnding,
  imageKindOf,
} from "@rules/files";
import { fileAddress } from "../api/files";
import { Stack } from "./page-layout";

/**
 * The profile picture, or an organization's logo, as a host form offers it (file-image-picker;
 * the logo on organization-create and organization-edit). The image already stored is shown
 * from its own address, as it was stored; a newly chosen one is previewed from the person's
 * device and uploaded only when the host form is saved. The rule — the accepted types, the size
 * limit, the resizing and who can see it — is stated before a file is chosen (R-8.13, R-8.17,
 * R-8.28, R-8.30).
 */

/** Why a chosen image was turned down, by the picker or by the service. */
export interface PictureRejection {
  readonly name: string;
  readonly reason: string;
}

// Keeps an image inside its column. Not spacing.
const image = { maxWidth: "100%", height: "auto" } as const;
const hiddenInput = { display: "none" } as const;

export const IMAGE_RULE =
  `A JPEG or PNG image, up to ${FILE_SIZE_LIMIT_LABEL}. A picture wider or taller than 500 pixels is made smaller to fit, keeping its proportions. Anyone can see your profile picture, including people who are not signed in.`;

export const LOGO_RULE =
  `A JPEG or PNG image, up to ${FILE_SIZE_LIMIT_LABEL}. A logo wider or taller than 500 pixels is made smaller to fit, keeping its proportions. Anyone can see the logo, including people who are not signed in.`;

/**
 * What the picker is choosing. The two differ only in their words and in the test IDs each
 * page's surface gives the trigger and the refusal (spec/contract/surface.yaml).
 */
export type PickedImage = "picture" | "logo";

/** What to say once a chosen image has been turned down, so the person knows nothing changed. */
export function keptSentence(subject: PickedImage): string {
  return subject === "logo"
    ? "Please select a different logo image. The current logo has been kept."
    : "Your current picture has been kept.";
}

/** A chosen file, as far as the picker reads it: its name, its size and its first bytes. */
export type ChosenFile = Pick<Blob, "size" | "slice"> & { readonly name: string };

/**
 * Whether a chosen image can be sent at all: its name's ending, its size, and what its first
 * bytes say it is (R-8.21, R-8.30). The service makes the same checks, and its answer is shown
 * in the same place (design/DESIGN.md, files gap 7).
 */
export async function checkChosenPicture(
  file: ChosenFile,
  subject: PickedImage = "picture",
): Promise<PictureRejection | null> {
  const byName = checkNameAndSize(file, subject);
  if (byName) return byName;
  let start: Uint8Array;
  try {
    start = new Uint8Array(await file.slice(0, IMAGE_SIGNATURE_LENGTH).arrayBuffer());
  } catch {
    // A file the browser cannot read here is left for the service to judge when it is sent.
    return null;
  }
  if (imageKindOf(start) === null) {
    return {
      name: file.name,
      reason: `Its content is not a JPEG or PNG image, whatever its name says. Choose a JPEG or PNG image. ${keptSentence(subject)}`,
    };
  }
  return null;
}

function checkNameAndSize(file: { name: string; size: number }, subject: PickedImage): PictureRejection | null {
  if (!hasImageEnding(file.name)) {
    return {
      name: file.name,
      reason: `Choose a JPEG or PNG image. Its name must end in .jpg, .jpeg or .png. ${keptSentence(subject)}`,
    };
  }
  if (file.size > FILE_SIZE_LIMIT_BYTES) {
    return {
      name: file.name,
      reason: `The ${subject === "logo" ? "logo" : "picture"} is larger than ${FILE_SIZE_LIMIT_LABEL}. Choose one of ${FILE_SIZE_LIMIT_LABEL} or smaller. ${keptSentence(subject)}`,
    };
  }
  return null;
}

const WORDS = {
  picture: {
    label: "Profile picture (optional)",
    labelId: "picture-label",
    ruleId: "image-file-rule",
    rule: IMAGE_RULE,
    none: "No profile picture has been added.",
    stored: () => "Your current profile picture",
    preview: (name: string) => `Preview of ${name}, your new profile picture`,
    ready: (name: string) => `${name} is ready. Save your changes to use it as your profile picture.`,
    refused: (name: string) => `${name} cannot be used as a profile picture`,
    choose: "Choose a profile picture",
    chooseAnother: "Choose a different profile picture",
    triggerTestId: "change-avatar",
    storedTestId: "profile-image" as string | undefined,
    previewTestId: "profile-image-preview" as string | undefined,
    refusedTestId: "image-rejected-error",
  },
  logo: {
    label: "Logo (optional)",
    labelId: "logo-label",
    ruleId: "logo-file-rule",
    rule: LOGO_RULE,
    none: "No logo has been added.",
    stored: (owner: string) => `${owner} logo`,
    preview: (name: string) => `Preview of ${name}, the new logo`,
    ready: (name: string) => `${name} is ready. Save your changes to use it as the logo.`,
    refused: (name: string) => `${name} cannot be used as a logo`,
    choose: "Choose a logo (optional)",
    chooseAnother: "Choose a different logo",
    triggerTestId: "organization-logo-button",
    // The stored logo carries its test ID on the read-only Organization tab, not in the form.
    storedTestId: undefined,
    previewTestId: undefined,
    refusedTestId: "organization-logo-refused-error",
  },
} as const;

export function ImagePicker({
  subject = "picture",
  ownerName = "",
  storedFileId,
  chosen,
  rejection,
  rejectionFocus = 0,
  onChoose,
}: {
  subject?: PickedImage;
  /** Whose logo it is, for the stored logo's description. */
  ownerName?: string;
  storedFileId: string | null;
  chosen: File | null;
  rejection: PictureRejection | null;
  /** Raised by the host form to bring a refusal that is already showing back into focus. */
  rejectionFocus?: number;
  onChoose: (file: File) => void;
}) {
  const words = WORDS[subject];
  const [preview, setPreview] = useState<string | null>(null);
  const rejectionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let address: string | null = null;
    try {
      address = chosen ? URL.createObjectURL(chosen) : null;
    } catch {
      // A browser that cannot preview the file still uploads it; only the preview is missing.
    }
    setPreview(address);
    return () => {
      if (address) URL.revokeObjectURL(address);
    };
  }, [chosen]);

  useEffect(() => {
    if (rejection) rejectionRef.current?.focus();
  }, [rejection, rejectionFocus]);

  return (
    <Stack role="group" aria-labelledby={words.labelId} gap="small" align="start">
      <Text elementType="p" id={words.labelId}>
        {words.label}
      </Text>
      {chosen && preview !== null ? (
        <img src={preview} alt={words.preview(chosen.name)} style={image} data-testid={words.previewTestId} />
      ) : storedFileId ? (
        <img src={fileAddress(storedFileId)} alt={words.stored(ownerName)} style={image} data-testid={words.storedTestId} />
      ) : (
        <Text elementType="p" size="small" color="secondary">
          {words.none}
        </Text>
      )}
      {chosen && !rejection ? (
        <div role="status">
          <Text elementType="p">{words.ready(chosen.name)}</Text>
        </div>
      ) : null}
      {rejection ? (
        <div data-testid={words.refusedTestId} tabIndex={-1} ref={rejectionRef}>
          <InlineAlert variant="danger" role="alert">
            {/* The design system's alert shows no title of its own once it has children, and
                names itself by the element with this id, so the title is given here. */}
            <span className="title" id="alert-title">
              {words.refused(rejection.name)}
            </span>
            <Text elementType="p">{rejection.reason}</Text>
          </InlineAlert>
        </div>
      ) : null}
      <div id={words.ruleId} data-testid="image-file-rule">
        <Text elementType="p" size="small" color="secondary">
          {words.rule}
        </Text>
      </div>
      {/* The picker's own file input, opened by the button. React Aria's FileTrigger is not used:
          its press handler did not reach the design system's Button, so in a real browser the
          button opened no file chooser. */}
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        tabIndex={-1}
        aria-hidden="true"
        style={hiddenInput}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          // Cleared so that choosing the same file again is still noticed.
          event.currentTarget.value = "";
          if (file) onChoose(file);
        }}
      />
      <Button
        variant="secondary"
        aria-describedby={words.ruleId}
        data-testid={words.triggerTestId}
        onPress={() => inputRef.current?.click()}
      >
        {storedFileId || chosen ? words.chooseAnother : words.choose}
      </Button>
    </Stack>
  );
}
