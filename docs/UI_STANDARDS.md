# StudyHelper - UI Standards & Design System

## Design Philosophy

Our UI follows a **modern minimalist** approach inspired by Apple, Google, and OpenAI:

- **Clean & Spacious**: Generous whitespace, uncluttered layouts
- **Subtle Depth**: Soft shadows, gentle gradients, glassmorphism effects
- **Purposeful Animation**: Smooth, meaningful transitions (not decorative)
- **Typography-First**: Clear hierarchy, excellent readability
- **Accessible**: WCAG 2.1 AA compliant, keyboard navigable

---

## Color System

### Core Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --bg-tertiary: #f3f4f6;
  --bg-elevated: #ffffff;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-tertiary: #9ca3af;
  --text-inverse: #ffffff;

  /* Brand */
  --brand-primary: #2563eb;      /* Blue 600 */
  --brand-primary-hover: #1d4ed8; /* Blue 700 */
  --brand-secondary: #7c3aed;    /* Violet 600 */

  /* Semantic */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Borders */
  --border-light: #e5e7eb;
  --border-medium: #d1d5db;
  --border-focus: #2563eb;
}

/* Dark Mode */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0a0a0a;
    --bg-secondary: #111111;
    --bg-tertiary: #1a1a1a;
    --bg-elevated: #1f1f1f;

    --text-primary: #f9fafb;
    --text-secondary: #9ca3af;
    --text-tertiary: #6b7280;

    --border-light: #262626;
    --border-medium: #404040;
  }
}
```

### Usage Guidelines

- **Primary actions**: Use `--brand-primary`
- **Secondary actions**: Use outlined or ghost styles
- **Destructive actions**: Use `--error` sparingly
- **Disabled states**: 50% opacity on normal state

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

### Scale

| Name     | Size   | Weight | Line Height | Use Case                    |
|----------|--------|--------|-------------|-----------------------------|
| display  | 3.5rem | 700    | 1.1         | Hero headings               |
| h1       | 2.25rem| 700    | 1.2         | Page titles                 |
| h2       | 1.75rem| 600    | 1.25        | Section headings            |
| h3       | 1.25rem| 600    | 1.3         | Card titles, subsections    |
| h4       | 1.125rem| 600   | 1.4         | List headers                |
| body-lg  | 1.125rem| 400   | 1.6         | Lead paragraphs             |
| body     | 1rem   | 400    | 1.6         | Default body text           |
| body-sm  | 0.875rem| 400   | 1.5         | Secondary text, captions    |
| caption  | 0.75rem| 500    | 1.4         | Labels, helper text         |

### Guidelines

- Headlines: `font-weight: 600-700`, tight letter-spacing (-0.02em)
- Body text: `font-weight: 400`, normal letter-spacing
- Max line length: 65-75 characters for readability

---

## Spacing

Use an 8px base unit system:

| Token | Value | Use Case                |
|-------|-------|-------------------------|
| xs    | 4px   | Tight internal padding  |
| sm    | 8px   | Icon gaps, tight spacing|
| md    | 16px  | Default component padding|
| lg    | 24px  | Section spacing         |
| xl    | 32px  | Card padding            |
| 2xl   | 48px  | Section margins         |
| 3xl   | 64px  | Page sections           |
| 4xl   | 96px  | Hero sections           |

---

## Border Radius

| Token   | Value | Use Case              |
|---------|-------|-----------------------|
| none    | 0     | Sharp edges           |
| sm      | 4px   | Tags, badges          |
| md      | 8px   | Inputs, small buttons |
| lg      | 12px  | Cards, modals         |
| xl      | 16px  | Large cards           |
| 2xl     | 24px  | Prominent containers  |
| full    | 9999px| Pills, avatars        |

---

## Shadows

```css
/* Subtle elevation - cards, dropdowns */
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);

/* Default elevation */
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1),
             0 2px 4px -2px rgb(0 0 0 / 0.1);

/* Elevated - modals, popovers */
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1),
             0 4px 6px -4px rgb(0 0 0 / 0.1);

/* High elevation - floating elements */
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1),
             0 8px 10px -6px rgb(0 0 0 / 0.1);

