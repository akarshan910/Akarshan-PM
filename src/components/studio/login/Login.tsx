/**
 * Sign-in by email code (05 · Sign-in; StudioLogin, every state; StudioAuthFlow paths 1–6).
 * The brand panel and the form column on laptop and iPad; the wordmark above the form on phones.
 */
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Alert } from "../Banner";
import buttons from "../Button.module.css";
import { CODE_LENGTH, CodeInput, type CodeStatus } from "../CodeInput";
import { Icon } from "../../icons";
import type { AuthPort } from "~/lib/studio/repo";
import {
  CODE_TTL_MS,
  RESEND_WAIT,
  clearLock,
  clearSent,
  clock,
  countWrong,
  lockLeft,
  looksLikeEmail,
  maskEmail,
  normaliseEmail,
  recordSent,
  rememberEmail,
  rememberedEmail,
  sentRecord,
} from "~/lib/studio/signin";
import styles from "./Login.module.css";

export type Phase =
  | "email"
  | "invalid"
  | "sending"
  | "captcha"
  | "code"
  | "checking"
  | "wrong"
  | "expired"
  | "locked"
  | "wait"
  | "done"
  | "denied";

const ANNOUNCE: Partial<Record<Phase, string>> = {
  sending: "Sending a code.",
  code: "Code sent. Check your email.",
  checking: "Checking the code.",
  wrong: "That code didn’t work.",
  expired: "That code has expired.",
  done: "Signed in.",
  locked: "Too many tries.",
};

interface LoginProps {
  auth: AuthPort;
  /** Where to go after signing in (already checked by `safeNext`). */
  next: string;
  /** The page name for the deep-link note, when `next` isn't the dashboard. */
  nextName?: string | undefined;
  /** The session ended while editing (05 · States › signed out). */
  signedOut?: boolean;
  /** Send a code to the remembered address at once (the session-expired dialog's button). */
  sendNow?: boolean;
  onSignedIn: (next: string) => void;
  /** The clock and storage, so tests can drive them. */
  now?: () => number;
  local?: Storage | undefined;
  session?: Storage | undefined;
}

function storages(): { local: Storage | undefined; session: Storage | undefined } {
  try {
    return { local: window.localStorage, session: window.sessionStorage };
  } catch {
    return { local: undefined, session: undefined };
  }
}

