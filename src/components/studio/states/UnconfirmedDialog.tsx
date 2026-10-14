/**
 * "Publish with {n} unconfirmed?" (05 · Profile & facts › Publishing, D5, D42): unconfirmed facts
 * publish with their live values. Runs before every site publish that has visible open facts.
 */
import { Dialog } from "../Dialog";

export function UnconfirmedDialog({
  count,
  open,
  busy,
  onCancel,
  onPublish,
}: {
  count: number;
  open: boolean;
  busy?: boolean;
  onCancel: () => void;
  onPublish: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
      title={`Publish with ${count} unconfirmed?`}
      description="Where your current site and résumé disagree, the live value stays until you pick one. Everything else goes live now."
      cancelLabel="Keep editing"
      confirmLabel={busy ? "Publishing…" : "Publish"}
      busy={busy}
      onConfirm={onPublish}
    />
  );
}
