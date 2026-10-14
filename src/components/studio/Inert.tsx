/**
 * Makes its children inert (not focusable, not clickable, hidden from assistive tech): the page
 * behind the session dialog, and previews drawn with the public components. React 18 has no
 * `inert` prop, so it's set on the element.
 */
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export function Inert({
  when = true,
  className,
  style,
  children,
}: {
  when?: boolean;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.toggleAttribute("inert", when);
  }, [when]);
  return (
    <div ref={ref} className={className} style={style ?? (className ? undefined : { display: "contents" })}>
      {children}
    </div>
  );
}
