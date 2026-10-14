/**
 * The only inline script on the site (01 · Headers, 04 · Ground rules 1 and 7):
 * it marks `<html>` as `js`, and `still` under reduced motion, before first paint.
 * Its SHA-256 hash is allowed in the CSP; any other inline script fails the build.
 */
export const BOOTSTRAP_SCRIPT =
  "(function(d){d.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('still')})(document.documentElement)";
