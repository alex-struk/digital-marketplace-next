import { useEffect, useRef, useState } from "react";
import { Button, InlineAlert, Text } from "@bcgov/design-system-react-components";
import {
  FILE_SIZE_LIMIT_BYTES,
  FILE_SIZE_LIMIT_LABEL,
  IMAGE_TYPES,
  hasImageEnding,
} from "@rules/files";
import { fileAddress } from "../api/files";

/**
 * The profile picture (and, later, an organization's logo) as a host form offers it
 * (file-image-picker). The picture already stored is shown from its own address, as it was
 * stored; a newly chosen one is previewed from the person's device and uploaded only when the
 * host form is saved. The rule — the accepted types, the size limit, the resizing and who can
 * see it — is stated before a file is chosen (R-8.13, R-8.17, R-8.28, R-8.30).
 */

/** Why a chosen picture was turned down, by the picker or by the service. */
export interface PictureRejection {
  readonly name: string;
  readonly reason: string;
}

const picture = { display: "grid", gap: "var(--layout-margin-small)", justifyItems: "start" } as const;
const image = { maxWidth: "100%", height: "auto" } as const;
const hiddenInput = { display: "none" } as const;

export const IMAGE_RULE =
  `A JPEG or PNG image, up to ${FILE_SIZE_LIMIT_LABEL}. A picture wider or taller than 500 pixels is made smaller to fit, keeping its proportions. Anyone can see your profile picture, including people who are not signed in.`;

/**
 * Whether a chosen picture can be sent at all. The service makes the same checks, and its
 * answer is shown in the same place (design/DESIGN.md, files gap 7).
 */
export function checkChosenPicture(file: { name: string; size: number }): PictureRejection | null {
  if (!hasImageEnding(file.name)) {
    return {
      name: file.name,
      reason: "Choose a JPEG or PNG image. Its name must end in .jpg, .jpeg or .png. Your current picture has been kept.",
    };
  }
  if (file.size > FILE_SIZE_LIMIT_BYTES) {
    return {
      name: file.name,
      reason: `The picture is larger than ${FILE_SIZE_LIMIT_LABEL}. Choose one of ${FILE_SIZE_LIMIT_LABEL} or smaller. Your current picture has been kept.`,
    };
  }
  return null;
}

export function ImagePicker({
  storedFileId,
  chosen,
  rejection,
  onChoose,
}: {
  storedFileId: string | null;
  chosen: File | null;
  rejection: PictureRejection | null;
  onChoose: (file: File) => void;
}) {
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
  }, [rejection]);

  return (
    <div role="group" aria-labelledby="picture-label" style={picture}>
      <Text elementType="p" id="picture-label">
        Profile picture (optional)
      </Text>
      {chosen && preview !== null ? (
        <img
          src={preview}
          alt={`Preview of ${chosen.name}, your new profile picture`}
          style={image}
          data-testid="profile-image-preview"
        />
      ) : storedFileId ? (
        <img
          src={fileAddress(storedFileId)}
          alt="Your current profile picture"
          style={image}
          data-testid="profile-image"
        />
      ) : (
        <Text elementType="p" size="small" color="secondary">
          No profile picture has been added.
        </Text>
      )}
      {chosen && !rejection ? (
        <div role="status">
          <Text elementType="p">{`${chosen.name} is ready. Save your changes to use it as your profile picture.`}</Text>
        </div>
      ) : null}
      {rejection ? (
        <div data-testid="image-rejected-error" tabIndex={-1} ref={rejectionRef}>
          <InlineAlert variant="danger" role="alert">
            {/* The design system's alert shows no title of its own once it has children, and
                names itself by the element with this id, so the title is given here. */}
            <span className="title" id="alert-title">
              {`${rejection.name} cannot be used as a profile picture`}
            </span>
            <Text elementType="p">{rejection.reason}</Text>
          </InlineAlert>
        </div>
      ) : null}
      <div id="image-file-rule" data-testid="image-file-rule">
        <Text elementType="p" size="small" color="secondary">
          {IMAGE_RULE}
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
        aria-describedby="image-file-rule"
        data-testid="change-avatar"
        onPress={() => inputRef.current?.click()}
      >
        {storedFileId || chosen ? "Choose a different profile picture" : "Choose a profile picture"}
      </Button>
    </div>
  );
}
