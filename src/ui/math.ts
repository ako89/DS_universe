/**
 * Lazy KaTeX rendering for the card's "The math" section. See docs/ENGINE_SPEC.md §4 — math is
 * collapsed by default and KaTeX is only pulled in (JS + CSS, both code-split by Vite) the first
 * time a card's math section is actually expanded, not on every card open. Rendered once per
 * entry and cached in the DOM; re-expanding doesn't re-render.
 */

type Katex = typeof import('katex').default;

let katexPromise: Promise<Katex> | null = null;

function loadKatex(): Promise<Katex> {
  katexPromise ??= Promise.all([import('katex'), import('katex/dist/katex.css')]).then(([mod]) => mod.default);
  return katexPromise;
}

/** Renders each LaTeX expression as a display-mode block into `container`, replacing its
 *  existing content. A malformed expression renders KaTeX's own inline error span rather than
 *  throwing, so one bad expression doesn't blank the whole section. */
export async function renderMath(container: HTMLElement, expressions: string[]): Promise<void> {
  const katex = await loadKatex();
  container.replaceChildren();
  for (const expr of expressions) {
    const line = document.createElement('div');
    line.className = 'math-line';
    katex.render(expr, line, { throwOnError: false, displayMode: true });
    container.appendChild(line);
  }
}
