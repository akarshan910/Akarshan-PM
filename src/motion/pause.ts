/**
 * Pause off screen (04 · Ground rules 5): the hero pauses while it's out of view or the tab is
 * hidden. `watchVisibility` reports each change; the hero adds `.paused` (which pauses the drift,
 * the pulse and the brush through CSS) and clears or restarts the floating-preview timers.
 */
export function watchVisibility(el: HTMLElement, onChange: (visible: boolean) => void): () => void {
  let inView = true;
  let shown = typeof document === "undefined" || document.visibilityState !== "hidden";
  let last: boolean | null = null;
  const report = () => {
    const visible = inView && shown;
    if (visible !== last) {
      last = visible;
      onChange(visible);
    }
  };
  const onVisibility = () => {
    shown = document.visibilityState !== "hidden";
    report();
  };
  const observer =
    typeof IntersectionObserver === "undefined"
      ? null
      : new IntersectionObserver((entries) => {
          const entry = entries[entries.length - 1];
          if (entry) inView = entry.isIntersecting;
          report();
        });
  observer?.observe(el);
  document.addEventListener("visibilitychange", onVisibility);
  report();
  return () => {
    observer?.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
