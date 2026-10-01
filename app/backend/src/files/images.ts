import * as jpeg from "jpeg-js";
import { PNG } from "pngjs";
import { storedImageSize } from "../rules/files";

/**
 * Profile pictures and organization logos (R-8.13, R-8.21).
 *
 * Done in plain JavaScript (jpeg-js and pngjs) rather than with a native image library, so the
 * service's image has nothing to compile and runs the same on every platform it is built for.
 */

export type ImageKind = "jpeg" | "png";

interface Bitmap {
  readonly width: number;
  readonly height: number;
  /** Four bytes a pixel: red, green, blue, alpha. */
  readonly data: Uint8Array;
}

/** What the content's first bytes say it is. The name is never consulted. */
export function imageKindOf(content: Uint8Array): ImageKind | null {
  if (content.length >= 3 && content[0] === 0xff && content[1] === 0xd8 && content[2] === 0xff) {
    return "jpeg";
  }
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (content.length >= 8 && signature.every((byte, index) => content[index] === byte)) {
    return "png";
  }
  return null;
}

function decode(kind: ImageKind, content: Buffer): Bitmap {
  if (kind === "jpeg") {
    const image = jpeg.decode(content, {
      useTArray: true,
      formatAsRGBA: true,
      maxMemoryUsageInMB: 1024,
    });
    return { width: image.width, height: image.height, data: image.data };
  }
  const image = PNG.sync.read(content);
  return { width: image.width, height: image.height, data: image.data };
}

function encode(kind: ImageKind, bitmap: Bitmap): Buffer {
  if (kind === "jpeg") {
    return jpeg.encode(
      { width: bitmap.width, height: bitmap.height, data: Buffer.from(bitmap.data) },
      90,
    ).data;
  }
  const png = new PNG({ width: bitmap.width, height: bitmap.height });
  png.data = Buffer.from(bitmap.data);
  return PNG.sync.write(png);
}

/**
 * Shrinks a bitmap by averaging every source pixel that falls under each target pixel, which
 * keeps a much-reduced picture smooth rather than speckled.
 */
export function shrink(source: Bitmap, width: number, height: number): Bitmap {
  const data = new Uint8Array(width * height * 4);
  const xScale = source.width / width;
  const yScale = source.height / height;
  for (let ty = 0; ty < height; ty++) {
    const y0 = Math.floor(ty * yScale);
    const y1 = Math.max(y0 + 1, Math.min(source.height, Math.floor((ty + 1) * yScale)));
    for (let tx = 0; tx < width; tx++) {
      const x0 = Math.floor(tx * xScale);
      const x1 = Math.max(x0 + 1, Math.min(source.width, Math.floor((tx + 1) * xScale)));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = y0; sy < y1; sy++) {
        let offset = (sy * source.width + x0) * 4;
        for (let sx = x0; sx < x1; sx++) {
          r += source.data[offset] as number;
          g += source.data[offset + 1] as number;
          b += source.data[offset + 2] as number;
          a += source.data[offset + 3] as number;
          offset += 4;
        }
      }
      const count = (y1 - y0) * (x1 - x0);
      const target = (ty * width + tx) * 4;
      data[target] = Math.round(r / count);
      data[target + 1] = Math.round(g / count);
      data[target + 2] = Math.round(b / count);
      data[target + 3] = Math.round(a / count);
    }
  }
  return { width, height, data };
}

export type PreparedPicture =
  | { readonly ok: true; readonly content: Buffer; readonly resized: boolean }
  | { readonly ok: false };

/**
 * A picture or logo as it is to be stored.
 *
 * Its content must read as a JPEG or a PNG, whatever its name says; anything else is refused
 * (R-8.21). One wider or taller than the limits is made smaller to fit, keeping its proportions,
 * and stored in the format it came in (R-8.13). One that reads but cannot be made smaller is
 * kept at its own size rather than refused (R-8.21).
 */
export function preparePicture(content: Buffer): PreparedPicture {
  const kind = imageKindOf(content);
  if (!kind) return { ok: false };

  let bitmap: Bitmap;
  try {
    bitmap = decode(kind, content);
  } catch {
    return { ok: false };
  }
  if (bitmap.width < 1 || bitmap.height < 1) return { ok: false };

  const target = storedImageSize(bitmap.width, bitmap.height);
  if (target.width === bitmap.width && target.height === bitmap.height) {
    return { ok: true, content, resized: false };
  }
  try {
    return { ok: true, content: encode(kind, shrink(bitmap, target.width, target.height)), resized: true };
  } catch {
    return { ok: true, content, resized: false };
  }
}

/** The width and height a stored picture's content reads as, or null if it does not read. */
export function imageSizeOf(content: Buffer): { width: number; height: number } | null {
  const kind = imageKindOf(content);
  if (!kind) return null;
  try {
    const { width, height } = decode(kind, content);
    return { width, height };
  } catch {
    return null;
  }
}
