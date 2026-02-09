import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bot, Link2, ClipboardList, Rocket, ArrowLeft, Crown } from "lucide-react";

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    company_name: string;
    position_title: string;
    job_url: string;
    status: string;
    submission_type: string;
    notes: string;
    salary_range: string;
    location: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    applied_at: string;
  }) => void;
  editData?: {
    id: string;
    company_name: string;
    position_title: string;
    job_url: string | null;
    status: string;
    submission_type: string;
    notes: string | null;
    salary_range?: string | null;
    location?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    applied_at?: string;
  } | null;
  isPlan2: boolean;
  remainingSlots: number;
  isSubscribed: boolean;
}

const statuses = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

type Mode = "choose" | "manual" | "deploy";

const AddJobModal = ({ open, onClose, onSubmit, editData, isPlan2, remainingSlots, isSubscribed }: AddJobModalProps) => {
  const [mode, setMode] = useState<Mode>(editData ? (editData.submission_type === "manual" ? "manual" : "deploy") : "choose");
  const [company, setCompany] = useState(editData?.company_name || "");
  const [position, setPosition] = useState(editData?.position_title || "");
  const [url, setUrl] = useState(editData?.job_url || "");
  const [status, setStatus] = useState(editData?.status || "applied");
  const [aiDiscovery, setAiDiscovery] = useState(editData?.submission_type === "ai_discovery");
  const [notes, setNotes] = useState(editData?.notes || "");
  const [salaryRange, setSalaryRange] = useState(editData?.salary_range || "");
  const [location, setLocation] = useState(editData?.location || "");
  const [contactName, setContactName] = useState(editData?.contact_name || "");
  const [contactEmail, setContactEmail] = useState(editData?.contact_email || "");
  const [contactPhone, setContactPhone] = useState(editData?.contact_phone || "");
  const [appliedAt, setAppliedAt] = useState(
    editData?.applied_at ? new Date(editData.applied_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submissionType = mode === "deploy" ? (aiDiscovery ? "ai_discovery" : "service") : "manual";
    onSubmit({
      company_name: company.trim(),
      position_title: position.trim(),
      job_url: url.trim(),
      status,
      submission_type: submissionType,
      notes: notes.trim(),
      salary_range: salaryRange.trim(),
      location: location.trim(),
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      applied_at: new Date(appliedAt).toISOString(),
    });
  };

  const handleClose = () => {
    setMode("choose");
    setShowUpgradeNudge(false);
    onClose();
  };

  // Chooser screen
  if (!editData && mode === "choose") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className="text-2xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Add Application
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose how you'd like to add this job
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            {/* Manual Entry */}
            <button
              onClick={() => setMode("manual")}
              className="group flex items-start gap-4 rounded-xl border border-border/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Manual Entry</p>
                <p className="text-xs text-muted-foreground">Track a job yourself — unlimited entries, no credits used</p>
                <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-green-700">
                  Unlimited
                </span>
              </div>
            </button>

            {/* Deploy Service */}
            <button
              onClick={() => {
                if (remainingSlots <= 0) return;
                setMode("deploy");
              }}
              disabled={remainingSlots <= 0}
              className="group flex items-start gap-4 rounded-xl border border-border/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--tracker-applied))] to-[hsl(var(--tracker-screening))]">
                <Rocket className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Deploy JobApp Service</p>
                <p className="text-xs text-muted-foreground">Our team handles the application for you</p>
                <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                  {remainingSlots} of {isPlan2 ? 50 : 10} credits remaining
                </span>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/50 sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {!editData && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMode("choose"); setShowUpgradeNudge(false); }}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                {editData ? "Edit Application" : mode === "manual" ? "Manual Entry" : "Deploy JobApp Service"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mode === "manual"
                  ? "For tracking only — unlimited entries"
                  : `Uses 1 service credit • ${remainingSlots} remaining`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Company + Position */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Position Title *</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} required maxLength={100} />
            </div>
          </div>

          {/* Status + Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Applied</Label>
              <Input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} />
            </div>
          </div>

          {/* Salary + Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Salary Range</Label>
              <Input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g. $80k - $100k" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, NYC" maxLength={200} />
            </div>
          </div>

          {/* Deploy mode: URL + AI toggle */}
          {mode === "deploy" && (
            <>
              <div className="space-y-2">
                <Label>Job Posting URL *</Label>
                <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://..." required maxLength={500} />
              </div>

              {/* Plan 2: AI Discovery toggle */}
              {isPlan2 ? (
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
                  <div className="flex items-center gap-2">
                    {aiDiscovery ? <Bot className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium">{aiDiscovery ? "Find a job for me (AI + Human)" : "I have a link"}</p>
                      <p className="text-xs text-muted-foreground">
                        {aiDiscovery ? "Our team finds & applies for you" : "Submit with your link"}
                      </p>
                    </div>
                  </div>
                  <Switch checked={aiDiscovery} onCheckedChange={setAiDiscovery} />
                </div>
              ) : (
                /* Plan 1: show upgrade nudge if they try AI */
                <>
                  {!showUpgradeNudge ? (
                    <button
                      type="button"
                      onClick={() => setShowUpgradeNudge(true)}
                      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      Want us to find jobs for you?
                    </button>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-600" />
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Pro Hunter Feature</p>
                      </div>
                      <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                        "Find a job for me" is available on the Pro Hunter plan ($49.99/mo). Upgrade to unlock AI + Human Discovery.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2 border-amber-300 text-amber-800 hover:bg-amber-100"
                        onClick={() => window.location.href = "/job-tracker"}
                      >
                        View Upgrade Options
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Manual mode: optional URL */}
          {mode === "manual" && (
            <div className="space-y-2">
              <Label>Job Posting URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://... (optional)" maxLength={500} />
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Contact Information</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact Name" maxLength={100} />
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Contact Email" type="email" maxLength={200} />
            </div>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact Phone" type="tel" maxLength={30} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="Any additional notes..." />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 hover:-translate-y-0.5 transition-all">
            {editData ? "Save Changes" : mode === "manual" ? "Track Application" : "Deploy Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;
