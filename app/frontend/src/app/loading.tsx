import { useEffect, useState } from "react";
import { ProgressCircle, Text } from "@bcgov/design-system-react-components";
import { Stack } from "./page-layout";

/**
 * Something is on its way: an indeterminate progress circle and the same words as visible
 * text, in a status region, with focus left where it is (design/DESIGN.md, "Loading").
 */
export function Loading({ label }: { label: string }) {
  return (
    <Stack direction="row" align="center" gap="small" role="status">
      <ProgressCircle isIndeterminate aria-label={label} />
      <Text>{label}</Text>
    </Stack>
  );
}

/**
 * How long something may take before a screen says it is loading. Under this, the screen is
 * drawn once, whole, when what it shows has arrived, rather than first as a heading over a
 * spinner that is replaced a moment later (decision record 0039).
 */
export const LOADING_SHOWN_AFTER_MS = 1000;

/**
 * Whether a screen that is still `loading` should now show its loading state: only once it has
 * been loading for `after` milliseconds. False again as soon as loading ends.
 */
export function useLoadingShown(loading: boolean, after: number = LOADING_SHOWN_AFTER_MS): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!loading) {
      setShown(false);
      return;
    }
    const timer = setTimeout(() => setShown(true), after);
    return () => clearTimeout(timer);
  }, [loading, after]);
  return loading && shown;
}
