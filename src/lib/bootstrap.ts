/**
 * The site's own inline script (04 · Ground rules 1 and 7): it marks `<html>` as `js`, and `still`
 * under reduced motion, before first paint. It's a constant, so its hash is stable. React Router
 * adds its own inline scripts to each page; 01 · Headers says how every one is allowed by hash.
 */
export const BOOTSTRAP_SCRIPT =
  "(function(d){d.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('still')})(document.documentElement)";
