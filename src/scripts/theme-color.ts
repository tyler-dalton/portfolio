/** Browser-chrome colors. Keep these aligned with --page-background. */
const THEME_COLORS = {
  dark: "#2c3e50",
  light: "#ecf0f1",
  matrix: "#050e06",
} as const;

function themeColorFor(theme: string | undefined) {
  if (theme === "light" || theme === "matrix") return THEME_COLORS[theme];
  return THEME_COLORS.dark;
}

/**
 * Paint the browser chrome to match the active theme.
 * The CSS variable is the source of truth once styles have loaded. The hex map
 * only covers the gap before those styles apply. Replacing the meta node is
 * deliberate: Safari often ignores in-place content edits.
 */
export function syncThemeColor(theme = document.documentElement.dataset.theme) {
  const fromCss = getComputedStyle(document.documentElement)
    .getPropertyValue("--page-background")
    .trim();
  const color = fromCss || themeColorFor(theme);
  const next = document.createElement("meta");
  next.name = "theme-color";
  next.content = color;

  const current = document.querySelector('meta[name="theme-color"]');
  if (current) current.replaceWith(next);
  else document.head.appendChild(next);
}

export function watchThemeColor() {
  const root = document.documentElement;
  const apply = () => syncThemeColor(root.dataset.theme);
  apply();
  new MutationObserver(apply).observe(root, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
}
