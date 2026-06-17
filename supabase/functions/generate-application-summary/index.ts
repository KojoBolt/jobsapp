import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BUCKET = "client-summaries";

// Replace characters the standard PDF font (WinAnsi) can't encode so pdf-lib
// never throws "WinAnsi cannot encode" on messy company/role names.
function safe(s: string): string {
  if (!s) return "";
  return s
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\xFF]/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const EMAIL_FROM = Deno.env.get("SUMMARY_EMAIL_FROM") || "JobApp <reports@thejobapp.online>";

    // 1. Auth the caller and require admin.
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller }, error: authErr } = await userClient.auth.getUser(token);
    if (authErr || !caller) return json({ error: "Unauthorized" }, 401);

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: callerProfile } = await supabase
      .from("profiles").select("role").eq("id", caller.id).single();
    if (callerProfile?.role !== "admin") return json({ error: "Admin only" }, 403);

    // 2. Which user are we summarizing?
    const body = await req.json().catch(() => null);
    const targetUserId = body?.userId as string | undefined;
    if (!targetUserId) return json({ error: "Missing userId" }, 400);

    const { data: targetProfile } = await supabase
      .from("profiles").select("full_name, email").eq("id", targetUserId).single();
    if (!targetProfile) return json({ error: "Target user not found" }, 404);

    // 3. Pull their applications.
    const { data: apps } = await supabase
      .from("applications")
      .select("company_name, job_title, status, match_score, created_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })
      .limit(1000);

    const rows = apps || [];

    // 4. Compute summary stats.
    const countBy = (s: string) => rows.filter((r) => r.status === s).length;
    const stats = {
      total: rows.length,
      submitted: countBy("submitted"),
      completed: countBy("completed"),
      pending_review: countBy("pending_review"),
      failed: countBy("failed"),
      avgMatch: rows.length
        ? Math.round(rows.reduce((s, r) => s + (Number(r.match_score) || 0), 0) / rows.length)
        : 0,
    };

    // 5. Build the PDF.
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const A4 = { w: 595.28, h: 841.89 };
    const margin = 40;
    const ink = rgb(0.1, 0.1, 0.12);
    const grey = rgb(0.45, 0.45, 0.5);
    const line = rgb(0.85, 0.85, 0.88);

    let page = pdf.addPage([A4.w, A4.h]);
    let y = A4.h - margin;

    const text = (s: string, x: number, yy: number, size = 10, f = font, color = ink) =>
      page.drawText(safe(s ?? ""), { x, y: yy, size, font: f, color });
    const trunc = (s: string, max: number) => {
      const clean = safe(s || "");
      return clean.length > max ? clean.slice(0, max - 1) + "..." : clean;
    };

    // Header
    text("Application Summary Report", margin, y, 20, bold);
    y -= 22;
    text(`Prepared for ${targetProfile.full_name || targetProfile.email || "Client"}`, margin, y, 11, font, grey);
    y -= 14;
    text(`Generated ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}`, margin, y, 10, font, grey);
    y -= 26;

    // Summary stat boxes
    const stat = (label: string, value: string, x: number) => {
      page.drawRectangle({ x, y: y - 44, width: 96, height: 44, color: rgb(0.96, 0.96, 0.98) });
      text(value, x + 10, y - 20, 18, bold);
      text(label, x + 10, y - 36, 8, font, grey);
    };
    stat("TOTAL", String(stats.total), margin);
    stat("SUBMITTED", String(stats.submitted + stats.completed), margin + 104);
    stat("IN REVIEW", String(stats.pending_review), margin + 208);
    stat("AVG MATCH", `${stats.avgMatch}%`, margin + 312);
    y -= 70;

    // Table header
    const cols = { idx: margin, company: margin + 28, role: margin + 180, status: margin + 360, date: margin + 470 };
    const drawTableHeader = () => {
      text("#", cols.idx, y, 9, bold, grey);
      text("COMPANY", cols.company, y, 9, bold, grey);
      text("ROLE", cols.role, y, 9, bold, grey);
      text("STATUS", cols.status, y, 9, bold, grey);
      text("DATE", cols.date, y, 9, bold, grey);
      y -= 6;
      page.drawLine({ start: { x: margin, y }, end: { x: A4.w - margin, y }, thickness: 1, color: line });
      y -= 14;
    };
    drawTableHeader();

    rows.forEach((r, i) => {
      if (y < margin + 30) {
        page = pdf.addPage([A4.w, A4.h]);
        y = A4.h - margin;
        drawTableHeader();
      }
      text(String(i + 1), cols.idx, y, 9, font, grey);
      text(trunc(r.company_name, 26), cols.company, y, 9);
      text(trunc(r.job_title, 30), cols.role, y, 9);
      text(trunc((r.status || "").replace("_", " "), 18), cols.status, y, 9);
      text(new Date(r.created_at).toLocaleDateString("en-GB"), cols.date, y, 9, font, grey);
      y -= 16;
    });

    // Footer page numbers
    const pages = pdf.getPages();
    pages.forEach((p, i) => {
      p.drawText(`Page ${i + 1} of ${pages.length}`, {
        x: A4.w - margin - 70, y: 24, size: 8, font, color: grey,
      });
    });

    const pdfBytes = await pdf.save();

    // 6. Store in the private bucket.
    const path = `${targetUserId}/${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, pdfBytes, { contentType: "application/pdf", upsert: false });
    if (upErr) return json({ error: `Storage: ${upErr.message}` }, 500);

    // 7. Record the summary row — NOW ERROR-CHECKED so a missing table or
    //    failed insert fails loudly instead of silently leaving an orphaned file.
    const { data: summaryRow, error: rowErr } = await supabase
      .from("application_summaries")
      .insert({
        user_id: targetUserId,
        storage_path: path,
        job_count: stats.total,
        created_by: caller.id,
        emailed: false,
      })
      .select("id")
      .single();

    if (rowErr) {
      // Clean up the orphaned file so we don't leave junk in storage.
      await supabase.storage.from(BUCKET).remove([path]).catch(() => {});
      return json({ error: `DB insert failed: ${rowErr.message}` }, 500);
    }

    // 8. Email it (if Resend is configured and we have an address).
    let emailed = false;
    let emailError: string | null = null;
    const toEmail = targetProfile.email;
    if (RESEND_API_KEY && toEmail) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: EMAIL_FROM,
            to: [toEmail],
            subject: "Your JobApp Application Summary",
            html: `<p>Hi ${safe(targetProfile.full_name || "there")},</p>
                   <p>Attached is a summary of the <strong>${stats.total} applications</strong> we've submitted on your behalf. You can also view it anytime in your dashboard.</p>
                   <p>— The JobApp Team</p>`,
            attachments: [{ filename: "application-summary.pdf", content: base64Encode(pdfBytes) }],
          }),
        });
        if (res.ok) {
          emailed = true;
        } else {
          // Capture Resend's rejection reason so the admin can see WHY email failed.
          const errBody = await res.json().catch(() => null);
          emailError = errBody?.message || errBody?.error || `Resend returned ${res.status}`;
        }
      } catch (e) {
        emailError = e instanceof Error ? e.message : "Email request failed";
      }
      if (emailed) {
        await supabase.from("application_summaries")
          .update({ emailed: true }).eq("id", summaryRow.id);
      }
    } else if (!RESEND_API_KEY) {
      emailError = "RESEND_API_KEY not set";
    } else if (!toEmail) {
      emailError = "User has no email address";
    }

    // 9. Notify the user in-app (your bell system).
    await supabase.from("campaign_notifications").insert({
      user_id: targetUserId,
      message: `Your application summary (${stats.total} applications) is ready to view.`,
      read: false,
    }).then(() => {}, () => {});

    return json({
      ok: true,
      job_count: stats.total,
      emailed,
      email_error: emailError,   // surfaces WHY email didn't send, for the admin toast
      summary_id: summaryRow.id,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});