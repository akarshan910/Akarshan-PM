/**
 * StudioMobile › Upload sheet: on phones, "Upload" (Media) and "Add images" (a project's gallery)
 * open this sheet: photo library, camera or files, each upload's progress, then the alt text for
 * what was added, asked for right away.
 */
import * as RadixDialog from "@radix-ui/react-dialog";
import { useState } from "react";

import { cx } from "../../cx";
import buttons from "../Button.module.css";
import { StudioIcon } from "../StudioIcon";
import styles from "./MediaLibrary.module.css";
import type { useUpload } from "./useUpload";
import type { MediaRow } from "~/lib/studio/repo";

/** StudioMobile › Upload sheet: library, camera or files, then alt text for what was added. */
export function UploadSheet({
  title,
  imagesOnly = false,
  open,
  onOpenChange,
  items,
  rows,
  onFiles,
  onAlt,
}: {
  /** "Add to your media", "Add to the Puja gallery". */
  title: string;
  /** The Visuals gallery takes images only, so Files offers no PDFs. */
  imagesOnly?: boolean;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: ReturnType<typeof useUpload>["items"];
  rows: MediaRow[];
  onFiles: (files: FileList | null) => void;
  onAlt: (id: string, alt: string) => void;
}) {
  const [alts, setAlts] = useState<Record<string, string>>({});
  const waiting = items
    .filter((i) => i.state === "done" && i.row?.kind === "image")
    .map((i) => rows.find((r) => r.id === i.row?.id))
    .filter((r): r is MediaRow => r !== undefined && !r.alt?.trim());
  const pick = (accept: string, capture?: boolean) => (
    <input
      type="file"
      className="sr-only"
      accept={accept}
      multiple={!capture}
      {...(capture ? { capture: "environment" as const } : {})}
      onChange={(e) => {
        onFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <div className="st" style={{ background: "none" }}>
          <RadixDialog.Overlay className={styles.sheetOverlay} />
          <RadixDialog.Content className={styles.sheet} aria-describedby={undefined}>
            <div className={styles.grab} aria-hidden="true" />
            <RadixDialog.Title className={styles.sheetTitle}>{title}</RadixDialog.Title>
            <div className={styles.opts}>
              <label className={styles.opt}>
                <StudioIcon name="media" />
                Photo library
                {pick("image/*")}
              </label>
              <label className={styles.opt}>
                <StudioIcon name="camera" />
                Take a photo
                {pick("image/*", true)}
              </label>
              <label className={styles.opt}>
                <StudioIcon name="file" />
                {imagesOnly ? "Files · images" : "Files · images and PDFs"}
                {pick(
                  imagesOnly
                    ? "image/png,image/jpeg,image/webp,image/gif,image/heic"
                    : "image/png,image/jpeg,image/webp,image/gif,image/heic,application/pdf",
                )}
              </label>
            </div>
            {items
              .filter((i) => i.state === "uploading")
              .map((i) => (
                <div key={i.key} className={styles.sheetUp}>
                  <div className={styles.sheetUpHead}>
                    <span className={styles.mono}>{i.name}</span>
                    <span>{Math.round(i.fraction * 100)}%</span>
                  </div>
                  <div className={styles.bar}>
                    <span style={{ width: `${Math.round(i.fraction * 100)}%` }} />
                  </div>
                </div>
              ))}
            {waiting.map((r) => (
              <form
                key={r.id}
                className={styles.altAsk}
                onSubmit={(e) => {
                  e.preventDefault();
                  const v = (alts[r.id] ?? "").trim();
                  if (v) onAlt(r.id, v);
                }}
              >
                <label htmlFor={`alt-${r.id}`} className={styles.altAskLbl}>
                  Alt text for {r.filename} <span className={styles.altReq}>Required</span>
                </label>
                <textarea
                  id={`alt-${r.id}`}
                  className={cx(styles.inp, styles.ta)}
                  placeholder="What the screen shows and why it matters"
                  value={alts[r.id] ?? ""}
                  onChange={(e) => {
                    setAlts((a) => ({ ...a, [r.id]: e.target.value }));
                  }}
                />
                <div className={styles.altAskActs}>
                  <button type="submit" className={buttons.cta} style={{ height: 42 }}>
                    Save
                  </button>
                </div>
              </form>
            ))}
          </RadixDialog.Content>
        </div>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
