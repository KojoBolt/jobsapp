import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { FUNNEL_CATALOG } from "../_shared/funnelCatalog.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function sha512Hmac(secret: string, payload: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Resolve an anonymous funnel buyer to an auth user, creating one if needed.
 *
 * `profiles` has no foreign key to auth.users, so a profile row can outlive the
 * user it described — trusting its id blindly is what produced a
 * payments_user_id_fkey violation. Every candidate id is verified against
 * auth.users before use.
 *
 * Returns the user id, or null if the account could not be established.
 */
// deno-lint-ignore no-explicit-any
async function resolveBuyerUser(supabase: any, email: string, firstName: string): Promise<string | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profile?.id) {
    const { data: existing } = await supabase.auth.admin.getUserById(profile.id);
    if (existing?.user?.id) return existing.user.id;
    console.warn(`Stale profile ${profile.id} for ${email} — no matching auth user, creating one`);
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    // Unconfirmed on purpose: clicking the activation link in the receipt is
    // what confirms the address, so a mistyped email can't be taken over.
    email_confirm: false,
    user_metadata: { full_name: firstName || email, source: "funnel" },
  });

  if (created?.user?.id) return created.user.id;

  console.error("resolveBuyerUser createUser failed:", JSON.stringify(createError));
  return null;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Receipt + "finish setting up your account" email for funnel buyers.
 *
 * The buyer paid as a stranger; the account was created for them moments ago by
 * resolveBuyerUser and is still unconfirmed. The CTA is a Supabase magic link:
 * one click confirms the address and signs them in, no password. Sent via
 * Resend (already the provider used by generate-application-summary) because
 * Supabase's built-in SMTP is rate-limited to a few mails an hour.
 *
 * Returns an error string on failure, or null on success. Never throws — the
 * caller must still return 200 to Paystack.
 */
