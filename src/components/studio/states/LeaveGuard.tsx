/**
 * Leaving with unsynced changes (StudioStates): the browser's own prompt (`beforeunload`) while any
 * edit hasn't reached the database, and, for Studio's own links while offline, the in-app dialog
 * "Some changes haven't synced yet" with Stay and Leave anyway.
 */
import { useEffect } from "react";
import { useBlocker } from "react-router";

import { Dialog } from "../Dialog";
import { unsyncedNow, useUnsynced } from "../unsynced";

export function LeaveGuard() {
  const { any, offline } = useUnsynced();

  useEffect(() => {
    if (!any) return;
    const onLeave = (e: BeforeUnloadEvent) => {
      if (!unsyncedNow().any) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [any]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => offline && currentLocation.pathname !== nextLocation.pathname,
  );

  return (
    <Dialog
      open={blocker.state === "blocked"}
      onOpenChange={(o) => {
        if (!o && blocker.state === "blocked") blocker.reset();
      }}
      title="Some changes haven’t synced yet"
      description="You’re offline. They’re saved on this device and will sync the next time you open Studio here."
      cancelLabel="Stay"
      confirmLabel="Leave anyway"
      onConfirm={() => {
        if (blocker.state === "blocked") blocker.proceed();
      }}
    />
  );
}
