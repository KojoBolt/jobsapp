

## Use Live Paystack Keys for Guest Checkout (No Email Required)

Both the `paystack-checkout` and `subscription-checkout` edge functions already use the same `PAYSTACK_SECRET_KEY` secret (live keys). The problem is Paystack's API always requires a valid email address -- but we can auto-generate one so the user never has to type anything.

### Changes

**1. `src/components/tracker/UpgradePaywall.tsx`**
- Remove the email validation check that blocks checkout
- Remove the guest email input field entirely
- Auto-generate a valid placeholder email: `checkout-{timestamp}@jobstack-ai.lovable.app`
- Users just click a plan button and go straight to Paystack

**2. `supabase/functions/subscription-checkout/index.ts`**
- Fix bug on line 88: `supabase` variable is referenced but never created -- add `const supabase = createClient(supabaseUrl, supabaseServiceKey)` 
- Keep the email fallback chain: signed-in user email > request body email > auto-generated email

### Result
Users on the Upgrade page will see plan cards with buttons only -- no email input, no sign-in required. Clicking a plan button immediately redirects to Paystack checkout using your live keys.

