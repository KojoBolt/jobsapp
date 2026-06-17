import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Pure JS MD5 — same implementation as initialize-cryptomus
function makeMd5(input: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number): number {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
    return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return md5cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const binaryStr = unescape(encodeURIComponent(input));
  const m: number[] = [];
  for (let i = 0; i < binaryStr.length; i++) {
    m[i >> 2] = m[i >> 2] || 0;
    m[i >> 2] |= binaryStr.charCodeAt(i) << ((i % 4) * 8);
  }
  const l = binaryStr.length;
  m[l >> 2] |= 0x80 << ((l % 4) * 8);
  m[(((l + 64) >>> 9) << 4) + 14] = l * 8;

  let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;

  for (let i = 0; i < m.length; i += 16) {
    const [oa, ob, oc, od] = [a, b, c, d];
    a = md5ff(a,b,c,d,m[i+0], 7,-680876936);   b = md5ff(d,a,b,c,m[i+1],12,-389564586);
    c = md5ff(c,d,a,b,m[i+2],17, 606105819);   d = md5ff(b,c,d,a,m[i+3],22,-1044525330);
    a = md5ff(a,b,c,d,m[i+4], 7,-176418897);   b = md5ff(d,a,b,c,m[i+5],12, 1200080426);
    c = md5ff(c,d,a,b,m[i+6],17,-1473231341);  d = md5ff(b,c,d,a,m[i+7],22,-45705983);
    a = md5ff(a,b,c,d,m[i+8], 7, 1770035416);  b = md5ff(d,a,b,c,m[i+9],12,-1958414417);
    c = md5ff(c,d,a,b,m[i+10],17,-42063);       d = md5ff(b,c,d,a,m[i+11],22,-1990404162);
    a = md5ff(a,b,c,d,m[i+12],7, 1804603682);  b = md5ff(d,a,b,c,m[i+13],12,-40341101);
    c = md5ff(c,d,a,b,m[i+14],17,-1502002290); d = md5ff(b,c,d,a,m[i+15],22, 1236535329);

    a = md5gg(a,b,c,d,m[i+1], 5,-165796510);   b = md5gg(d,a,b,c,m[i+6], 9,-1069501632);
    c = md5gg(c,d,a,b,m[i+11],14, 643717713);  d = md5gg(b,c,d,a,m[i+0],20,-373897302);
    a = md5gg(a,b,c,d,m[i+5], 5,-701558691);   b = md5gg(d,a,b,c,m[i+10],9,  38016083);
    c = md5gg(c,d,a,b,m[i+15],14,-660478335);  d = md5gg(b,c,d,a,m[i+4],20,-405537848);
    a = md5gg(a,b,c,d,m[i+9], 5, 568446438);   b = md5gg(d,a,b,c,m[i+14],9,-1019803690);
    c = md5gg(c,d,a,b,m[i+3],14,-187363961);   d = md5gg(b,c,d,a,m[i+8],20, 1163531501);
    a = md5gg(a,b,c,d,m[i+13],5,-1444681467);  b = md5gg(d,a,b,c,m[i+2], 9,-51403784);
    c = md5gg(c,d,a,b,m[i+7],14, 1735328473);  d = md5gg(b,c,d,a,m[i+12],20,-1926607734);

    a = md5hh(a,b,c,d,m[i+5], 4,-378558);      b = md5hh(d,a,b,c,m[i+8],11,-2022574463);
    c = md5hh(c,d,a,b,m[i+11],16, 1839030562); d = md5hh(b,c,d,a,m[i+14],23,-35309556);
    a = md5hh(a,b,c,d,m[i+1], 4,-1530992060);  b = md5hh(d,a,b,c,m[i+4],11, 1272893353);
    c = md5hh(c,d,a,b,m[i+7],16,-155497632);   d = md5hh(b,c,d,a,m[i+10],23,-1094730640);
    a = md5hh(a,b,c,d,m[i+13],4, 681279174);   b = md5hh(d,a,b,c,m[i+0],11,-358537222);
    c = md5hh(c,d,a,b,m[i+3],16,-722521979);   d = md5hh(b,c,d,a,m[i+6],23, 76029189);
    a = md5hh(a,b,c,d,m[i+9], 4,-640364487);   b = md5hh(d,a,b,c,m[i+12],11,-421815835);
    c = md5hh(c,d,a,b,m[i+15],16, 530742520);  d = md5hh(b,c,d,a,m[i+2],23,-995338651);

    a = md5ii(a,b,c,d,m[i+0], 6,-198630844);   b = md5ii(d,a,b,c,m[i+7],10, 1126891415);
    c = md5ii(c,d,a,b,m[i+14],15,-1416354905); d = md5ii(b,c,d,a,m[i+5],21,-57434055);
    a = md5ii(a,b,c,d,m[i+12],6, 1700485571);  b = md5ii(d,a,b,c,m[i+3],10,-1894986606);
    c = md5ii(c,d,a,b,m[i+10],15,-1051523);    d = md5ii(b,c,d,a,m[i+1],21,-2054922799);
    a = md5ii(a,b,c,d,m[i+8], 6, 1873313359);  b = md5ii(d,a,b,c,m[i+15],10,-30611744);
    c = md5ii(c,d,a,b,m[i+6],15,-1560198380);  d = md5ii(b,c,d,a,m[i+13],21, 1309151649);
    a = md5ii(a,b,c,d,m[i+4], 6,-145523070);   b = md5ii(d,a,b,c,m[i+11],10,-1120210379);
    c = md5ii(c,d,a,b,m[i+2],15, 718787259);   d = md5ii(b,c,d,a,m[i+9],21,-343485551);

    a = safeAdd(a, oa); b = safeAdd(b, ob);
    c = safeAdd(c, oc); d = safeAdd(d, od);
  }

  return [a, b, c, d]
    .map(n => {
      let hex = '';
      for (let j = 0; j < 4; j++) {
        hex += ('0' + ((n >> (j * 8)) & 0xff).toString(16)).slice(-2);
      }
      return hex;
    })
    .join('');
}

serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const CRYPTOMUS_PAYMENT_API_KEY = Deno.env.get("CRYPTOMUS_PAYMENT_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !CRYPTOMUS_PAYMENT_API_KEY) {
      return json({ error: "Missing required env vars" }, 500);
    }

    const rawBody = await req.text();
    const receivedSignature = req.headers.get("sign") || "";

    // Now synchronous — no await
    const expectedSignature = makeMd5(btoa(rawBody) + CRYPTOMUS_PAYMENT_API_KEY);

    if (receivedSignature !== expectedSignature) {
      return json({ error: "Invalid signature" }, 401);
    }

    const payload = JSON.parse(rawBody);
    const result = payload?.result ?? payload;

    const reference = result?.order_id;
    const cryptomusUuid = result?.uuid;
    const paymentStatus = result?.payment_status;

    if (!reference) {
      return json({ error: "Missing order_id" }, 400);
    }

    const successStatuses = new Set(["paid", "paid_over"]);
    if (!successStatuses.has(paymentStatus)) {
      return json({ ok: true, message: "Ignored non-success status" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: paymentRow, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("reference", reference)
      .eq("provider", "cryptomus")
      .single();

    if (paymentError || !paymentRow) {
      return json({ error: "Payment row not found" }, 404);
    }

    if (paymentRow.status === "success") {
      return json({ ok: true, message: "Already processed" });
    }

    if (paymentRow.cryptomus_uuid && cryptomusUuid && paymentRow.cryptomus_uuid !== cryptomusUuid) {
      return json({ error: "UUID mismatch" }, 400);
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("plan, credits_remaining, total_credits_earned")
      .eq("id", paymentRow.user_id)
      .single();

    if (profileError || !profile) {
      return json({ error: "Profile not found" }, 404);
    }

    const nextPlan = paymentRow.plan === "free" ? "starter" : paymentRow.plan;
    const nextCredits = Number(profile.credits_remaining ?? 0) + Number(paymentRow.credits ?? 0);
    const nextTotalCredits = Number(profile.total_credits_earned ?? 0) + Number(paymentRow.credits ?? 0);

    const { error: updatePaymentError } = await supabase
      .from("payments")
      .update({ status: "success" })
      .eq("reference", reference)
      .eq("provider", "cryptomus")
      .neq("status", "success");

    if (updatePaymentError) {
      return json({ error: updatePaymentError.message }, 500);
    }

    if (paymentRow.purpose === "product") {
      // Grant the product instead of credits.
      const { error: purchaseErr } = await supabase
        .from("purchases")
        .upsert(
          {
            user_id: paymentRow.user_id,
            product_id: paymentRow.product_id,
            payment_reference: reference,
            provider: "cryptomus",
          },
          { onConflict: "user_id,product_id", ignoreDuplicates: true }
        );
      if (purchaseErr) return json({ error: purchaseErr.message }, 500);
      return json({ ok: true });
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