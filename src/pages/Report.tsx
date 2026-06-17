import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, RefreshCw, Inbox, Mail } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

interface Summary {
  id: string;
  job_count: number;
  emailed: boolean;
  created_at: string;
}

const Report = () => {
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

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Application Reports</h2>
            <p className="text-sm text-muted-foreground">
              Summaries of the applications we've submitted on your behalf.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border/50 bg-card" />
          ))}
        </div>
      ) : summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card py-16 text-center">
          <Inbox className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">No reports yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            When we prepare a summary of your applications, it will appear here for you to download.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {summaries.map((s) => (
            <Card key={s.id} className="border-border/50 bg-card">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    Application Summary
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{s.job_count} application{s.job_count === 1 ? "" : "s"}</span>
                    <span>•</span>
                    <span>{formatDate(s.created_at)}</span>
                    {s.emailed && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Mail className="h-2.5 w-2.5" />
                        Emailed
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => handleDownload(s.id)}
                  disabled={downloadingId === s.id}
                >
                  <Download className="h-3.5 w-3.5" />
                  {downloadingId === s.id ? "Opening…" : "Download"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  );
};

export default Report;