/* Glow effect for focus states */
--shadow-glow: 0 0 0 3px rgb(37 99 235 / 0.2);
```

---

## Components

### Buttons

**Variants:**
1. **Primary**: Solid background, used for main CTAs
2. **Secondary**: Outlined, used for secondary actions
3. **Ghost**: No background, used for tertiary actions
4. **Danger**: Red, used for destructive actions

**Sizes:**
- `sm`: 32px height, 12px horizontal padding
- `md`: 40px height, 16px horizontal padding (default)
- `lg`: 48px height, 24px horizontal padding

**States:**
- Default → Hover (slight darken) → Active (more darken) → Focus (ring)
- Disabled: 50% opacity, no pointer events

**Example Tailwind Classes:**
```jsx
// Primary Button
className="inline-flex items-center justify-center rounded-lg bg-blue-600
           px-4 py-2.5 text-sm font-medium text-white
           hover:bg-blue-700 focus:outline-none focus:ring-2
           focus:ring-blue-500 focus:ring-offset-2
           disabled:opacity-50 disabled:pointer-events-none
           transition-colors duration-150"

// Secondary Button
className="inline-flex items-center justify-center rounded-lg border
           border-gray-300 bg-white px-4 py-2.5 text-sm font-medium
           text-gray-700 hover:bg-gray-50 focus:outline-none
           focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
           transition-colors duration-150"
```

### Inputs

**States:**
- Default: Light border (`--border-light`)
- Hover: Medium border (`--border-medium`)
- Focus: Brand border + glow ring
- Error: Red border + error message below
- Disabled: Muted background, reduced opacity

**Example:**
```jsx
className="block w-full rounded-lg border border-gray-300
           px-4 py-2.5 text-gray-900 placeholder:text-gray-400
           focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
           disabled:bg-gray-50 disabled:text-gray-500
           transition-colors duration-150"
```

### Cards

**Structure:**
```jsx
<div className="rounded-xl bg-white border border-gray-200
                shadow-sm hover:shadow-md transition-shadow duration-200">
  <div className="p-6">
    {/* Card content */}
  </div>
</div>
```

**Variants:**
- **Default**: White bg, subtle border, small shadow
- **Elevated**: No border, medium shadow
- **Interactive**: Hover state with lifted shadow
- **Glass**: Semi-transparent with backdrop blur (use sparingly)

---

## Animations & Transitions

### Duration Scale

| Token  | Duration | Use Case                    |
|--------|----------|-----------------------------|
| fast   | 100ms    | Micro-interactions          |
| normal | 150ms    | Button hovers, focus states |
| slow   | 200ms    | Card transitions            |
| slower | 300ms    | Page transitions, modals    |

### Easing

```css
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);  /* Smooth in-out */
--ease-in: cubic-bezier(0.4, 0, 1, 1);         /* Accelerate */
--ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Decelerate */
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1); /* Playful */
```

### Guidelines

- Always use `transition-*` classes, never instant changes
- Prefer transform/opacity animations (GPU accelerated)
- Avoid animating layout properties (width, height, margin)
- Reduce motion for `prefers-reduced-motion` users

---

## Icons

**Library:** Lucide React (consistent, MIT licensed)

```bash
npm install lucide-react
```

**Sizing:**
| Size | Pixels | Use Case           |
|------|--------|--------------------|
| sm   | 16px   | Inline with text   |
| md   | 20px   | Buttons, inputs    |
| lg   | 24px   | Standalone icons   |
| xl   | 32px   | Feature icons      |

**Guidelines:**
- Match icon stroke width to font weight context
- Use `currentColor` for icon fill/stroke
- Add `aria-hidden="true"` for decorative icons
- Add descriptive `aria-label` for interactive icons

---

## Layout Patterns

### Container

```jsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {/* Content */}
</div>
```

### Auth Pages (Sign In/Up)

- Centered card on subtle gradient background
- Max width: 400-450px
- Generous padding (32-48px)
- Social login buttons above/below form
- Minimal footer with links

### Dashboard

- Sticky header with user menu
- Optional sidebar navigation
- Main content with cards/tables
- Consistent section spacing

---

## Accessibility Checklist

- [ ] Color contrast ratio ≥ 4.5:1 for text
- [ ] Focus states visible on all interactive elements
- [ ] Skip links for keyboard navigation
- [ ] ARIA labels on icon-only buttons
- [ ] Form inputs have associated labels
- [ ] Error messages linked to inputs
- [ ] Reduced motion alternatives

---

## File Structure

```
src/
├── components/
│   └── ui/
│       ├── Button.jsx       # Button component
│       ├── Input.jsx        # Input component
│       ├── Card.jsx         # Card component
│       ├── Avatar.jsx       # Avatar component
│       └── index.js         # Barrel export
├── app/
│   └── globals.css          # Global styles + CSS variables
└── docs/
    └── UI_STANDARDS.md      # This file
```

---

## Changelog

| Date       | Change                                    |
|------------|-------------------------------------------|
| 2024-11-26 | Initial UI standards document created     |
