// Cognovis odontogram - https://github.com/cognovis/odontogram
// Dirk Saeger, Malte Sussdorff 2026

/**
 * The class a surface appended straight to `<body>` carries so it keeps the
 * chart's design tokens. Such a surface sits outside `.odontogram-root`, and
 * since GitHub cognovis/odontogram#44 the stylesheet sets no token on `:root`
 * (a host imports it globally, and `:root` tokens replaced the host's own).
 * `index.css` sets the light and `.dark` tokens on `.odontogram-root` and on
 * this class in one selector list, so both resolve to the same values.
 */
export const PORTAL_SCOPE_CLASS = "odontogram-portal";

/** Append `element` to `<body>` as a token-scoped portal surface. */
export function appendPortal<T extends HTMLElement>(element: T): T {
  element.classList.add(PORTAL_SCOPE_CLASS);
  document.body.appendChild(element);
  return element;
}
