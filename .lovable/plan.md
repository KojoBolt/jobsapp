

# Comprehensive Update: Dashboard Cleanup, Legal Overhaul, FAQ, and Onboarding Tour

This plan covers 6 major areas across 15+ files. Given the scope, implementation will be broken into logical phases.

---

## 1. Dashboard Cleanup

### Remove "Interview Requests" and "Response Rate" Cards
- **File:** `src/components/dashboard/StatsCards.tsx`
- Remove the last two stat objects from the `stats` array ("Interview Requests" and "Response Rate")
- Update grid to `lg:grid-cols-2` since only 2 cards remain

### Change "Low on leads?" to "Low on Job Applications?"
- **File:** `src/components/dashboard/CrossSellBanner.tsx` (line 44)
- Replace `"Low on leads?"` with `"Low on Job Applications?"`

---

## 2. Global Legal and Policy Updates -- Remove 7-Day Money-Back Guarantee

All instances of the "7-day money-back guarantee" will be replaced with references to the new "Refund & Satisfaction Policy."

| File | What Changes |
|------|-------------|
| `src/components/landing/Hero.tsx` (line 84) | Replace "7-day money-back guarantee" with "Human-Touch Quality Guarantee" and link concept |
| `src/components/landing/PricingSection.tsx` (lines 14, 55, 89) | Remove "7-day money-back guarantee" from features list; replace "7-Day Refund" badge with "Quality Guarantee" badge; update footer text to reference the Refund Policy page |
| `src/components/dashboard/PowerUpWidget.tsx` (line 120) | Replace "7-day satisfaction guarantee included" with "Human-Touch Quality Guarantee included" |
| `src/components/dashboard/SupportPanel.tsx` (line 38) | Update refund FAQ answer to reference the new policy |
| `src/pages/Support.tsx` (line 20) | Same FAQ update as SupportPanel |
| `src/components/legal/TermsOfService.tsx` (lines 63-68) | Rewrite Section 6 to reference the new Refund & Satisfaction Policy instead of the 7-day guarantee |

---

## 3. Delivery Timeline: 72 Hours to 7 Days

| File | What Changes |
|------|-------------|
| `src/components/landing/Hero.tsx` (lines 62, 76) | "72 hours" becomes "7 days"; "72-hour turnaround" becomes "7-day turnaround" |

---

## 4. New Refund Policy Page and Integration

### New File: `src/pages/RefundPolicy.tsx`
- Dedicated page at `/refund-policy`
- Header: "Refund & Satisfaction Policy" styled with `font-family: 'Playfair Display', serif`
- Body text in Inter (default font)
- Contains all 5 sections as specified (Human-Touch Guarantee, Refund Eligibility, Identity Vault Exception, How to Request, Abuse Prevention)
- Effective date: February 10, 2026
- Uses `DashboardLayout` or a minimal standalone layout for distraction-free reading

### New File: `src/components/legal/RefundPolicyContent.tsx`
- Reusable content component (used both in the dedicated page and in the LegalModal)

### Route Registration
- **File:** `src/App.tsx` -- Add `/refund-policy` route

### Footer Link
- **File:** `src/components/landing/Footer.tsx` -- Add "Refund Policy" link (either as a LegalModal or a direct link to `/refund-policy`)

### Checkout Consent Checkbox
- **File:** `src/components/dashboard/PowerUpWidget.tsx` -- Add a mandatory checkbox before the "Pay" button: "I have read and agree to the Refund & Satisfaction Policy" with a link to `/refund-policy`. The Pay button is disabled until checked.
- **File:** `src/components/tracker/UpgradePaywall.tsx` -- Add similar consent text near the subscription buttons

---

## 5. FAQ Additions (Homepage + Support)

### New FAQ Entry: "Is there a money-back guarantee?"
Added to both FAQ locations with the Human-Touch Quality Guarantee answer.

| File | What Changes |
|------|-------------|
| `src/pages/Support.tsx` | Add new FAQ item to the `faqs` array |
| `src/components/dashboard/SupportPanel.tsx` | Add new FAQ item to the `faqs` array |

### Homepage FAQ Section
- **File:** `src/pages/Index.tsx` -- Add a new `<FAQSection />` component between Pricing and Footer
- **New File:** `src/components/landing/FAQSection.tsx` -- Accordion-style FAQ with Playfair Display for questions, Inter for answers, subtle `border-bottom` between items. Includes the money-back guarantee question plus other key questions from the Support page.

---

## 6. Concierge Onboarding Tour

### New Dependency
- Install `react-joyride` for the guided tour tooltip system

### New File: `src/components/onboarding/OnboardingTour.tsx`
- Tour component with 4 steps targeting sidebar elements and the "Add Job" button
- Step 1: Identity Vault (sidebar) -- "Map your DNA..."
- Step 2: Strategy (sidebar) -- "Set your Targets..."
- Step 3: Job Trackr (sidebar) -- "Mission Control..."
- Step 4: Add Button (within tracker) -- "Ready to launch?..."
- Tooltip styling: purple-to-blue gradient border, Playfair Display headers, Inter body, dark backdrop with `backdrop-blur`
- "Skip Tour" and "Don't show this again" options
- On completion: confetti animation (reuse existing `src/components/accelerators/Confetti.tsx`) + final message with "Go to Vault" button

### Tour Trigger Logic
- **File:** `src/components/dashboard/DashboardLayout.tsx`
- Check `localStorage` for `onboarding_tour_completed` flag
- Check if user has 0 applications (query `job_applications` table)
- If both conditions met: render `<OnboardingTour />`
- When user completes or skips with "Don't show again": set the localStorage flag

### Sidebar Element IDs
- Add `id` attributes to key sidebar elements so react-joyride can target them:
  - `id="sidebar-identity-vault"` on the Identity Vault nav item
  - `id="sidebar-strategy"` on the Strategy section
  - `id="sidebar-tracker"` on the Job Trackr nav item

---

## Summary of All Files Affected

| Action | File |
|--------|------|
| Edit | `src/components/dashboard/StatsCards.tsx` |
| Edit | `src/components/dashboard/CrossSellBanner.tsx` |
| Edit | `src/components/landing/Hero.tsx` |
| Edit | `src/components/landing/PricingSection.tsx` |
| Edit | `src/components/dashboard/PowerUpWidget.tsx` |
| Edit | `src/components/dashboard/SupportPanel.tsx` |
| Edit | `src/pages/Support.tsx` |
| Edit | `src/components/legal/TermsOfService.tsx` |
| Edit | `src/components/landing/Footer.tsx` |
| Edit | `src/pages/Index.tsx` |
| Edit | `src/App.tsx` |
| Edit | `src/components/dashboard/DashboardLayout.tsx` |
| Edit | `src/components/tracker/UpgradePaywall.tsx` |
| Create | `src/pages/RefundPolicy.tsx` |
| Create | `src/components/legal/RefundPolicyContent.tsx` |
| Create | `src/components/landing/FAQSection.tsx` |
| Create | `src/components/onboarding/OnboardingTour.tsx` |

