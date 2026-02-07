import { useState } from "react";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ResumeVersion {
  id: string;
  name: string;
  fileName: string;
  isPrimary: boolean;
  uploadedAt: string;
}

const initialResumes: ResumeVersion[] = [
  { id: "r1", name: "Tech Resume", fileName: "resume_swe_2026.pdf", isPrimary: true, uploadedAt: "Feb 1, 2026" },
  { id: "r2", name: "PM Resume", fileName: "resume_pm_2026.pdf", isPrimary: false, uploadedAt: "Jan 28, 2026" },
  { id: "r3", name: "Creative Resume", fileName: "resume_creative.pdf", isPrimary: false, uploadedAt: "Jan 20, 2026" },
];

const ResumeManager = () => {
  const [resumes, setResumes] = useState<ResumeVersion[]>(initialResumes);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const { toast } = useToast();

  const setPrimary = (id: string) => {
    setResumes(resumes.map((r) => ({ ...r, isPrimary: r.id === id })));
    toast({ title: "Primary Resume Updated", description: "Future applications will use this resume." });
  };

  const deleteResume = (id: string) => {
    const target = resumes.find((r) => r.id === id);
    if (target?.isPrimary) {
      toast({ title: "Cannot Delete", description: "Set another resume as primary first.", variant: "destructive" });
      return;
    }
    setResumes(resumes.filter((r) => r.id !== id));
    toast({ title: "Resume Removed", description: `"${target?.name}" has been deleted.` });
  };

  const handleUpload = () => {
    if (!newName.trim() || !newFile) {
      toast({ title: "Missing Info", description: "Please provide a name and file.", variant: "destructive" });
      return;
    }
    if (resumes.length >= 5) {
      toast({ title: "Limit Reached", description: "You can store up to 5 resume versions.", variant: "destructive" });
      return;
    }
    const newResume: ResumeVersion = {
      id: `r${Date.now()}`,
      name: newName.trim(),
      fileName: newFile.name,
      isPrimary: resumes.length === 0,
      uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setResumes([...resumes, newResume]);
    setNewName("");
    setNewFile(null);
    setUploadOpen(false);
    toast({ title: "Resume Uploaded ✓", description: `"${newResume.name}" added to your vault.` });
  };

  return (
    <div className="glass-card rounded-xl">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Resume Manager</h3>
          <p className="text-xs text-muted-foreground">{resumes.length}/5 versions stored</p>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary" disabled={resumes.length >= 5}>
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
                <label className="text-xs font-medium text-muted-foreground">Version Name</label>
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
              <Button variant="hero" className="w-full" onClick={handleUpload}>
                Upload Resume
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="divide-y divide-border/20">
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
                    <span className="text-sm font-medium text-foreground">{resume.name}</span>
                    {resume.isPrimary && (
                      <Badge variant="interview" className="text-[10px]">
                        <Star className="mr-0.5 h-2.5 w-2.5" /> Primary
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
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => deleteResume(resume.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResumeManager;
