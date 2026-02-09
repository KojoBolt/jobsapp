

## Fix: Unlock Job Trackr After Payment

### The Problem
The Tracker dashboard is fully built but never unlocks after payment because:
1. **Guest users**: After Paystack redirects back to `/job-tracker?subscribed=true`, the callback calls `refreshProfile()` which needs a signed-in user -- guests have no profile to refresh, so `isSubscribed` stays `false`.
2. **Signed-in users**: The edge function sets `subscription_tier` at checkout initialization (before payment), which is unreliable. But the redirect callback does work if the user stays signed in.
3. **No webhook**: There's no Paystack webhook to confirm payment actually succeeded.

### The Solution
Since this is a **temporary measure** allowing guest checkout, we'll use a simple approach: store the subscription state in `localStorage` after Paystack redirects back, so the Tracker unlocks immediately -- even for guests.

### Changes

**1. `src/pages/JobTracker.tsx`**
- Add `localStorage`-based subscription fallback: check both `profile?.subscription_tier` AND a `localStorage` key (`job_trackr_subscribed`)
- On the `?subscribed=true` callback, set the localStorage key with the plan info
- Update `isSubscribed` logic: `profile?.subscription_tier === "plan_1" || ... || localStorage.getItem("job_trackr_subscribed")`
- For guest users (no `user`), still show the Tracker UI but disable database operations (add/edit/delete) and show a message prompting them to sign up to save applications
- Parse the `plan` from URL params or localStorage to determine tier limits

**2. `supabase/functions/subscription-checkout/index.ts`**
- Move the profile update to happen only for signed-in users (already done)
- Add the `plan` to the callback URL as a query param so the frontend knows which plan was purchased: `callbackUrl + "?subscribed=true&plan=" + plan`
- Wait -- actually Paystack uses its own callback_url and appends `?trxref=...&reference=...`. We should append our plan info differently.
- Better approach: encode the plan in the Paystack metadata and pass it via the callback URL. Update the callback_url to include `&plan={plan}` so the frontend can read it.

**3. Updated callback URL flow**
- Edge function sets callback_url to: `{callbackUrl}&plan={plan}` (or `?plan={plan}` if no existing params)  
- After Paystack payment, user lands on `/job-tracker?subscribed=true&plan=plan_1`
- Frontend reads both params, stores in localStorage, unlocks UI

### What the user sees after paying
- **Guest user**: Tracker UI unlocks. They see stats, can browse the empty dashboard, but adding jobs requires sign-up (since database operations need auth). A banner says "Sign up to save your applications."
- **Signed-in user**: Tracker UI unlocks fully with all CRUD functionality.

### Technical Details

```text
Payment Flow:
  User clicks plan -> Edge function -> Paystack checkout
  -> Paystack redirects to /job-tracker?subscribed=true&plan=plan_1
  -> Frontend stores { tier: "plan_1", timestamp } in localStorage
  -> isSubscribed checks profile OR localStorage -> Tracker UI shows
```

**localStorage schema:**
```json
{
  "tier": "plan_1",
  "timestamp": 1234567890
}
```

**Updated isSubscribed logic:**
```typescript
const localSub = localStorage.getItem("job_trackr_subscribed");
const localTier = localSub ? JSON.parse(localSub).tier : null;
const isSubscribed = profile?.subscription_tier === "plan_1" 
  || profile?.subscription_tier === "plan_2" 
  || localTier === "plan_1" 
  || localTier === "plan_2";
```

### Files to modify
1. `supabase/functions/subscription-checkout/index.ts` -- append `plan` param to callback URL
2. `src/pages/JobTracker.tsx` -- add localStorage fallback for subscription state, handle guest mode
3. `src/components/tracker/UpgradePaywall.tsx` -- pass plan ID in callback URL

