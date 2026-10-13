// Render a design board (.dc.html) to static HTML and a PNG, without the canvas runtime.
//
// The boards are templates: {{holes}}, <sc-for>, <sc-if> and a `Component` class whose renderVals()
// returns the values. This script runs renderVals() for a given Tweaks state, expands the template,
// opens the result in Chromium and saves a full-page screenshot. Event handlers are dropped, so the
// output is the board at rest, in the state you ask for.
//
// Usage:
//   node design/tools/render-board.mjs <board.dc.html> <out-prefix> [propsJSON] [width]
//   node design/tools/render-board.mjs design/boards/Home.dc.html qa/board-home '{"motion":"reduced"}'
//
// Writes <out-prefix>.html and <out-prefix>.png. Needs Playwright with Chromium (a dev dependency from M0).
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [file, outPrefix, propsJson = '{}', widthArg] = process.argv.slice(2);
if (!file || !outPrefix) {
  console.error('usage: node design/tools/render-board.mjs <board.dc.html> <out-prefix> [propsJSON] [width]');
  process.exit(1);
}
const html = fs.readFileSync(file, 'utf8');
const unescape = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const m = html.match(/<script type="text\/x-dc" data-dc-script data-props=(?:'([^']*)'|"([^"]*)")>([\s\S]*?)<\/script>/);
const meta = m ? JSON.parse(unescape(m[1] ?? m[2])) : {};
const code = m ? m[3] : 'class Component extends DCLogic { renderVals() { return {}; } }';

globalThis.window = { matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }) };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
class DCLogic {
  constructor(p) { this.props = p || {}; }
  setState(u) { this.state = Object.assign({}, this.state, typeof u === 'function' ? u(this.state) : u); }
  forceUpdate() {}
}
const Component = new Function('DCLogic', code + '\nreturn Component;')(DCLogic);
const vals = new Component(JSON.parse(propsJson)).renderVals();

const helmet = html.slice(html.indexOf('<helmet>') + 8, html.indexOf('</helmet>'));
const markup = html.slice(html.indexOf('</helmet>') + 9, html.indexOf('</x-dc>'));

function lookup(expr, scopes) {
  expr = expr.trim();
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  const parts = expr.split('.');
  for (let i = scopes.length - 1; i >= 0; i--) {
    if (parts[0] in scopes[i]) {
      let v = scopes[i][parts[0]];
      for (const p of parts.slice(1)) v = v == null ? undefined : v[p];
      return v;
    }
  }
  return undefined;
}
function closeIndex(s, tag, from) {
  const re = new RegExp(`<${tag}[\\s>]|</${tag}>`, 'g');
  re.lastIndex = from;
  let depth = 0, mm;
  while ((mm = re.exec(s))) {
    if (mm[0].startsWith('</')) { depth--; if (depth === 0) return mm.index; } else depth++;
  }
  throw new Error('unclosed ' + tag);
}
function subst(s, scopes) {
  s = s.replace(/\son[A-Z]\w*="\{\{[^}]+\}\}"/g, '');
  return s.replace(/\{\{([^}]+)\}\}/g, (_, e) => {
    const v = lookup(e, scopes);
    return v == null || typeof v === 'function' ? '' : String(v);
  });
}
function expand(s, scopes) {
  let out = '', i = 0;
  while (i < s.length) {
    const a = s.indexOf('<sc-', i);
    if (a < 0) { out += subst(s.slice(i), scopes); break; }
    out += subst(s.slice(i, a), scopes);
    const tag = s.startsWith('<sc-for', a) ? 'sc-for' : 'sc-if';
    const openEnd = s.indexOf('>', a) + 1;
    const openTag = s.slice(a, openEnd);
    const close = closeIndex(s, tag, a);
    const body = s.slice(openEnd, close);
    if (tag === 'sc-for') {
      const list = lookup(openTag.match(/list="\{\{([^}]+)\}\}"/)[1], scopes) || [];
      const as = openTag.match(/as="(\w+)"/)[1];
      for (const item of list) out += expand(body, scopes.concat([{ [as]: item }]));
    } else if (lookup(openTag.match(/value="\{\{([^}]+)\}\}"/)[1], scopes)) {
      out += expand(body, scopes);
    }
    i = close + tag.length + 3;
  }
  return out;
}

const page = `<!doctype html><html><head><meta charset="utf-8">${helmet}<style>sc-for,sc-if{display:contents}</style></head><body>${expand(markup, [vals])}</body></html>`;
fs.mkdirSync(path.dirname(path.resolve(outPrefix)), { recursive: true });
fs.writeFileSync(outPrefix + '.html', page);

const width = Number(widthArg) || (meta.$preview && meta.$preview.width) || 1440;
const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
await pg.goto('file://' + path.resolve(outPrefix + '.html'));
await pg.evaluate(() => Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 4000))]));
await pg.waitForTimeout(300);
await pg.screenshot({ path: outPrefix + '.png', fullPage: true });
await browser.close();
console.log(`${outPrefix}.png at ${width}px`);