// deno-lint-ignore no-explicit-any
async function sendFunnelReceipt(
  supabase: any,
  paymentRow: any,
  reference: string,
  email: string,
  rawFirstName: string,
  itemsCsv: string,
): Promise<string | null> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const EMAIL_FROM = Deno.env.get("FUNNEL_EMAIL_FROM") || "JobApp <hello@thejobapp.online>";
  const APP_URL = Deno.env.get("APP_URL") || "https://thejobapp.online";

  if (!RESEND_API_KEY) return "RESEND_API_KEY is not configured";
  if (!email) return "No buyer email to send to";

  const firstName = (rawFirstName || "there").split(" ")[0];

  // Line items ride in Paystack's metadata as a comma-joined id list, resolved
  // back to names and prices through the same catalog that priced the order.
  const items = String(itemsCsv ?? "")
    .split(",")
    .map((id: string) => FUNNEL_CATALOG[id.trim()])
    .filter(Boolean);

  // Derived from the canonical subunit amount.
  const total = Number(paymentRow.amount_subunit ?? 0) / 100;

  // One-click link that confirms the address and starts a session.
  let actionLink = `${APP_URL}/auth`;
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${APP_URL}/dashboard` },
    });
    if (linkData?.properties?.action_link) {
      actionLink = linkData.properties.action_link;
    }
  } catch (_) {
    // Fall through to the plain /auth URL — a receipt without a magic link is
    // still far better than no receipt at all.
  }

  const rows = items
    .map(
      (i: { name: string; priceUsd: number }) =>
        `<tr><td style="padding:6px 0;color:#57504B">${escapeHtml(i.name)}</td>` +
        `<td align="right" style="padding:6px 0;color:#151515;font-weight:600">$${Number(i.priceUsd).toFixed(2)}</td></tr>`,
    )
    .join("");

  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#151515">
    <h1 style="font-size:22px;margin:0 0 8px">Payment confirmed, ${escapeHtml(firstName)}</h1>
    <p style="color:#57504B;line-height:1.6;margin:0 0 24px">
      Thanks for your order. Here's your receipt — keep it for your records.
    </p>

    <table width="100%" style="border-collapse:collapse;font-size:14px">
      ${rows}
      <tr><td colspan="2" style="border-top:1px solid #E6E6E1;padding-top:10px"></td></tr>
      <tr>
        <td style="font-weight:700">Total paid</td>
        <td align="right" style="font-weight:700">$${total.toFixed(2)} USD</td>
      </tr>
    </table>

    <p style="color:#8E8E86;font-size:12px;margin:12px 0 28px">Reference: ${escapeHtml(reference)}</p>

    <div style="background:#F2F2EE;border-radius:12px;padding:20px;margin-bottom:24px">
      <h2 style="font-size:16px;margin:0 0 8px">One last step to start your job deployment</h2>
      <p style="color:#57504B;line-height:1.6;margin:0 0 16px;font-size:14px">
        We've reserved your account under this email address. Click below to finish setting it up —
        no password needed — and we'll start sending your applications.
      </p>
      <a href="${actionLink}"
         style="display:inline-block;background:#2E3D12;color:#fff;text-decoration:none;
                padding:14px 28px;border-radius:10px;font-weight:700;font-size:14px">
        Activate my account
      </a>
      <p style="color:#8E8E86;font-size:12px;margin:14px 0 0">
        This link is single-use and expires. If it stops working, request a new one at ${escapeHtml(APP_URL)}/auth
      </p>
    </div>

    <p style="color:#8E8E86;font-size:12px;line-height:1.6;margin:0">
      Covered by our 30-day money back guarantee. Questions about this order? Reply to this email
      and quote the reference above.
    </p>
  </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [email],
        subject: `Payment confirmed — $${total.toFixed(2)} · activate your account`,
        html,
      }),
    });

    if (res.ok) return null;
    const errBody = await res.json().catch(() => null);
    return errBody?.message || errBody?.error || `Resend returned ${res.status}`;
  } catch (e) {
    return e instanceof Error ? e.message : "Email request failed";
  }
}

serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !PAYSTACK_SECRET_KEY) {
      return json({ error: "Missing required env vars" }, 500);
    }

    const rawBody = await req.text();
    const receivedSignature = req.headers.get("x-paystack-signature") || "";
    const expectedSignature = await sha512Hmac(PAYSTACK_SECRET_KEY, rawBody);

    if (receivedSignature !== expectedSignature) {
      return json({ error: "Invalid signature" }, 401);
    }

    const event = JSON.parse(rawBody);

    if (event?.event !== "charge.success") {
      return json({ ok: true, message: "Ignored event type" });
    }

    const reference = event?.data?.reference;
    const paystackStatus = event?.data?.status;
    const transactionId = String(event?.data?.id ?? "");
    const eventAmount = Number(event?.data?.amount ?? 0);

    if (!reference || paystackStatus !== "success") {
      return json({ ok: true, message: "Ignored non-success payload" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: paymentRow, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .eq("provider", "paystack")
      .single();

    if (paymentError || !paymentRow) {
      return json({ error: "Payment row not found" }, 404);
    }

    if (paymentRow.status === "success") {
      return json({ ok: true, message: "Already processed" });
    }

    // Amount check against what we recorded at checkout.
    if (Number(paymentRow.amount_subunit ?? 0) !== eventAmount) {
      return json({ error: "Amount mismatch" }, 400);
    }

    // Re-verify with Paystack directly (don't trust the webhook body alone).
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    );

    const verifyData = await verifyRes.json().catch(() => null);

    if (!verifyRes.ok || !verifyData?.status || verifyData?.data?.status !== "success") {
      return json({ error: "Paystack verification failed" }, 400);
    }

    const verifiedAmount = Number(verifyData?.data?.amount ?? 0);

    if (verifiedAmount !== Number(paymentRow.amount_subunit ?? 0)) {
      return json({ error: "Verified amount mismatch" }, 400);
    }

    // ─────────────────────────────────────────────────────────────────────
    //  FUNNEL PURCHASE PATH
    //  Grants credits/plan like the credits path, then emails the buyer a
    //  receipt plus a one-click link to finish setting up their account.
    //  Self-contained: returns before the product and credits paths.
    // ─────────────────────────────────────────────────────────────────────
    if (paymentRow.purpose === "funnel") {
      const meta = verifyData?.data?.metadata ?? {};
      const buyerEmail = String(meta.buyer_email || verifyData?.data?.customer?.email || "").trim();
      const firstName = String(meta.first_name || "").trim();

      if (!buyerEmail) {
        console.error("Funnel payment has no buyer email:", reference);
        return json({ error: "No buyer email on the transaction" }, 400);
      }

      // Resolved BEFORE the payment is marked successful. If this fails we
      // return non-200 so Paystack retries while the row is still `pending` —
      // marking success first would trip the "Already processed" guard above
      // and the buyer would never get an account.
      const userId = paymentRow.user_id ?? (await resolveBuyerUser(supabase, buyerEmail, firstName));
      if (!userId) {
        return json({ error: "Could not establish an account for the buyer" }, 500);
      }

      const { error: updatePaymentError } = await supabase
        .from("payments")
        .update({ status: "success", paystack_transaction_id: transactionId, user_id: userId })
        .eq("reference", reference)
        .eq("provider", "paystack")
        .neq("status", "success");

      if (updatePaymentError) {
        return json({ error: updatePaymentError.message }, 500);
      }

      const grantedCredits = Number(paymentRow.credits ?? 0);

      if (grantedCredits > 0) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("plan, credits_remaining, total_credits_earned")
          .eq("id", userId)
          .single();

        if (profileError || !profile) {
          return json({ error: "Profile not found" }, 404);
        }

        const { error: grantError } = await supabase
          .from("profiles")
          .update({
            plan: paymentRow.plan === "free" ? "starter" : paymentRow.plan,
            credits_remaining: Number(profile.credits_remaining ?? 0) + grantedCredits,
            total_credits_earned: Number(profile.total_credits_earned ?? 0) + grantedCredits,
          })
          .eq("id", userId);

        if (grantError) {
          return json({ error: grantError.message }, 500);
        }
      }

      // Email is best-effort and guarded by email_sent_at: Paystack retries
      // deliveries, and a slow provider must never turn this into a non-200
      // that triggers another retry and a second fulfilment.
      if (!paymentRow.email_sent_at) {
        const emailError = await sendFunnelReceipt(
          supabase,
          paymentRow,
          reference,
          buyerEmail,
          firstName,
          String(meta.items ?? ""),
        );
        if (emailError) {
          console.error("Funnel receipt email failed:", emailError);
        } else {
          await supabase
            .from("payments")
            .update({ email_sent_at: new Date().toISOString() })
            .eq("reference", reference);
        }
      }

      return json({ ok: true, message: "Funnel purchase granted" });
    }

    // ─────────────────────────────────────────────────────────────────────
    //  PRODUCT PURCHASE PATH
    //  Self-contained: marks payment success + grants the product. Never
    //  touches profile/credits logic. Returns before the credits path.
    // ─────────────────────────────────────────────────────────────────────
    if (paymentRow.purpose === "product") {
      const { error: updatePaymentError } = await supabase
        .from("payments")
        .update({ status: "success", paystack_transaction_id: transactionId })
        .eq("reference", reference)
        .eq("provider", "paystack")
        .neq("status", "success");

      if (updatePaymentError) {
        return json({ error: updatePaymentError.message }, 500);
      }

      const { error: purchaseErr } = await supabase
        .from("purchases")
        .upsert(
          {
            user_id: paymentRow.user_id,
            product_id: paymentRow.product_id,
            payment_reference: reference,
            provider: "paystack",
          },
          { onConflict: "user_id,product_id", ignoreDuplicates: true }
        );

      if (purchaseErr) {
        return json({ error: purchaseErr.message }, 500);
      }

      return json({ ok: true, message: "Product purchase granted" });
    }

    // ─────────────────────────────────────────────────────────────────────
    //  CREDITS / PLAN PATH (unchanged original behavior)
    // ─────────────────────────────────────────────────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan, credits_remaining, total_credits_earned")
      .eq("id", paymentRow.user_id)
      .single();

    if (profileError || !profile) {
      return json({ error: "Profile not found" }, 404);
    }

    const nextPlan = paymentRow.plan === "free" ? "starter" : paymentRow.plan;
    const nextCredits =
      Number(profile.credits_remaining ?? 0) + Number(paymentRow.credits ?? 0);
    const nextTotalCredits =
      Number(profile.total_credits_earned ?? 0) + Number(paymentRow.credits ?? 0);

    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({
        status: "success",
        paystack_transaction_id: transactionId,
      })
      .eq("reference", reference)
      .eq("provider", "paystack")
      .neq("status", "success");

    if (updatePaymentError) {
      return json({ error: updatePaymentError.message }, 500);
    }

    const { error: updateProfileError } = await supabase
      .from("profiles")
      .update({
        plan: nextPlan,
        credits_remaining: nextCredits,
        total_credits_earned: nextTotalCredits,
      })
      .eq("id", paymentRow.user_id);

    if (updateProfileError) {
      return json({ error: updateProfileError.message }, 500);
    }

    return json({ ok: true });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});