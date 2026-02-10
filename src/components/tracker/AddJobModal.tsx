import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Link2, ClipboardList, Rocket, ArrowLeft, Crown,
  ShieldCheck, AlertTriangle, User, Briefcase, MapPin, FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  const navigate = useNavigate();
  const { profile } = useAuth();
  const vaultData = profile?.identity_vault_data;

  const [mode, setMode] = useState<Mode>(editData ? (editData.submission_type === "manual" ? "manual" : "deploy") : "choose");
  const [useVault, setUseVault] = useState(true);
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
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [appliedAt, setAppliedAt] = useState(
    editData?.applied_at ? new Date(editData.applied_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);

  // Vault readiness checks
  const hasVaultName = !!(vaultData?.personalInfo?.name?.trim());
  const hasVaultEmail = !!(vaultData?.personalInfo?.email?.trim());
  const hasVaultLinkedIn = !!(vaultData?.personalInfo?.linkedinUrl?.trim());
  const hasVaultTargeting = !!(vaultData?.targeting?.industries && vaultData.targeting.industries.length > 0);
  const isVaultUsable = hasVaultName && hasVaultEmail && hasVaultLinkedIn;

  // Build vault summary
  const vaultName = vaultData?.personalInfo?.name || "Unknown";
  const vaultRoles = vaultData?.targeting?.targetRoles?.join(", ") || "";
  const vaultIndustries = vaultData?.targeting?.industries?.join(", ") || "";
  const vaultRoleTypes = vaultData?.targeting?.roleTypes?.join(", ") || "";
  const vaultTone = vaultData?.targeting?.toneOfVoice || "";
  const vaultSalaryMin = vaultData?.targeting?.salaryMin || "";
  const vaultSalaryMax = vaultData?.targeting?.salaryMax || "";
  const vaultTitles = vaultData?.targeting?.targetJobTitles?.join(", ") || "";
  const vaultCompanySizes = vaultData?.targeting?.companySizes?.join(", ") || "";
  const vaultMustHaves = vaultData?.targeting?.mustHaves || "";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Credit validation for service deployments
    if (mode === "deploy" && remainingSlots <= 0) {
      toast.error("Monthly credits exhausted. Manual tracking is still unlimited.");
      return;
    }

    // Vault validation when toggle is ON
    if (mode === "deploy" && useVault && !isVaultUsable) {
      toast.error("Your Identity Vault is incomplete. Please upload a resume and fill in your details first, or toggle off to fill manually.");
      return;
    }

    const submissionType = mode === "deploy" ? (aiDiscovery ? "ai_discovery" : "service") : "manual";
    const finalNotes = specialInstructions.trim()
      ? `${notes.trim()}\n\n--- Special Instructions ---\n${specialInstructions.trim()}`
      : notes.trim();

    onSubmit({
      company_name: company.trim(),
      position_title: position.trim(),
      job_url: url.trim(),
      status,
      submission_type: submissionType,
      notes: finalNotes,
      salary_range: useVault && mode === "deploy" && vaultSalaryMin
        ? `${vaultSalaryMin} - ${vaultSalaryMax}`
        : salaryRange.trim(),
      location: location.trim(),
      contact_name: useVault && mode === "deploy" ? (vaultData?.personalInfo?.name || contactName.trim()) : contactName.trim(),
      contact_email: useVault && mode === "deploy" ? (vaultData?.personalInfo?.email || contactEmail.trim()) : contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      applied_at: new Date(appliedAt).toISOString(),
    });
  };

  const handleClose = () => {
    setMode("choose");
    setShowUpgradeNudge(false);
    setUseVault(true);
    setSpecialInstructions("");
    onClose();
  };

  // Chooser screen
  if (!editData && mode === "choose") {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="border-border/50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Add Application
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose how you'd like to add this application
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
                <p className="text-xs text-muted-foreground">Add your job application here manually — unlimited entries, no credits used</p>
                <span className="mt-1 inline-block rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-500">
                  Unlimited
                </span>
              </div>
            </button>

            {/* Deploy Service */}
            <button
              onClick={() => {
                if (remainingSlots <= 0) return;
                if (!isVaultUsable) {
                  toast.error("Please complete your DNA profile to enable professional deployment.");
                  onClose();
                  navigate("/identity-vault");
                  return;
                }
                setMode("deploy");
              }}
              disabled={remainingSlots <= 0}
              className="group flex items-start gap-4 rounded-xl border border-border/50 p-4 text-left transition-all hover:border-primary/30 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Rocket className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Deploy Professional Submission (1 Credit)</p>
                <p className="text-xs text-muted-foreground">Our AI + Human team drafts and submits the application for you</p>
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
                {editData ? "Edit Application" : mode === "manual" ? "Manual Entry" : "Deploy Professional Submission (1 Credit)"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {mode === "manual"
                  ? "Add your job application here manually — unlimited entries, no credits used"
                  : `Uses 1 service credit • ${remainingSlots} remaining`}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ===== PROFILE SYNC TOGGLE (Deploy mode only) ===== */}
          {mode === "deploy" && !editData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Use Identity Vault details</p>
                    <p className="text-[11px] text-muted-foreground">Auto-fill from your professional DNA</p>
                  </div>
                </div>
                <Switch checked={useVault} onCheckedChange={setUseVault} />
              </div>

              {/* Vault Summary (when ON and usable) */}
              {useVault && isVaultUsable && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-sm font-medium text-foreground">
                      Applying as <span className="text-emerald-500">{vaultName}</span>
                    </span>
                  </div>
                  {vaultRoles && (
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Roles: {vaultRoles}</span>
                    </div>
                  )}
                  {vaultRoleTypes && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{vaultRoleTypes}</span>
                    </div>
                  )}
                  {vaultTone && (
                    <Badge variant="outline" className="text-[10px] mt-1 border-emerald-500/30 text-emerald-500">
                      Tone: {vaultTone}
                    </Badge>
                  )}
                </div>
              )}

              {/* Vault Warning (when ON but incomplete) */}
              {useVault && !isVaultUsable && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Vault Incomplete</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your Identity Vault is missing key data. Please{" "}
                      <button type="button" className="underline text-primary" onClick={() => { onClose(); navigate("/identity-vault"); }}>
                        complete your profile
                      </button>{" "}
                      or toggle off to fill fields manually.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Salary + Location (hidden when vault is ON in deploy mode) */}
          {!(mode === "deploy" && useVault && isVaultUsable) && (
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
          )}

          {/* Deploy mode extras */}
          {mode === "deploy" && (
            <>
              {/* Job link (not required for AI discovery) */}
              {!aiDiscovery && (
                <div className="space-y-2">
                  <Label>Paste Job Link *</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://..." required maxLength={500} />
                </div>
              )}

              {/* Plan 2: AI Discovery toggle */}
              {isPlan2 ? (
                <div className="space-y-3">
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

                  {/* AI Discovery emphasis — show vault targeting summary */}
                  {aiDiscovery && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                      <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <Bot className="h-3.5 w-3.5" /> Discovery Targeting Profile
                      </p>
                      {vaultIndustries && (
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Industries:</span> {vaultIndustries}</p>
                      )}
                      {vaultTitles && (
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Target Titles:</span> {vaultTitles}</p>
                      )}
                      {vaultRoleTypes && (
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Work Style:</span> {vaultRoleTypes}</p>
                      )}
                      {vaultCompanySizes && (
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Company Size:</span> {vaultCompanySizes}</p>
                      )}
                      {(vaultSalaryMin || vaultSalaryMax) && (
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Salary:</span> {vaultSalaryMin} – {vaultSalaryMax}</p>
                      )}
                      {vaultMustHaves && (
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Must-haves:</span> {vaultMustHaves}</p>
                      )}
                      {!vaultIndustries && !vaultTitles && (
                        <p className="text-xs text-amber-500">
                          <AlertTriangle className="inline h-3 w-3 mr-1" />
                          Complete your Identity Vault targeting for better AI discovery results.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Plan 1: show upgrade nudge */
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
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <p className="text-sm font-medium text-foreground">Pro Hunter Feature</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        "Find a job for me" is available on the Pro Hunter plan ($49.99/mo). Upgrade to unlock AI + Human Discovery.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => window.location.href = "/job-tracker"}
                      >
                        View Upgrade Options
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Targeting Preferences (when vault is OFF) */}
              {!useVault && (
                <div className="space-y-3 rounded-lg border border-border/30 p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Targeting Preferences</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Preferred Role Type</Label>
                      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote, Hybrid, On-site" maxLength={200} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Salary Minimum</Label>
                      <Input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g. $80,000" maxLength={100} />
                    </div>
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="space-y-2">
                <Label className="text-xs">Special Instructions for the Team</Label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Anything specific you want us to mention to this recruiter?"
                  className="bg-muted/40"
                />
              </div>
            </>
          )}

          {/* Manual mode: optional URL */}
          {mode === "manual" && (
            <div className="space-y-2">
              <Label>Job Posting URL</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://... (optional)" maxLength={500} />
            </div>
          )}

          {/* Contact Info (hidden when vault is ON in deploy mode) */}
          {!(mode === "deploy" && useVault && isVaultUsable) && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Contact Information</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact Name" maxLength={100} />
                <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Contact Email" type="email" maxLength={200} />
              </div>
              <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact Phone" type="tel" maxLength={30} />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="Any additional notes..." />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 hover:-translate-y-0.5 transition-all">
            {editData ? "Save Changes" : mode === "manual" ? "Add Application" : aiDiscovery ? "Launch AI Discovery Mission" : "Deploy Professional Submission"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;