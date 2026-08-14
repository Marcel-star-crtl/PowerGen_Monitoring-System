/**
 * dieselTokens.ts
 *
 * Shared design tokens for the diesel pages, sourced from the app's real
 * brand palette (tailwind.config.js) instead of the ~69 ad-hoc hex colors
 * and 12 unscaled font sizes found scattered across these pages during a
 * UI/UX audit.
 *
 * NOTE ON SCOPE: the app has TWO existing, mutually-conflicting palettes —
 * tailwind.config.js (primary = #e53935, a deliberate red brand color with
 * semantic success/warning/danger/background/surface/text/border tokens)
 * and styles/theme.js (an Ant Design override with colorPrimary = #1890ff,
 * a generic blue). This file adopts the Tailwind palette as the source of
 * truth, since it's the more deliberate, semantically-complete system and
 * the diesel pages use raw inline styles rather than Ant components, so
 * there's no direct conflict. Reconciling the Ant override itself is a
 * separate decision outside this file's scope — it touches components
 * this file doesn't.
 *
 * Semantic status colors (success/warning/danger/info) are kept as their
 * own sub-scale since dashboards need more shades of each than the base
 * palette defines (e.g. a light background + a dark text color per status,
 * for badges/pills) — these are the same literal values already used most
 * frequently across the diesel pages (by usage count in the audit), so
 * adopting them is consistency-by-convergence, not a visual redesign.
 */

// ── Brand (from tailwind.config.js — do not diverge from these) ──────────────
export const brand = {
  primary:      '#e53935',
  primaryLight: '#ffcdd2',
  secondary:    '#222222',
  success:      '#388e3c',
  warning:      '#fbc02d',
  danger:       '#b71c1c',
  background:   '#f4f4f4',
  surface:      '#ffffff',
  text:         '#222222',
  textSecondary:'#757575',
  border:       '#e0e0e0',
} as const;

// ── UI chrome (headers, icons, non-interactive dark accents) ─────────────────
// Distinct from brand.primary on purpose: primary is the CTA/accent color
// (buttons, active states), ink is the neutral-dark tone for headers, icons,
// and other UI chrome that shouldn't compete visually with real actions.
export const ink = '#1a1a2e';

// ── Neutral scale (grays used for chrome, borders, muted text) ───────────────
// These are the exact values already most common across the diesel pages
// (by frequency in the audit) — kept as-is rather than forced onto the
// brand text/border tokens above, since dashboards genuinely need more
// steps of gray than a 2-stop text/border scale provides.
export const neutral = {
  50:  '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  900: '#111827',
} as const;

// ── Status colors (background + text pairs, for badges/pills/alerts) ─────────
export const status = {
  success: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
  warning: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  danger:  { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  info:    { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' },
  neutral: { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' },
} as const;

// ── Urgency scale (fuel planning, alerts — kept distinct from status:
//    urgency is about time pressure, status is about outcome) ────────────────
export const urgency = {
  critical: { fg: '#dc2626', bg: '#fef2f2' },
  high:     { fg: '#d97706', bg: '#fffbeb' },
  medium:   { fg: '#2563eb', bg: '#eff6ff' },
  ok:       { fg: '#16a34a', bg: '#f0fdf4' },
  unknown:  { fg: '#9ca3af', bg: '#f9fafb' },
} as const;

// ── Type scale (replaces the 12 unscaled font sizes found in the audit) ──────
// 5 sizes, each with a clear semantic role. Anything that doesn't fit one
// of these is a sign the layout needs a different element, not a new size.
export const type = {
  micro:  10, // fine print, table sub-labels
  small:  12, // secondary text, table cells, form helper text
  body:   14, // default body text, form input text
  title:  18, // card/section titles
  page:   24, // page-level headings
} as const;

// ── Spacing scale (4px base unit) ─────────────────────────────────────────────
export const space = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
} as const;

export const radius = { sm: 6, md: 8, lg: 10, pill: 20 } as const;
