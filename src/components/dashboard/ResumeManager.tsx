import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  Upload,
  Star,
  Trash2,
  Plus,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import VerifiedHumanBadge from "@/components/dashboard/VerifiedHumanBadge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  
  useEffect(() => {
    fetchResumes();
  }, []);

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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="glass-card rounded-xl">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Resume Manager</h3>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading..." : `${resumes.length}/${MAX_RESUMES} versions stored`}
          </p>
        </div>

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs text-primary"
              disabled={resumes.length >= MAX_RESUMES || loading}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Resume
            </Button>
          </DialogTrigger>

          <DialogContent className="border-border/50 bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Upload Resume Version</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Version Name
                </label>
                <Input
                  placeholder="e.g., Data Science Resume"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-muted/50"
                />
              </div>

              <label
                htmlFor="resume-upload"
                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/30 p-6 text-center transition-colors hover:border-primary/40"
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                {newFile ? (
                  <span className="text-sm font-medium text-primary">{newFile.name}</span>
                ) : (
                  <>
                    <span className="text-sm text-foreground">Drop your resume here</span>
                    <span className="text-xs text-muted-foreground">PDF, up to 10MB</span>
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

              <Button
                variant="hero"
                className="w-full gap-2"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Resume"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resume list */}
      <div className="divide-y divide-border/20">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <FileText className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No resumes yet</p>
            <p className="text-xs text-muted-foreground">
              Upload your first resume to get started
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {resumes.map((resume) => (
              <motion.div
                key={resume.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {resume.name}
                      </span>
                      <VerifiedHumanBadge variant="emerald" size="sm" />
                      {resume.isPrimary && (
                        <Badge variant="interview" className="text-[10px]">
                          <Star className="mr-0.5 h-2.5 w-2.5" /> Primary
                        </Badge>
                      )}
                      {resume.filePath && (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">
                          Cloud
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {resume.fileName} · {resume.uploadedAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!resume.isPrimary && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPrimary(resume.id)}
                      className="gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Set Primary
                    </Button>
                  )}
                  {resume.fileUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setViewUrl(resume.fileUrl);
                        setViewName(resume.name);
                      }}
                    >
                      View
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => deleteResume(resume.id)}
                    disabled={deletingId === resume.id}
                  >
                    {deletingId === resume.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      <Dialog open={!!viewUrl} onOpenChange={(open) => !open && setViewUrl(null)}>
        <DialogContent className="border-border/50 bg-card sm:max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-foreground">{viewName}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-lg">
            {viewUrl && (
              <iframe
                src={viewUrl}
                className="w-full h-full rounded-lg border border-border/30"
                title={viewName}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResumeManager;