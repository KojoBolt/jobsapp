import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Upload,
  Star,
  Trash2,
  Plus,
  CheckCircle2,
  Loader2,
  X,
  Cloud,
} from "lucide-react";
import VerifiedHumanBadge from "@/components/dashboard/VerifiedHumanBadge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CHART, T, Panel, PanelHeader, EmptyState } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

export interface ResumeVersion {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  isPrimary: boolean;
  uploadedAt: string;
}

const MAX_RESUMES = 5;

const ResumeManager = () => {
  const { dark } = useRamp();
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewName, setViewName] = useState<string>("");

  const accent = dark ? CHART.accentDark : CHART.accent;
  const danger = dark ? CHART.criticalDark : CHART.critical;

  useEffect(() => {
    fetchResumes();
  }, []);

  // Escape closes whichever overlay is open — the shadcn Dialog used to give us
  // this for free, so it has to be kept when hand-rolling the overlays.
  useEffect(() => {
    if (!uploadOpen && !viewUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (viewUrl) setViewUrl(null);
      else if (!uploading) setUploadOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [uploadOpen, viewUrl, uploading]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("resumes")
        .select("id, file_name, file_path, file_url, job_title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: ResumeVersion[] = (data || []).map((row, index) => ({
        id: row.id,
        // Use job_title as the display name, fall back to file_name
        name: row.job_title || row.file_name,
        fileName: row.file_name,
        filePath: row.file_path || "",
        fileUrl: row.file_url || "",
        // First resume (most recent) is treated as primary
        isPrimary: index === 0,
        uploadedAt: new Date(row.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      }));

      setResumes(mapped);
    } catch (err) {
      console.error("Failed to fetch resumes:", err);
      toast({
        title: "Failed to load resumes",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Set primary (local only — no isPrimary column in DB) ─────────────────
  const setPrimary = (id: string) => {
    setResumes((prev) => prev.map((r) => ({ ...r, isPrimary: r.id === id })));
    toast({
      title: "Primary Resume Updated",
      description: "Future applications will use this resume.",
    });
  };

  // ── Delete resume ────────────────────────────────────────────────────────
  const deleteResume = async (id: string) => {
    const target = resumes.find((r) => r.id === id);
    if (!target) return;

    if (target.isPrimary) {
      toast({
        title: "Cannot Delete",
        description: "Set another resume as primary first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeletingId(id);

      // Delete from storage if file_path exists
      if (target.filePath) {
        await supabase.storage.from("resumes").remove([target.filePath]);
      }

      // Delete from DB
      const { error } = await supabase
        .from("resumes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setResumes((prev) => prev.filter((r) => r.id !== id));
      toast({
        title: "Resume Removed",
        description: `"${target.name}" has been deleted.`,
      });
    } catch (err) {
      console.error("Delete error:", err);
      toast({
        title: "Delete Failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };


  const handleUpload = async () => {
    if (!newName.trim() || !newFile) {
      toast({
        title: "Missing Info",
        description: "Please provide a name and select a file.",
        variant: "destructive",
      });
      return;
    }

    if (resumes.length >= MAX_RESUMES) {
      toast({
        title: "Limit Reached",
        description: `You can store up to ${MAX_RESUMES} resume versions.`,
        variant: "destructive",
      });
      return;
    }

    if (newFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const sanitizedName = newFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, newFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("resumes")
        .getPublicUrl(filePath);

      const fileUrl = urlData?.publicUrl || "";

      // Insert record into DB
      const { data: inserted, error: insertError } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          file_name: newFile.name,
          file_path: filePath,
          file_url: fileUrl,
          job_title: newName.trim(),
        })
        .select("id, file_name, file_path, file_url, job_title, created_at")
        .single();

      if (insertError) throw insertError;

      const newResume: ResumeVersion = {
        id: inserted.id,
        name: inserted.job_title || inserted.file_name,
        fileName: inserted.file_name,
        filePath: inserted.file_path || "",
        fileUrl: inserted.file_url || "",
        isPrimary: resumes.length === 0,
        uploadedAt: new Date(inserted.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };

      setResumes((prev) => [newResume, ...prev]);
      setNewName("");
      setNewFile(null);
      setUploadOpen(false);

      toast({
        title: "Resume Uploaded ✓",
        description: `"${newResume.name}" stored securely.`,
      });
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "Upload Failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const atLimit = resumes.length >= MAX_RESUMES;

  /* ── Row-level action button ─────────────────────────────────────────────
     Quiet by default so three of them in a row don't compete with the
     resume name; tint only appears on hover. */
  const rowAction = `inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11.5px]
                     font-medium transition-colors disabled:opacity-40`;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Panel className="overflow-hidden">
        <PanelHeader
          icon={FileText}
          title="Resume manager"
          right={
            <>
              <span className={`text-[11px] tabular-nums ${T.muted}`}>
                {loading ? "Loading…" : `${resumes.length}/${MAX_RESUMES} stored`}
              </span>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                disabled={atLimit || loading}
                title={atLimit ? `Limit of ${MAX_RESUMES} versions reached` : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#111110] px-2.5 py-1.5
                           text-[12px] font-semibold text-white transition-opacity
                           hover:opacity-90 disabled:opacity-40
                           dark:bg-white dark:text-[#111110]"
              >
                <Plus size={13} />
                Add resume
              </button>
            </>
          }
        />

        {loading ? (
          <div className={`space-y-2 border-t ${T.hairline} p-4`}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-xl bg-[#F7F7F5] dark:bg-white/[0.03]"
              />
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No resumes yet"
            hint="Upload your first resume to get started — you can store up to 5 versions."
          />
        ) : (
          <div className={`divide-y ${T.divide} border-t ${T.hairline}`}>
            <AnimatePresence initial={false}>
              {resumes.map((resume) => (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className={`flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 ${T.hover}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                        style={{ backgroundColor: `${accent}1A`, color: accent }}
                      >
                        <FileText size={16} />
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`truncate text-[12.5px] font-bold ${T.ink}`}>
                            {resume.name}
                          </span>
                          <VerifiedHumanBadge variant="emerald" size="sm" />

                          {resume.isPrimary && (
                            <span
                              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5
                                         text-[10px] font-semibold"
                              style={{ backgroundColor: `${accent}1F`, color: accent }}
                            >
                              <Star size={9} strokeWidth={2.5} />
                              Primary
                            </span>
                          )}

                          {resume.filePath && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border
                                          ${T.hairline} px-1.5 py-0.5 text-[10px] font-semibold ${T.muted}`}
                            >
                              <Cloud size={9} />
                              Cloud
                            </span>
                          )}
                        </div>

                        <p className={`mt-0.5 truncate text-[11px] ${T.muted}`}>
                          {resume.fileName} · {resume.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      {!resume.isPrimary && (
                        <button
                          type="button"
                          onClick={() => setPrimary(resume.id)}
                          className={`${rowAction} ${T.ink2} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                        >
                          <CheckCircle2 size={12} />
                          Set primary
                        </button>
                      )}

                      {resume.fileUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setViewUrl(resume.fileUrl);
                            setViewName(resume.name);
                          }}
                          className={`${rowAction} ${T.ink2} hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                        >
                          View
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteResume(resume.id)}
                        disabled={deletingId === resume.id}
                        className={`${rowAction} ${T.ink2} hover:bg-[#D03B3B]/10`}
                        onMouseEnter={(e) => (e.currentTarget.style.color = danger)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                      >
                        {deletingId === resume.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Panel>

      {/* ── Upload overlay ─────────────────────────────────────────────────── */}
      {uploadOpen && (
        <div className="fixed inset-0 z-[1900] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !uploading && setUploadOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            className={`relative w-full max-w-[420px] overflow-hidden rounded-2xl border ${T.hairline}
                        bg-white shadow-xl dark:bg-[#1A1A19]`}
          >
            <div className={`flex items-center justify-between border-b ${T.hairline} px-5 py-3.5`}>
              <h3 className={`text-[13.5px] font-bold ${T.ink}`}>Upload resume version</h3>
              <button
                type="button"
                onClick={() => !uploading && setUploadOpen(false)}
                aria-label="Close"
                className={`grid h-7 w-7 place-items-center rounded-lg ${T.ink2}
                            transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-3.5 px-5 py-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="resume-version-name"
                  className={`block text-[10.5px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}
                >
                  Version name
                </label>
                <input
                  id="resume-version-name"
                  placeholder="e.g. Data Science Resume"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full rounded-lg border ${T.hairline} bg-[#FAFAF8] px-3 py-2
                              text-[12.5px] ${T.ink} outline-none placeholder:text-[#9A9995]
                              focus:border-[#C9C8C2] dark:bg-white/[0.03] dark:focus:border-white/25`}
                />
              </div>

              <label
                htmlFor="resume-upload"
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border
                            border-dashed ${T.hairline} bg-[#FAFAF8] px-4 py-7 text-center
                            transition-colors hover:bg-[#F4F4F2] dark:bg-white/[0.03]
                            dark:hover:bg-white/[0.06]`}
              >
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ backgroundColor: `${accent}1A`, color: accent }}
                >
                  <Upload size={16} />
                </span>
                {newFile ? (
                  <span className={`max-w-full truncate text-[12.5px] font-semibold ${T.ink}`}>
                    {newFile.name}
                  </span>
                ) : (
                  <>
                    <span className={`text-[12.5px] font-semibold ${T.ink}`}>
                      Drop your resume here
                    </span>
                    <span className={`text-[11px] ${T.muted}`}>PDF, up to 10MB</span>
                  </>
                )}
              </label>

              <input
                id="resume-upload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setNewFile(e.target.files[0])}
              />
            </div>

            <div className={`flex justify-end gap-2 border-t ${T.hairline} px-5 py-3`}>
              <button
                type="button"
                onClick={() => !uploading && setUploadOpen(false)}
                className={`rounded-lg border ${T.hairline} px-3 py-1.5 text-[12px] font-medium
                            ${T.ink} transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#111110] px-3.5 py-1.5
                           text-[12px] font-semibold text-white transition-opacity
                           hover:opacity-90 disabled:opacity-50
                           dark:bg-white dark:text-[#111110]"
              >
                {uploading && <Loader2 size={13} className="animate-spin" />}
                {uploading ? "Uploading…" : "Upload resume"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ── Viewer overlay ─────────────────────────────────────────────────── */}
      {viewUrl && (
        <div className="fixed inset-0 z-[1900] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewUrl(null)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            className={`relative flex h-[82vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl
                        border ${T.hairline} bg-white shadow-xl dark:bg-[#1A1A19]`}
          >
            <div className={`flex items-center justify-between border-b ${T.hairline} px-5 py-3.5`}>
              <h3 className={`min-w-0 truncate text-[13.5px] font-bold ${T.ink}`}>{viewName}</h3>
              <button
                type="button"
                onClick={() => setViewUrl(null)}
                aria-label="Close"
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${T.ink2}
                            transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex-1 overflow-hidden bg-[#F4F4F2] dark:bg-[#0D0D0D]">
              <iframe src={viewUrl} className="h-full w-full border-0" title={viewName} />
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ResumeManager;