export function Login({
  auth,
  next,
  nextName,
  signedOut,
  sendNow,
  onSignedIn,
  now = Date.now,
  ...props
}: LoginProps) {
  const [{ local, session }] = useState(() =>
    "local" in props || "session" in props ? { local: props.local, session: props.session } : storages(),
  );
  const [sent, setSent] = useState(() => sentRecord(session));
  const [email, setEmail] = useState(() => sent?.email ?? rememberedEmail(local));
  const [phase, setPhase] = useState<Phase>(() => (sent ? "code" : "email"));
  const [code, setCode] = useState("");
  const [offline, setOffline] = useState(false);
  const [tick, setTick] = useState(() => now());
  const [announce, setAnnounce] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const emailHint = useId();

  // One clock for the resend wait and the lock countdown.
  useEffect(() => {
    const t = setInterval(() => {
      setTick(now());
    }, 1000);
    return () => {
      clearInterval(t);
    };
  }, [now]);

  const sentAt = sent?.at ?? 0;
  const waitLeft = Math.max(0, RESEND_WAIT - Math.floor((tick - sentAt) / 1000));
  const lockMs = lockLeft(local, normaliseEmail(email), tick);
  const locked = lockMs > 0;
  const shownPhase: Phase =
    locked && ["code", "wrong", "expired", "wait", "locked"].includes(phase) ? "locked" : phase;

  const spoken = ANNOUNCE[shownPhase] ?? announce;

  useEffect(() => {
    if (phase === "email" || phase === "invalid") emailRef.current?.focus();
    if (phase === "code") codeRef.current?.focus();
  }, [phase]);

  const send = useCallback(
    async (resend = false) => {
      const address = normaliseEmail(email);
      if (!looksLikeEmail(address)) {
        setPhase("invalid");
        return;
      }
      if (resend && waitLeft > 0 && phase !== "expired" && !locked) {
        setPhase("wait");
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setOffline(true);
        return;
      }
      if (!resend) setPhase("sending");
      const result = await auth.sendCode(address);
      if (result === "offline") {
        setOffline(true);
        setPhase("email");
        return;
      }
      setOffline(false);
      if (result === "captcha") {
        setPhase("captcha");
        return;
      }
      if (result === "rate") {
        setPhase(sent ? "wait" : "code");
        return;
      }
      // "sent", and also "unknown": the screen never reveals who owns the site.
      const at = now();
      setSent({ email: address, at });
      recordSent(session, address, at);
      setTick(at);
      setCode("");
      setPhase("code");
      if (resend) setAnnounce("A new code is on its way.");
    },
    [auth, email, locked, now, phase, sent, session, waitLeft],
  );

  const sendOnce = useRef(false);
  useEffect(() => {
    if (sendNow && !sendOnce.current && email && !sent) {
      sendOnce.current = true;
      void send();
    }
  }, [sendNow, email, send, sent]);

  const verify = useCallback(
    async (value: string) => {
      if (value.length < CODE_LENGTH || phase === "checking" || locked) return;
      const address = normaliseEmail(email);
      setPhase("checking");
      const result = await auth.checkCode(address, value, sentAt);
      switch (result) {
        case "signed-in":
          clearSent(session);
          clearLock(local, address);
          rememberEmail(local, address);
          setPhase("done");
          setTimeout(() => {
            onSignedIn(next);
          }, 1200);
          return;
        case "not-owner":
          clearSent(session);
          setSent(null);
          setPhase("denied");
          return;
        case "expired":
          setPhase(now() - sentAt > CODE_TTL_MS ? "expired" : "wrong");
          return;
        case "rate":
          setPhase("locked");
          return;
        case "offline":
          setOffline(true);
          setPhase("code");
          return;
        default: {
          const left = countWrong(local, address, now());
          setTick(now());
          setPhase(left > 0 ? "locked" : "wrong");
        }
      }
    },
    [auth, email, local, locked, next, now, onSignedIn, phase, sentAt, session],
  );

  const changeEmail = () => {
    clearSent(session);
    setSent(null);
    rememberEmail(local, null);
    setCode("");
    setPhase("email");
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (phase === "sending") return;
    void send();
  };

  const emailStep = ["email", "invalid", "sending", "captcha"].includes(shownPhase);
  const codeStep = ["code", "checking", "wrong", "expired", "locked", "wait"].includes(shownPhase);
  const codeStatus: CodeStatus =
    shownPhase === "wrong"
      ? "wrong"
      : shownPhase === "expired"
        ? "expired"
        : shownPhase === "checking"
          ? "checking"
          : shownPhase === "locked"
            ? "locked"
            : "idle";
  const sendNew = shownPhase === "locked" || shownPhase === "expired";
  const resendDisabled = waitLeft > 0 && !sendNew;

  return (
    <div className={`st ${styles.page}`}>
      <aside className={styles.brand}>
        <svg
          viewBox="0 0 700 960"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          className={styles.lines}
        >
          {[
            [-20, -20],
            [-20, 160],
            [-20, 340],
            [-20, 520],
            [-20, 700],
            [-20, 880],
            [200, -20],
            [420, -20],
            [720, 200],
            [720, 820],
            [300, 980],
          ].map(([x, y]) => (
            <line key={`${x},${y}`} x1="560" y1="520" x2={x} y2={y} />
          ))}
        </svg>
        <div className={styles.mark}>
          Studio<span className={styles.dot}>.</span>
        </div>
        <div className={styles.pitch}>
          <h1 className={styles.h1}>
            Edit the portfolio.
            <br />
            <span className={styles.muted}>Not the code.</span>
          </h1>
          <ul className={styles.ticks}>
            {[
              "Every section, project and post on your site",
              "Images, videos and live prototypes",
              "Drafts stay private until you publish",
            ].map((t) => (
              <li key={t}>
                <Icon name="check" style={{ color: "#3CCB8B" }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className={styles.formCol}>
        <div className={styles.form}>
          <div className={styles.phoneMark} aria-hidden="true">
            Studio<span className={styles.dot}>.</span>
          </div>

          {signedOut && emailStep ? (
            <div className={styles.lead}>
              <Alert tone="warn" role="status" enter icon={<Icon name="clock" />}>
                <b>You’ve been signed out.</b> Sign in again to keep editing. Your unsaved changes are kept on
                this device.
              </Alert>
            </div>
          ) : null}
          {offline ? (
            <div className={styles.lead}>
              <Alert tone="err" role="alert" enter icon={<Icon name="wifi" />}>
                <b>You’re offline.</b> Connect to the internet to get a sign-in code.{" "}
                <button
                  type="button"
                  className={buttons.link}
                  style={{ color: "inherit", fontSize: 14 }}
                  onClick={() => {
                    setOffline(false);
                    setPhase("email");
                  }}
                >
                  Try again
                </button>
              </Alert>
            </div>
          ) : null}
          {nextName && emailStep && !signedOut ? (
            <div className={styles.lead}>
              <Alert tone="info" enter icon={<Icon name="arrow-right" />}>
                After you sign in, you’ll go straight back to <b style={{ color: "var(--tx)" }}>{nextName}</b>
                .
              </Alert>
            </div>
          ) : null}

          {emailStep ? (
            <form onSubmit={onSubmit} noValidate>
              <h2 className={styles.h2}>Sign in to Studio</h2>
              <p className={styles.intro}>
                Studio is private. Enter the email address that owns this portfolio, and we’ll send you a{" "}
                {CODE_LENGTH}-digit code.
              </p>
              <label htmlFor="em" className={styles.label}>
                Email
              </label>
              <input
                ref={emailRef}
                id="em"
                className={styles.field}
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (phase === "invalid") setPhase("email");
                }}
                aria-invalid={shownPhase === "invalid"}
                aria-describedby={shownPhase === "invalid" ? emailHint : undefined}
                disabled={shownPhase === "sending"}
              />
              {shownPhase === "invalid" ? (
                <p id={emailHint} role="alert" className={styles.err}>
                  Enter an email address, like name@example.com.
                </p>
              ) : null}
              {shownPhase === "captcha" ? (
                <div className={styles.enter} style={{ marginTop: 14 }}>
                  <div className={styles.ts} id="turnstile">
                    <span className={styles.cb} />
                    Verify you are human
                    <span className={styles.tsBrand}>
                      CLOUDFLARE
                      <br />
                      Turnstile
                    </span>
                  </div>
                  <p className={styles.note} style={{ marginTop: 8 }}>
                    Shown only when the sign-in looks unusual.
                  </p>
                </div>
              ) : null}
              <button
                type="submit"
                className={buttons.pbtn}
                aria-disabled={shownPhase === "sending"}
                aria-busy={shownPhase === "sending"}
                style={{ marginTop: 16 }}
              >
                {shownPhase === "sending" ? (
                  <>
                    <span className={styles.spin} aria-hidden="true" />
                    Sending code…
                  </>
                ) : (
                  "Email me a code"
                )}
              </button>
              <p className={styles.note} style={{ marginTop: 12 }}>
                No password to remember. Each code works once and expires after 10 minutes.
              </p>
              <p className={`${styles.note} ${styles.rule}`}>
                Only the site owner’s address gets a code. Anyone else sees this page and nothing more.
              </p>
            </form>
          ) : null}

          {codeStep ? (
            <div className={styles.enter}>
              <button type="button" className={`${buttons.link} ${styles.back}`} onClick={changeEmail}>
                <Icon name="arrow-left" size={16} />
                Use a different email
              </button>
              <h2 className={styles.h2} style={{ marginTop: 18 }}>
                Check your email
              </h2>
              <p className={styles.intro}>
                If <b className={styles.strong}>{maskEmail(normaliseEmail(email))}</b> owns this site, a{" "}
                {CODE_LENGTH}-digit code is on its way. It expires in 10 minutes.
              </p>
              {shownPhase === "wrong" ? (
                <div className={styles.gap}>
                  <Alert tone="err" role="alert" enter icon={<Icon name="alert" />}>
                    <b>That code didn’t work.</b> Check the latest email from Studio: each new code replaces
                    the one before.
                  </Alert>
                </div>
              ) : null}
              {shownPhase === "expired" ? (
                <div className={styles.gap}>
                  <Alert tone="warn" role="alert" enter icon={<Icon name="clock" />}>
                    <b>That code has expired.</b> Codes last 10 minutes. Send a new one and use it straight
                    away.
                  </Alert>
                </div>
              ) : null}
              {shownPhase === "locked" ? (
                <div className={styles.gap}>
                  <Alert tone="err" role="alert" enter icon={<Icon name="padlock" />}>
                    <b>Too many tries.</b> To keep Studio safe, ask for a new code in {clock(lockMs / 1000)}.
                  </Alert>
                </div>
              ) : null}
              {shownPhase === "wait" ? (
                <div className={styles.gap}>
                  <Alert tone="warn" role="status" enter icon={<Icon name="clock" />}>
                    <b>A code was sent moments ago.</b> You can ask for another in {clock(waitLeft)}.
                  </Alert>
                </div>
              ) : null}
              <div style={{ marginTop: 24 }}>
                <CodeInput
                  ref={codeRef}
                  value={code}
                  status={codeStatus}
                  onChange={(digits) => {
                    setCode(digits);
                    if (phase === "wrong" || phase === "expired" || phase === "wait") setPhase("code");
                  }}
                  onComplete={(c) => {
                    void verify(c);
                  }}
                />
              </div>
              <button
                type="button"
                className={buttons.pbtn}
                aria-disabled={code.length < CODE_LENGTH || shownPhase === "locked"}
                aria-busy={shownPhase === "checking"}
                style={{ marginTop: 18 }}
                onClick={() => {
                  void verify(code);
                }}
              >
                {shownPhase === "checking" ? (
                  <>
                    <span className={styles.spin} aria-hidden="true" />
                    Checking code…
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
              <div className={styles.resend}>
                <span>Didn’t get it?</span>
                <button
                  type="button"
                  className={buttons.link}
                  aria-disabled={resendDisabled}
                  onClick={() => {
                    if (resendDisabled) {
                      setPhase("wait");
                      return;
                    }
                    void send(true);
                  }}
                >
                  {sendNew
                    ? "Send a new code"
                    : waitLeft > 0
                      ? `Resend code in ${clock(waitLeft)}`
                      : "Resend code"}
                </button>
                <span>Check spam, or use a different email.</span>
              </div>
            </div>
          ) : null}

          {shownPhase === "done" ? (
            <div role="status" className={styles.enter}>
              <div className={styles.okTile}>
                <Icon name="tick" size={26} />
              </div>
              <h2 className={styles.h2} style={{ marginTop: 22 }}>
                Welcome back
              </h2>
              <p className={styles.intro}>You’re signed in on this device until you sign out.</p>
              <button
                type="button"
                className={buttons.btn2Dark}
                style={{ marginTop: 24 }}
                onClick={() => {
                  onSignedIn(next);
                }}
              >
                Open the dashboard
                <Icon name="arrow-right" />
              </button>
            </div>
          ) : null}

          {shownPhase === "denied" ? (
            <div className={styles.enter}>
              <div className={styles.errTile}>
                <Icon name="padlock" size={26} />
              </div>
              <h2 className={styles.h2} style={{ marginTop: 22 }}>
                This account can’t open Studio
              </h2>
              <p className={styles.intro}>
                Studio is private to the site owner. You’ve been signed out, and nothing was created or
                shared.
              </p>
              <div className={styles.deniedActs}>
                <button type="button" className={buttons.btn2} onClick={changeEmail}>
                  Use a different email
                </button>
                <a href="/" className={buttons.link}>
                  Go to the portfolio
                </a>
              </div>
            </div>
          ) : null}

          <div className="sr-only" aria-live="polite">
            {spoken}
          </div>
        </div>
      </main>
    </div>
  );
}
