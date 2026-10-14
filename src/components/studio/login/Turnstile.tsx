/**
 * The Turnstile check (05 · Sign-in › bot check; 01 · Bot protection). It appears only when
 * Supabase asks for a CAPTCHA. Supabase's CAPTCHA protection is off on the shared project (D54),
 * so until Q8 is revisited this never shows; when it does, the widget hands a token back and the
 * code request is sent again with it. Without a site key there's no widget, and the caller shows
 * an error with "Try again" instead.
 */
import { useEffect, useRef } from "react";

const SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    options: { sitekey: string; callback: (token: string) => void; "error-callback"?: () => void },
  ) => string;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<TurnstileApi> | undefined;

function load(): Promise<TurnstileApi> {
  loading ??= new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve(window.turnstile);
      return;
    }
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("Turnstile didn't load."));
    };
    s.onerror = () => {
      loading = undefined;
      reject(new Error("Turnstile didn't load."));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** The public site key, or "" when this build has none. */
export function turnstileSiteKey(): string {
  return (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? "";
}

export function Turnstile({
  siteKey,
  onToken,
  onError,
}: {
  siteKey: string;
  onToken: (token: string) => void;
  onError: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onToken, onError });
  useEffect(() => {
    handlers.current = { onToken, onError };
  });
  useEffect(() => {
    let id: string | undefined;
    let api: TurnstileApi | undefined;
    let live = true;
    load().then(
      (t) => {
        if (!live || !box.current) return;
        api = t;
        id = t.render(box.current, {
          sitekey: siteKey,
          callback: (token) => {
            handlers.current.onToken(token);
          },
          "error-callback": () => {
            handlers.current.onError();
          },
        });
      },
      () => {
        if (live) handlers.current.onError();
      },
    );
    return () => {
      live = false;
      if (api && id) api.remove(id);
    };
  }, [siteKey]);
  return <div ref={box} />;
}
