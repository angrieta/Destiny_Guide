# Destiny Guide Design System 1.2

This document is the reference for every new page and every redesign in Destiny Guide.
The implementation lives in `styles/design-system.css`. New work should use its semantic tokens instead of adding page-specific colors, spacing, or type sizes.

## Design direction

- Product: a practical PSOBB game guide and searchable reference.
- Audience: players who need to scan mechanics, item data, and farming routes quickly.
- Visual language: cool technical editorial, restrained motion, dense but readable information.
- Design dials: variance 5, motion 4, density 6.
- Theme: light and dark share the same hierarchy. A page never changes theme by section.
- Accent: one Destiny blue accent across navigation, actions, links, and focus states.
- Locked exception: the character guide's role and stat colors on the main page are game information. Do not recolor them.

## Source of truth

Use the following order when making a decision:

1. Semantic variables in `styles/design-system.css`.
2. Shared components such as the site header, page header, cards, tables, forms, and modal patterns.
3. Page-specific CSS only when the content needs a real exception.

Do not copy raw hex values or spacing from an older page. Do not create a new header or page-title pattern for a single page.

## Color tokens

| Token | Purpose |
| --- | --- |
| `--dg-bg` | Page canvas |
| `--dg-surface` | Primary content surface |
| `--dg-surface-raised` | Secondary controls and grouped content |
| `--dg-surface-muted` | Selected or emphasized neutral surface |
| `--dg-text` | Headings and important text |
| `--dg-text-soft` | Body and supporting text |
| `--dg-text-faint` | Metadata and placeholders |
| `--dg-border` | Default divider and component border |
| `--dg-border-strong` | Strong table and focus-adjacent border |
| `--dg-accent` | Primary action, current state, active filter |
| `--dg-accent-hover` | Hovered action and text link |
| `--dg-accent-soft` | Low-emphasis accent background |
| `--dg-focus` | Keyboard focus ring |
| `--dg-danger`, `--dg-warning`, `--dg-success` | Semantic status only |

Rules:

- Use one accent on a page. Do not introduce a second decorative accent.
- Status colors communicate real meaning only.
- Use semantic tokens in both themes. Never add a dark-only section color flip.
- Body text must meet WCAG AA contrast. Buttons must keep their label on one line.

## Typography

The shared stack is Korean-first and system-safe:

```css
font-family: var(--font-sans);
```

| Role | Token or size | Usage |
| --- | --- | --- |
| Page title | `--text-3xl` | One per page, 32-48px responsive |
| Section title | 22-28px | Major guide sections |
| Subsection | `--text-xl` | A group inside a section |
| Body | `--text-base` | Default prose and controls |
| Supporting | `--text-sm` | Captions, help text, table notes |
| Metadata | `--text-xs` | Compact state and timestamps |

- Page titles use weight 780, line-height 1.15, and slight negative tracking.
- Body copy uses line-height 1.6-1.7 and stays within `--reading-max-width`.
- Do not use an oversized display headline on a utility page.
- Use the mono stack only for clocks, rates, coordinates, and tabular numbers.

## Layout and spacing

- Site container: `--content-max-width` (1440px).
- Reading measure: `--reading-max-width` (880px).
- Horizontal gutter: `--content-gutter`, responsive from 16px to 32px.
- Header: 68px desktop and 62px compact.
- Page shell: 48px top and 80px bottom on desktop, 32px top and 64px bottom on mobile.
- Section gap: 64px desktop, 48px mobile.

Spacing uses a 4px base scale through `--space-1` to `--space-20`. Use the nearest token instead of inventing values.

## Shape and elevation

- Controls and buttons: `--radius-control` (10px).
- Cards: `--radius-card` (14px).
- Media: `--radius-media` (12px).
- Pills: `--radius-pill`, only for compact filters or categorical chips.
- Use `--shadow-sm` for a grouped surface, `--shadow-md` for dropdowns or sticky toolbars, and `--shadow-overlay` for modals.
- A border plus spacing is preferred over placing every block in a card.

## Shared components

### Header

Use the shared static `header.html` or React `SiteHeader`. The desktop header stays on one row. Long guide and raid navigation lives in grouped menus. Mobile uses a single menu panel instead of wrapped navigation rows. New public tools such as Token Redeem belong in the Guides group; experimental tools stay unlisted until they are ready.

Header action controls use a fixed 36px height, 11px horizontal inset, centered content, and a 7px group gap. Icon-only actions use a 36px square hit area. The Discord action always uses the existing light and dark logo assets rather than an empty decorative container.

Primary navigation does not use a filled card or pill for the current page. The current item uses stronger text weight and one short 18px accent rule aligned to the text start. On grouped menus, position the rule optically under the label rather than against the bottom of the taller summary hit area. A muted surface is reserved for transient hover and open-menu states, so location and interaction never compete visually.

### Page header

