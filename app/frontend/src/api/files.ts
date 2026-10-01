import { fileContentAddress } from "@rules/files";
import { api } from "./client";

/**
 * Stored files, through the contract's createAvatar, createFile and readFile. Every request
 * carries the signed-in person's bearer token, as every request from this app does.
 */

/** What storing a picture came back with. */
export type PictureAnswer =
  | { readonly kind: "stored"; readonly id: string }
  /** The service refused the file itself: its name, its content or its size. */
  | { readonly kind: "refused"; readonly reasons: readonly string[] }
  | { readonly kind: "failed" };

function reasonsIn(body: unknown): string[] {
  const errors = (body as { errors?: unknown } | null)?.errors;
  return Array.isArray(errors) ? errors.filter((reason): reason is string => typeof reason === "string") : [];
}

/**
 * Stores a profile picture or logo, readable by anyone (R-8.28). The service narrows it to fit
 * 500 pixels and refuses anything that is not a JPEG or PNG (R-8.13, R-8.21, R-8.30).
 */
export async function uploadPicture(file: File): Promise<PictureAnswer> {
  const form = new FormData();
  form.append("name", file.name);
  form.append("metadata", JSON.stringify([{ tag: "any" }]));
  form.append("file", file, file.name);
  try {
    const { data, error, response } = await api.POST("/api/avatars", { body: form as never });
    if (response.ok) {
      const id = (data as { id?: unknown } | undefined)?.id;
      return typeof id === "string" ? { kind: "stored", id } : { kind: "failed" };
    }
    if (response.status === 400 || response.status === 413) {
      return { kind: "refused", reasons: reasonsIn(error) };
    }
    return { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

/**
 * Stores an image placed into a page's body as an ordinary file readable by anyone, so every
 * reader of the page sees it (R-8.29). It is stored as soon as it is chosen, because its
 * reference has to go into the text.
 */
export async function uploadEmbeddedImage(file: File): Promise<PictureAnswer> {
  const form = new FormData();
  form.append("name", file.name);
  form.append("metadata", JSON.stringify([{ tag: "any" }]));
  form.append("file", file, file.name);
  try {
    const { data, error, response } = await api.POST("/api/files", { body: form as never });
    if (response.ok) {
      const id = (data as { id?: unknown } | undefined)?.id;
      return typeof id === "string" ? { kind: "stored", id } : { kind: "failed" };
    }
    if (response.status >= 400 && response.status < 500) {
      return { kind: "refused", reasons: reasonsIn(error) };
    }
    return { kind: "failed" };
  } catch {
    return { kind: "failed" };
  }
}

/** Where a stored file's content is read; a picture is shown straight from here. */
export const fileAddress = fileContentAddress;

/**
 * Saves a stored file to the person's device. The content is fetched by the app, with the
 * person's bearer token, rather than by following a link, so a file that only they may read
 * is still theirs to save (R-8.10).
 */
export async function downloadFile(fileId: string, name: string): Promise<boolean> {
  try {
    const { data, response } = await api.GET("/api/files/{id}", {
      params: { path: { id: fileId }, query: { type: "blob" } },
      parseAs: "blob",
    });
    if (!response.ok || !(data instanceof Blob)) return false;
    const address = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = address;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(address), 0);
    return true;
  } catch {
    return false;
  }
}
