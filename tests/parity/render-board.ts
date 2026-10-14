/**
 * Renders a design board (.dc.html) to static HTML for parity (08 · Pixel parity › 1). The same
 * expansion as design/tools/render-board.mjs, plus a `state` override: some boards keep a demo
 * value in component state rather than in a Tweak (WorkScale's project count), and parity has to
 * set it to the fixture's count.
 */
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

type Scope = Record<string, unknown>;
type Vals = Scope;

function lookup(expr: string, scopes: Scope[]): unknown {
  const e = expr.trim();
  if (e === "true") return true;
  if (e === "false") return false;
  const [head = "", ...rest] = e.split(".");
  for (let i = scopes.length - 1; i >= 0; i--) {
    const scope = scopes[i] ?? {};
    if (head in scope) {
      let v: unknown = scope[head];
      for (const p of rest) v = v == null ? undefined : (v as Scope)[p];
      return v;
    }
  }
  return undefined;
}

function closeIndex(s: string, tag: string, from: number) {
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, "g");
  re.lastIndex = from;
  let depth = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m[0].startsWith("</")) {
      depth--;
      if (depth === 0) return m.index;
    } else depth++;
  }
  throw new Error(`unclosed ${tag}`);
}

function subst(s: string, scopes: Scope[]) {
  return s.replace(/\son[A-Z]\w*="\{\{[^}]+\}\}"/g, "").replace(/\{\{([^}]+)\}\}/g, (_, e: string) => {
    const v = lookup(e, scopes);
    return typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? `${v}` : "";
  });
}

function expand(s: string, scopes: Scope[]): string {
  let out = "";
  let i = 0;
  while (i < s.length) {
    const a = s.indexOf("<sc-", i);
    if (a < 0) {
      out += subst(s.slice(i), scopes);
      break;
    }
    out += subst(s.slice(i, a), scopes);
    const tag = s.startsWith("<sc-for", a) ? "sc-for" : "sc-if";
    const openEnd = s.indexOf(">", a) + 1;
    const openTag = s.slice(a, openEnd);
    const close = closeIndex(s, tag, a);
    const body = s.slice(openEnd, close);
    if (tag === "sc-for") {
      const list = (lookup(/list="\{\{([^}]+)\}\}"/.exec(openTag)?.[1] ?? "", scopes) ?? []) as unknown[];
      const as = /as="(\w+)"/.exec(openTag)?.[1] ?? "item";
      for (const item of list) out += expand(body, scopes.concat([{ [as]: item }]));
    } else if (lookup(/value="\{\{([^}]+)\}\}"/.exec(openTag)?.[1] ?? "", scopes)) {
      out += expand(body, scopes);
    }
    i = close + tag.length + 3;
  }
  return out;
}

/**
 * The boards load Archivo, Geist, Geist Mono and JetBrains Mono from Google Fonts; the site
 * self-hosts the same families from @fontsource-variable (src/styles/fonts.css). Different builds
 * of a font rasterise differently, which shows up as glyph-outline diffs. So the board render
 * uses the site's own @font-face rules and files: both sides then draw identical glyphs, and what
 * remains in a diff is layout. Bump RENDER_VERSION when this changes, to drop cached renders.
 */
const RENDER_VERSION = 2;

function siteFonts(): string {
  const dir = resolve("public/fonts");
  if (!existsSync(resolve(dir, "archivo-latin-wdth-normal.woff2"))) {
    throw new Error("public/fonts is missing: run a build or `node scripts/copy-fonts.ts` first");
  }
  const base = pathToFileURL(dir).href;
  return readFileSync(resolve("src/styles/fonts.css"), "utf8").replaceAll('url("/fonts/', `url("${base}/`);
}

/**
 * Writes `qa/boards/parity/<name>.html` for the board in the given Tweaks and state, and returns
 * its path. Re-renders only when the board is newer than the output.
 */
export function renderBoard(board: string, name: string, props: Scope = {}, state: Scope = {}): string {
  const file = resolve("design/boards", `${board}.dc.html`);
  const out = resolve("qa/boards/parity", `${name}.v${RENDER_VERSION}.html`);
  if (existsSync(out) && statSync(out).mtimeMs > statSync(file).mtimeMs) return out;

  const html = readFileSync(file, "utf8");
  const m =
    /<script type="text\/x-dc" data-dc-script data-props=(?:'([^']*)'|"([^"]*)")>([\s\S]*?)<\/script>/.exec(
      html,
    );
  const code = m?.[3] ?? "class Component extends DCLogic { renderVals() { return {}; } }";

  const g = globalThis as Record<string, unknown>;
  g.window ??= { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) };
  g.requestAnimationFrame ??= () => 0;
  g.cancelAnimationFrame ??= () => undefined;
  class DCLogic {
    props: Scope;
    state: Scope = {};
    constructor(p?: Scope) {
      this.props = p ?? {};
    }
    setState(u: Scope | ((s: Scope) => Scope)) {
      this.state = { ...this.state, ...(typeof u === "function" ? u(this.state) : u) };
    }
    forceUpdate() {}
  }
  // The board's own script, as the canvas runs it (it's in the repo, not user input).
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const factory = new Function("DCLogic", `${code}\nreturn Component;`) as (base: typeof DCLogic) => unknown;
  const Component = factory(DCLogic) as new (p: Scope) => DCLogic & {
    renderVals(): Vals;
  };
  const instance = new Component(props);
  instance.state = { ...instance.state, ...state };
  const vals = instance.renderVals();

  const helmet = html
    .slice(html.indexOf("<helmet>") + 8, html.indexOf("</helmet>"))
    .replace(/<link[^>]*fonts\.(googleapis|gstatic)\.com[^>]*>/g, "");
  const markup = html.slice(html.indexOf("</helmet>") + 9, html.indexOf("</x-dc>"));
  const page = `<!doctype html><html><head><meta charset="utf-8">${helmet}<style>${siteFonts()}</style><style>sc-for,sc-if{display:contents}</style></head><body>${expand(markup, [vals])}</body></html>`;
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page);
  return out;
}