Use `.beginner_title`, `.g_head`, or `.cb_head`. They share one title scale, one description style, and one divider rhythm. A page header contains a title, one lead, and only the source or compact stat line needed to identify the guide.

### Guide section

Use `.contents_aria` for legacy pages or `.g_sec` for current pages. Both now produce the same title, number marker, body measure, and section rhythm. New guide pages should prefer `.g_page`, `.g_head`, and `.g_sec`.

### Raid guide template

`predator_raid.html` is the reference page for every raid guide. A raid uses `.g_page`, `.g_head`, `.g_toc`, sequential `.g_sec` sections, `.g_note` for one decisive callout, `.g_figs > .g_fig` for mechanics, and `.g_scroll > .g_table` for data. Skill symbols use `.g_skill_mark`; short boss facts use `.g_statline`. Do not reintroduce page-level inline CSS, duplicate section IDs, separate desktop/mobile headings, or a raid-specific popup implementation.

All raid images use the shared `scripts/guide.js` behavior and the `#gPopup` dialog structure. Preserve the source page's mechanics, images, translation keys, and URL while changing its presentation.

### Cards

Use `.g_card` for a real grouped concept. Use headings and spacing without a card when the border does not communicate hierarchy.

### Tables

Wrap wide tables in `.g_scroll`. The page itself must never scroll horizontally. Use `.g_mid` or `.g_wide` only when a minimum table width is necessary for data integrity.

### Forms and tools

Labels sit above fields. Placeholder text never replaces a label. Inputs are at least 44px high and use the shared focus ring. Sticky toolbars sit below the shared header using `--header-h` with `--header-height` as the fallback. React utility pages use the same semantic tokens and `SiteHeader`; do not duplicate the old page-specific header block.

### Modal

Use the shared card radius, overlay shadow, surface token, and close control. Escape and backdrop close behavior must be available. Image guides use `scripts/guide.js`, restore focus to the trigger, expose `aria-hidden`, and keep the fade/scale transition disabled under `prefers-reduced-motion`.

## Motion and state changes

Motion follows the `emil-design-skills` interaction rules and exists to explain a state change, never as decoration.

| Token | Duration | Usage |
| --- | --- | --- |
| `--motion-press` | 120ms | Button press feedback |
| `--motion-fast` | 150ms | Backdrops, color, and opacity |
| `--motion-ui` | 180ms | Menus, popovers, and compact state changes |
| `--motion-panel` | 240ms | Drawers, sheets, and accordions |

- Use `--ease-out` for entrances, `--ease-in-out` for reversible state changes, and `--ease-drawer` for panels.
- Animate only `transform` and `opacity` when possible. Never use `transition: all`.
- Buttons press to `scale(0.97)` and return to their resting state. Do not animate from `scale(0)`.
- Popovers originate from their trigger edge. Drawers and sheets enter from the edge where they live.
- Menus, modals, accordions, and mobile panels need both entrance and exit states.
- Skip nonessential motion for keyboard-triggered actions and remove it under `prefers-reduced-motion`.
- Avoid looping decoration, scroll listeners, and animated delays on frequently repeated controls.

## Character guide color lock

The main-page character guide is the only deliberate multi-color system. These colors encode stats and must not be replaced by the global accent:

- HP red: `rgb(255, 88, 88)`
- ATP orange: `rgb(255, 153, 112)`
- ATA yellow: `rgb(236, 201, 46)`
- DFP blue: `rgb(106, 109, 255)`
- MST green: `rgb(47, 190, 42)`
- EVP violet: `rgb(163, 65, 255)`
- LUCK pink: `rgb(255, 78, 137)`

New surrounding surfaces may use global neutral tokens, but the stat bars, labels, and class visuals retain their existing values.

## Responsive and accessibility checklist

- Test at 1440px, 1024px, 768px, 390px, and 344px.
- Desktop navigation must remain one line and no taller than 80px.
- Multi-column layouts collapse to one column below 768px unless the content is a scrollable data table.
- No page-level horizontal overflow.
- All interactive elements have visible keyboard focus.
- Respect `prefers-reduced-motion` and `prefers-reduced-transparency`.
- Images keep intrinsic space to avoid layout shift.
- Verify both light and dark themes before merging.

## Starting a new page

```html
<link rel="stylesheet" href="./styles/reset.css">
<link rel="stylesheet" href="./styles/common.css">
<link rel="stylesheet" href="./styles/guide.css">
<link rel="stylesheet" href="./styles/design-system.css">
```

```html
<div id="site-header"></div>
<script src="./scripts/include.js"></script>

<main class="g_page">
  <header class="g_head">
    <h2>Page title</h2>
    <p class="g_lead">A short, factual description of the page.</p>
  </header>

  <section class="g_sec">
    <h3>Section title</h3>
    <p>Readable guide content.</p>
  </section>
</main>
```

Before adding CSS, check whether the shared tokens and components already cover the need. If a new pattern is genuinely reusable, add it to `styles/design-system.css` and document it here in the same change.
