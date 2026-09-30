import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";

/**
 * Moves to an address given whole, query and all, in place of the one being left.
 *
 * The router is told the path and the query separately: handed a whole address it keeps the
 * path and drops the query, which is where the page sign-in began from is carried (R-4.22).
 */
export function useGoTo(): (address: string) => void {
  const navigate = useNavigate();
  return useCallback(
    (address: string) => {
      const url = new URL(address, "http://this.app");
      const search = Object.fromEntries(url.searchParams.entries());
      void navigate({
        to: url.pathname as never,
        search: search as never,
        hash: url.hash ? url.hash.slice(1) : undefined,
        replace: true,
      });
    },
    [navigate],
  );
}
