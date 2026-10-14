import { ContactBlock } from "~/components/contact/ContactBlock";
import { RichText, hasRichText } from "~/components/rich/RichText";

import styles from "./Sections.module.css";
import { useSectionReveal } from "./reveal";
import type { SectionProps } from "./types";

/**
 * Contact (03 · Contact, C18): the closing line with its red half, the intro, then Email me, Copy
 * email and the links, each hidden without its value or when its layout item is off.
 */
export function Contact({ section, profile }: SectionProps) {
  const ref = useSectionReveal<HTMLElement>(":scope > div > div:last-child > *");
  const parts = new Set(section.items.map((i) => i.id));
  const on = (part: string, value: string | undefined) => (parts.has(part) && value ? value : undefined);
  const closing = parts.has("closing") ? section.contact?.closing : undefined;
  const header = section.header;
  const email = on("email", profile.contact.email);
  const linkedin = on("linkedin", profile.contact.linkedin);
  const github = on("github", profile.contact.github);
  const resume = on("resume", profile.contact.resume);
  const intro = hasRichText(header?.intro) ? header.intro : undefined;
  if (!closing && !header?.kicker && !intro && !email && !linkedin && !github && !resume) return null;
  const titleId = `${section.id}-t`;
  return (
    <section
      ref={ref}
      id={section.id}
      aria-labelledby={closing ? titleId : undefined}
      className={styles.contact}
    >
      <ContactBlock
        titleId={titleId}
        {...(header?.kicker ? { kicker: header.kicker } : {})}
        title={closing ?? ""}
        {...(closing && section.contact?.closingAccent ? { titleAccent: section.contact.closingAccent } : {})}
        {...(intro ? { intro: <RichText inline html={intro} /> } : {})}
        {...(email ? { email } : {})}
        {...(linkedin ? { linkedin } : {})}
        {...(github ? { github } : {})}
        {...(resume ? { resume } : {})}
      />
    </section>
  );
}
