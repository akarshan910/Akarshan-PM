import type { ReactNode } from "react";

import styles from "./Specimen.module.css";

interface SpecimenProps {
  /** The 02 id and name, e.g. "C3 · Buttons". */
  title: string;
  /** The board and selector to compare with, e.g. "Home.dc.html · .cta". */
  board: string;
  children: ReactNode;
  /** Renders inside Studio's light `.st` root. */
  studio?: boolean;
}

/** One component with every variant and state, labelled with the board to compare it against. */
export function Specimen({ title, board, children, studio }: SpecimenProps) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <section className={styles.specimen} aria-labelledby={id}>
      <header className={styles.head}>
        <h2 id={id} className={styles.title}>
          {title}
        </h2>
        <p className={styles.board}>{board}</p>
      </header>
      <div className={studio ? `st ${styles.stage}` : styles.stage}>{children}</div>
    </section>
  );
}

/** A labelled state inside a specimen. */
export function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className={styles.state}>
      <figcaption className={styles.label}>{label}</figcaption>
      <div>{children}</div>
    </figure>
  );
}
