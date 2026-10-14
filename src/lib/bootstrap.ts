/**
 * The site's own inline script (04 · Ground rules 1 and 7, M-HERO-RISE): it marks `<html>` as `js`,
 * `still` under reduced motion, and `no-intro` once the hero entrance has played this session,
 * before first paint. It's a constant, so its hash is stable. React Router adds its own inline
 * scripts to each page; 01 · Headers says how every one is allowed by hash.
 */
export const INTRO_KEY = "va:intro";

export const BOOTSTRAP_SCRIPT =
  "(function(d){d.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.classList.add('still');try{if(sessionStorage.getItem('va:intro'))d.classList.add('no-intro')}catch(e){}})(document.documentElement)";
