import { useEffect } from "react";

/**
 * What the browser calls the screen. It is the page's own title on a page of the service's
 * prose, and the screen's name everywhere else (design/DESIGN.md, "Document title and
 * focus").
 */
export function useScreenTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
