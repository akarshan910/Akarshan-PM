/**
 * Sign-in rules that live in the browser (06 · Client code, 05 · Sign-in): the address mask, the
 * email check, the remembered address, the time since the code was sent, the resend wait and
 * the five-wrong-codes lock. The server's limits are the real defence; these keep the screen
 * honest and stop a person from guessing.
 */

export const RESEND_WAIT = 60;
export const CODE_TTL_MS = 10 * 60_000;
export const MAX_WRONG = 5;
export const LOCK_MS = 15 * 60_000;

const EMAIL_KEY = "studio.email";
const SENT_KEY = "studio.sent";
const lockKey = (email: string) => `studio.lock.${email}`;

/** StudioLogin's `mask()`: `a••••••••0@gmail.com`, at most eight dots. */
export function maskEmail(email: string): string {
  const m = /^(.)(.*)(.)@(.+)$/.exec(email);
  if (!m) return "that address";
  const [, first = "", middle = "", last = "", host = ""] = m;
  return `${first}${"•".repeat(Math.min(8, middle.length))}${last}@${host}`;
}

export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** `m:ss`, as the board writes the waits ("0:52", "14:32"). */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function safe<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** The address remembered on this device after a successful sign-in. */
export function rememberedEmail(storage: Storage | undefined): string {
  return safe(() => storage?.getItem(EMAIL_KEY) ?? "", "");
}

export function rememberEmail(storage: Storage | undefined, email: string | null): void {
  safe(() => {
    if (email) storage?.setItem(EMAIL_KEY, email);
    else storage?.removeItem(EMAIL_KEY);
  }, undefined);
}

/** When a code was last sent, and to whom: kept in sessionStorage so a reload keeps the step. */
export function sentRecord(storage: Storage | undefined): { email: string; at: number } | null {
  return safe(() => {
    const raw = storage?.getItem(SENT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { email?: unknown; at?: unknown };
    return typeof v.email === "string" && typeof v.at === "number" ? { email: v.email, at: v.at } : null;
  }, null);
}

export function recordSent(storage: Storage | undefined, email: string, at: number): void {
  safe(() => storage?.setItem(SENT_KEY, JSON.stringify({ email, at })), undefined);
}

export function clearSent(storage: Storage | undefined): void {
  safe(() => storage?.removeItem(SENT_KEY), undefined);
}

interface LockState {
  wrong: number;
  until: number;
}

function readLock(storage: Storage | undefined, email: string): LockState {
  return safe(
    () => {
      const raw = storage?.getItem(lockKey(email));
      if (!raw) return { wrong: 0, until: 0 };
      const v = JSON.parse(raw) as Partial<LockState>;
      return { wrong: Number(v.wrong) || 0, until: Number(v.until) || 0 };
    },
    { wrong: 0, until: 0 },
  );
}

/** Milliseconds left on this device's lock for `email`, or 0. */
export function lockLeft(storage: Storage | undefined, email: string, now: number): number {
  return Math.max(0, readLock(storage, email).until - now);
}

/** Counts a wrong code; the fifth locks the code boxes for 15 minutes. Returns the lock time left. */
export function countWrong(storage: Storage | undefined, email: string, now: number): number {
  const s = readLock(storage, email);
  const wrong = s.until > now ? s.wrong : s.until ? 0 : s.wrong;
  const next: LockState =
    wrong + 1 >= MAX_WRONG ? { wrong: 0, until: now + LOCK_MS } : { wrong: wrong + 1, until: 0 };
  safe(() => storage?.setItem(lockKey(email), JSON.stringify(next)), undefined);
  return Math.max(0, next.until - now);
}

export function clearLock(storage: Storage | undefined, email: string): void {
  safe(() => storage?.removeItem(lockKey(email)), undefined);
}
