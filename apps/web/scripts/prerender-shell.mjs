/**
 * F09 (2026-09-29 audit) — the prerender shell must be immutable across runs.
 * The home page overwrites dist/index.html in place, so on a repeated run the
 * "shell" read from disk already carries the previous home body inside
 * <div id="root">…</div>. The head-tag normalization alone left that body in
 * place, and because renderPage only fills an EMPTY root, every other route
 * silently kept the homepage body (route metadata wrapped around the wrong
 * content). This module owns restoring the pristine empty root so consecutive
 * prerender runs produce correct output for every route.
 */

const ROOT_OPEN = '<div id="root">';
const ROOT_CLOSE = '</div>';
const WRAP_OPEN = '<div id="prerender" data-prerender="true"';

/**
 * Strip a previous run's prerendered home body out of the shell, restoring
 * `<div id="root"></div>`. Returns the input unchanged when the root is
 * already empty (fresh vite build). Throws on a structurally impossible
 * shell rather than emitting wrong pages.
 */
export function stripPrerenderedRoot(html) {
  const rootOpen = html.indexOf(ROOT_OPEN);
  if (rootOpen === -1) return html; // no root (unexpected) — leave untouched
  const inner = rootOpen + ROOT_OPEN.length;
  if (html.slice(inner, inner + WRAP_OPEN.length) !== WRAP_OPEN) return html; // root not prerendered
  // The wrapper is this script's own output; find its matching close by
  // balancing <div / </div> occurrences from the wrapper opening.
  let depth = 0;
  let i = inner;
  for (;;) {
    const open = html.indexOf('<div', i);
    const close = html.indexOf(ROOT_CLOSE, i);
    if (close === -1) throw new Error('prerender: unbalanced #root wrapper in shell — rebuild dist and rerun');
    if (open !== -1 && open < close) {
      depth++;
      i = open + 4;
    } else {
      depth--;
      i = close + ROOT_CLOSE.length;
      if (depth === 0) break;
    }
  }
  // `i` sits just past the wrapper's closing </div>; exactly one more close
  // must terminate #root itself.
  if (!html.startsWith(ROOT_CLOSE, i)) {
    throw new Error('prerender: unexpected #root tail in shell — rebuild dist and rerun');
  }
  return html.slice(0, rootOpen) + ROOT_OPEN + ROOT_CLOSE + html.slice(i + ROOT_CLOSE.length);
}
