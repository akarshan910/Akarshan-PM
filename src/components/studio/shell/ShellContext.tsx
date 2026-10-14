/** The signed-in session and the sign-out action, for screens inside the shell. */
import { createContext, useContext } from "react";

import type { Session } from "~/lib/studio/repo";

export interface ShellApi {
  session: Session;
  signOut: (scope: "local" | "global") => void;
  /** Speaks a message in the shell's polite live region. */
  announce: (message: string) => void;
}

export const ShellContext = createContext<ShellApi | null>(null);

export function useShell(): ShellApi {
  const v = useContext(ShellContext);
  if (!v) throw new Error("useShell needs the Studio shell above it.");
  return v;
}
