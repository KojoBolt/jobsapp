import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Download, RefreshCw, Inbox, Mail, Layers } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

interface Summary {
  id: string;
  job_count: number;
  emailed: boolean;
  created_at: string;
}

const Report = () => {
  const { dark } = useRamp();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("application_summaries")
      .select("id, job_count, emailed, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setSummaries((data as Summary[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDownload = async (id: string) => {
    setDownloadingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("get-summary-url", {
        body: { summaryId: id },
      });
      if (error) {
        const body = await (error as any).context?.json?.().catch(() => null);
        toast.error(body?.error || "Could not open this report.");
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("No download link returned.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const accent = dark ? CHART.accentDark : CHART.accent;
  const good = dark ? CHART.goodDark : CHART.good;

  const totalApplications = summaries.reduce((sum, s) => sum + (s.job_count || 0), 0);

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-4">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>
              Application reports
            </h1>
            <p className={`text-[12px] ${T.muted}`}>
              Summaries of the applications we've submitted on your behalf.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border ${T.hairline}
                        px-3 py-2 text-[12px] font-semibold ${T.ink} transition-colors
                        hover:bg-[#F4F4F2] disabled:opacity-50 dark:hover:bg-white/5`}
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* ── Totals — only once there's something to total ─────────────── */}
        {!loading && summaries.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
              <div className="flex items-center gap-2">
                <FileText size={13} style={{ color: accent }} />
                <span className={`text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
                  Reports
                </span>
              </div>
              <p className={`mt-2 text-[26px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
                {summaries.length}
              </p>
            </div>
            <div className={`rounded-2xl border ${T.hairline} bg-white p-4 dark:bg-[#1A1A19]`}>
              <div className="flex items-center gap-2">
                <Layers size={13} style={{ color: accent }} />
                <span className={`text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>
                  Applications covered
                </span>
              </div>
              <p className={`mt-2 text-[26px] font-bold leading-none tracking-[-0.02em] ${T.ink}`}>
                {totalApplications.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* ── List ───────────────────────────────────────────────────────── */}
        <div className={`overflow-hidden rounded-2xl border ${T.hairline} bg-white dark:bg-[#1A1A19]`}>
          {loading ? (
            <div className={`divide-y ${T.divide}`}>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 p-4">
                  <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                    <div className="h-3 w-56 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  </div>
                  <div className="h-8 w-24 shrink-0 animate-pulse rounded-lg bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              ))}
            </div>
          ) : summaries.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <span
                className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl"
                style={{ backgroundColor: `${accent}1A`, color: accent }}
              >
                <Inbox size={18} />
              </span>
              <p className={`text-[14px] font-bold ${T.ink}`}>No reports yet</p>
              <p className={`mx-auto mt-1 max-w-sm text-[12px] leading-relaxed ${T.muted}`}>
                When we prepare a summary of your applications, it will appear here for you
                to download.
              </p>
            </div>
          ) : (
            <div className={`divide-y ${T.divide}`}>
              {summaries.map((s) => (
                <div
                  key={s.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-3.5"
                >
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                    style={{ backgroundColor: `${accent}1A`, color: accent }}
                  >
                    <FileText size={18} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className={`text-[13.5px] font-bold leading-tight ${T.ink}`}>
                      Application summary
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`text-[11.5px] ${T.muted}`}>
                        {s.job_count} application{s.job_count === 1 ? "" : "s"}
                      </span>
                      <span className={`text-[11.5px] ${T.muted}`}>·</span>
                      <span className={`text-[11.5px] ${T.muted}`}>{formatDate(s.created_at)}</span>
                      {s.emailed && (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                          style={{ backgroundColor: `${good}1F`, color: good }}
                        >
                          <Mail size={9} />
                          Emailed
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(s.id)}
                    disabled={downloadingId === s.id}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg
                               bg-[#111110] px-3.5 py-2 text-[12px] font-semibold text-white
                               transition-opacity hover:opacity-90 disabled:opacity-50
                               dark:bg-white dark:text-[#111110]"
                  >
                    <Download size={13} />
                    {downloadingId === s.id ? "Opening…" : "Download"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Report;