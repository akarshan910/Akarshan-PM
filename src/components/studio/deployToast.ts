/**
 * The toast after a publish. When the site rebuilt, the given message; when the deploy hook
 * failed (`deployed: false`), it says so and offers "Try again", which asks pm-publish to rebuild
 * without publishing anything again (`{ action: "deploy", kind: "site" }`).
 */
import type { StudioRepo } from "~/lib/studio/repo";
import type { ToastOptions } from "./Toast";

export function deployToast(
  toast: { show: (o: ToastOptions) => void },
  repo: StudioRepo,
  deployed: boolean,
  ok: ToastOptions,
) {
  if (deployed) {
    toast.show(ok);
    return;
  }
  const retry = async () => {
    const r = await repo.publish({ action: "deploy", kind: "site" });
    if (r.ok && r.deployed) toast.show({ message: "Rebuilding the site. It updates within a minute." });
    else
      toast.show({
        message: "The site still didn’t rebuild. Your publish is saved; try again in a minute.",
        tone: "error",
        action: { label: "Try again", onAction: () => void retry() },
      });
  };
  toast.show({
    message: "Published, but the site didn’t rebuild yet. Your changes go live with the next rebuild.",
    tone: "neutral",
    action: { label: "Try again", onAction: () => void retry() },
  });
}
