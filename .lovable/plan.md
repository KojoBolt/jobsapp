

# Apply Kokonut UI Shape Hero to Homepage

## Overview

Replace the current Hero section on the homepage with an adapted version of the Kokonut UI "Shapes Hero" component -- featuring animated floating geometric shapes that fall from above with a gentle bobbing motion. All existing text copy, badges, CTAs, and social proof will be preserved exactly as-is.

## What Changes

### Visual Effect
- Floating geometric shapes (rectangles, squares) with gradient fills animate down from above and gently bob up and down
- A subtle gradient overlay and edge-fade give the hero a polished, layered depth
- The existing background image and grid pattern will be replaced by the geometric shapes effect, fitting the premium Fintech aesthetic

### What Stays the Same
- All text: headline, subheadline, social proof line
- Trust badges: "Human-Verified" and "2,400+ Interviews Generated"
- CTA buttons: "Start Your Campaign" and "See How It Works"
- Navigation bar remains untouched

---

## Technical Details

### 1. Create `src/components/ui/shape-landing-hero.tsx`

A new reusable component adapted from the Kokonut UI source (MIT licensed). Key adaptations from the original:

- **Import change**: Use `framer-motion` (already installed) instead of `motion/react` (Next.js specific)
- **Font handling**: Remove `next/font/google` Pacifico import. Instead, use a Google Fonts CSS import or apply the gradient text styling with the existing `gradient-text` utility class
- **Tailwind v3 compatibility**: Replace `bg-linear-to-r` (Tailwind v4 syntax) with `bg-gradient-to-r` (Tailwind v3 syntax used in this project)
- **Export**: Named export `HeroGeometric` component with props for `badge`, `title1`, `title2`, and a `children` prop for injecting custom content (CTAs, badges, etc.)
- **Dark mode colors**: Adapt the shape gradients to use the project's deep navy / electric blue / gold palette instead of indigo/rose

### 2. Update `src/components/landing/Hero.tsx`

Replace the current Hero implementation to use the new `HeroGeometric` component as the background layer, while keeping all existing content (badges, headline, subheadline, CTAs, social proof) rendered inside it via children.

The existing copy will be preserved exactly:
- "Stop Spending Hours on Job Applications. Start Getting Interviews."
- "Upload your resume once. Our AI + human team crafts personalized applications..."
- "7-day money-back guarantee . No subscription . Pay once"
- Both badge components and both CTA buttons

### 3. Minor CSS addition in `src/index.css`

Optionally load the Pacifico font from Google Fonts via `@import` for the decorative title2 text styling (the "Start Getting Interviews." line), matching the original component's calligraphic accent. If this doesn't fit the Fintech aesthetic, the existing `gradient-text` class will be used instead.

### No new dependencies needed
- `framer-motion` and `lucide-react` are already installed
- `cn` utility already exists at `@/lib/utils`
