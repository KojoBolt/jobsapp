import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft, ShieldCheck, AlertTriangle, User, Briefcase, MapPin,
  Rocket, Bot, Link2, Crown, Mail, Globe, Target, DollarSign,
} from "lucide-react";

const DeployMission = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const vaultData = profile?.identity_vault_data;

  const effectiveTier = profile?.subscription_tier;
  const isPlan2 = effectiveTier === "plan_2";
  const monthlyLimit = isPlan2 ? 50 : 10;
  const monthlyUsed = profile?.monthly_usage_count || 0;
  const remainingSlots = Math.max(monthlyLimit - monthlyUsed, 0);

  // Vault data
  const vaultName = vaultData?.personalInfo?.name || "";
  const vaultEmail = vaultData?.personalInfo?.email || "";
  const vaultLinkedIn = vaultData?.personalInfo?.linkedinUrl || "";
  const vaultRoles = vaultData?.targeting?.targetRoles?.join(", ") || "";
  const vaultIndustries = vaultData?.targeting?.industries?.join(", ") || "";
  const vaultRoleTypes = vaultData?.targeting?.roleTypes?.join(", ") || "";
  const vaultTone = vaultData?.targeting?.toneOfVoice || "";
  const vaultSalaryMin = vaultData?.targeting?.salaryMin || "";
  const vaultSalaryMax = vaultData?.targeting?.salaryMax || "";
  const vaultTitles = vaultData?.targeting?.targetJobTitles?.join(", ") || "";
  const vaultCompanySizes = vaultData?.targeting?.companySizes?.join(", ") || "";
  const vaultMustHaves = vaultData?.targeting?.mustHaves || "";

  const hasVaultName = !!vaultName.trim();
  const hasVaultEmail = !!vaultEmail.trim();
  const hasVaultLinkedIn = !!vaultLinkedIn.trim();
  const isVaultUsable = hasVaultName && hasVaultEmail && hasVaultLinkedIn;

  // Form state
  const [useVault, setUseVault] = useState(true);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [url, setUrl] = useState("");
  const [aiDiscovery, setAiDiscovery] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);

  // Manual fields (when vault is OFF)
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualLinkedIn, setManualLinkedIn] = useState("");
  const [manualSalary, setManualSalary] = useState("");
  const [manualRoleType, setManualRoleType] = useState("");
  const [manualIndustry, setManualIndustry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please sign in first."); return; }
    if (remainingSlots <= 0) { toast.error("Monthly credits exhausted."); return; }
    if (useVault && !isVaultUsable) {
      toast.error("Your Identity Vault is incomplete. Please complete your profile or toggle off to fill manually.");
      return;
    }
    if (!useVault && (!manualName.trim() || !manualEmail.trim())) {
      toast.error("Name and Email are required when not using the Vault.");
      return;
    }

    setSubmitting(true);
    const submissionType = aiDiscovery ? "ai_discovery" : "service";
    const finalNotes = specialInstructions.trim()
      ? `${notes.trim()}\n\n--- Special Instructions ---\n${specialInstructions.trim()}`
      : notes.trim();

    const { error } = await supabase
      .from("job_applications")
      .insert({
        user_id: user.id,
        company_name: company.trim() || (aiDiscovery ? "AI Discovery" : "TBD"),
        position_title: position.trim() || (aiDiscovery ? "AI-Matched Role" : "TBD"),
        job_url: url.trim() || null,
        status: "screening",
        submission_type: submissionType,
        notes: finalNotes || null,
        salary_range: useVault && vaultSalaryMin ? `${vaultSalaryMin} - ${vaultSalaryMax}` : manualSalary.trim() || null,
        contact_name: useVault ? vaultName : manualName.trim(),
        contact_email: useVault ? vaultEmail : manualEmail.trim(),
      } as any);

    if (error) {
      toast.error("Failed to deploy. Please try again.");
      setSubmitting(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ monthly_usage_count: monthlyUsed + 1 } as any)
      .eq("user_id", user.id);
    refreshProfile();
    toast.success("Application deployed successfully!");
    navigate("/job-tracker");
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen rounded-2xl p-6" style={{ background: "var(--tracker-gradient)" }}>
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/job-tracker")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Deploy Professional Submission
              </h1>
              <p className="text-sm text-white/60">
                Uses 1 service credit • {remainingSlots} of {monthlyLimit} remaining
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ===== IDENTITY VAULT TOGGLE ===== */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Use Identity Vault details</p>
                    <p className="text-xs text-white/50">Auto-fill from your professional DNA profile</p>
                  </div>
                </div>
                <Switch checked={useVault} onCheckedChange={setUseVault} />
              </div>

              {/* Vault Summary (ON + usable) */}
              {useVault && isVaultUsable && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">
                      Applying as <span className="text-emerald-400">{vaultName}</span>
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {vaultEmail && (
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Mail className="h-3 w-3" /> {vaultEmail}
                      </div>
                    )}
                    {vaultLinkedIn && (
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Globe className="h-3 w-3" /> LinkedIn connected
                      </div>
                    )}
                    {vaultRoles && (
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Briefcase className="h-3 w-3" /> {vaultRoles}
                      </div>
                    )}
                    {vaultRoleTypes && (
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <MapPin className="h-3 w-3" /> {vaultRoleTypes}
                      </div>
                    )}
                    {vaultIndustries && (
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Target className="h-3 w-3" /> {vaultIndustries}
                      </div>
                    )}
                    {(vaultSalaryMin || vaultSalaryMax) && (
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <DollarSign className="h-3 w-3" /> {vaultSalaryMin} – {vaultSalaryMax}
                      </div>
                    )}
                  </div>
                  {vaultTone && (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      Tone: {vaultTone}
                    </Badge>
                  )}
                </div>
              )}

              {/* Vault Warning (ON but incomplete) */}
              {useVault && !isVaultUsable && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Vault Incomplete</p>
                    <p className="text-xs text-white/60 mt-1">
                      Your Identity Vault is missing key data (Name, Email, or LinkedIn).{" "}
                      <button type="button" className="underline text-primary" onClick={() => navigate("/identity-vault")}>
                        Complete your profile
                      </button>{" "}
                      or toggle off to fill fields manually.
                    </p>
                  </div>
                </div>
              )}

              {/* Manual Fields (vault OFF) */}
              {!useVault && (
                <div className="space-y-4 pt-2">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Your Details</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/70">Full Name *</Label>
                      <Input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="Grace Rise" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/70">Email *</Label>
                      <Input value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} type="email" placeholder="grace@email.com" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/70">LinkedIn URL</Label>
                      <Input value={manualLinkedIn} onChange={(e) => setManualLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/70">Salary Minimum</Label>
                      <Input value={manualSalary} onChange={(e) => setManualSalary(e.target.value)} placeholder="e.g. $80,000" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/70">Preferred Role Type</Label>
                      <Input value={manualRoleType} onChange={(e) => setManualRoleType(e.target.value)} placeholder="Remote, Hybrid, On-site" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-white/70">Industry Focus</Label>
                      <Input value={manualIndustry} onChange={(e) => setManualIndustry(e.target.value)} placeholder="e.g. FinTech, SaaS" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== APPLICATION DETAILS ===== */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Application Details</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">Company Name {!aiDiscovery && "*"}</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} required={!aiDiscovery} placeholder="e.g. Stripe" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">Position Title {!aiDiscovery && "*"}</Label>
                  <Input value={position} onChange={(e) => setPosition(e.target.value)} required={!aiDiscovery} placeholder="e.g. Senior Engineer" className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
              </div>

              {/* Job Link (hidden for AI Discovery) */}
              {!aiDiscovery && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/70">Job Posting Link *</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" required placeholder="https://..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30" />
                </div>
              )}

              {/* Plan 2: AI Discovery toggle */}
              {isPlan2 ? (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3.5">
                  <div className="flex items-center gap-2.5">
                    {aiDiscovery ? <Bot className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4 text-white/40" />}
                    <div>
                      <p className="text-sm font-medium text-white">{aiDiscovery ? "Find a job for me (AI + Human)" : "I have a specific job link"}</p>
                      <p className="text-xs text-white/50">{aiDiscovery ? "Our team finds & applies for you" : "Submit with your own link"}</p>
                    </div>
                  </div>
                  <Switch checked={aiDiscovery} onCheckedChange={setAiDiscovery} />
                </div>
              ) : (
                <>
                  {!showUpgradeNudge ? (
                    <button type="button" onClick={() => setShowUpgradeNudge(true)} className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors">
                      <Bot className="h-3.5 w-3.5" /> Want us to find jobs for you?
                    </button>
                  ) : (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        <p className="text-sm font-medium text-white">Pro Hunter Feature</p>
                      </div>
                      <p className="mt-1 text-xs text-white/60">
                        "Find a job for me" is available on the Pro Hunter plan ($49.99/mo).
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* AI Discovery targeting summary */}
              {aiDiscovery && isPlan2 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5" /> Discovery Targeting Profile
                  </p>
                  {vaultIndustries && <p className="text-xs text-white/60"><span className="font-medium text-white">Industries:</span> {vaultIndustries}</p>}
                  {vaultTitles && <p className="text-xs text-white/60"><span className="font-medium text-white">Target Titles:</span> {vaultTitles}</p>}
                  {vaultRoleTypes && <p className="text-xs text-white/60"><span className="font-medium text-white">Work Style:</span> {vaultRoleTypes}</p>}
                  {vaultCompanySizes && <p className="text-xs text-white/60"><span className="font-medium text-white">Company Size:</span> {vaultCompanySizes}</p>}
                  {(vaultSalaryMin || vaultSalaryMax) && <p className="text-xs text-white/60"><span className="font-medium text-white">Salary:</span> {vaultSalaryMin} – {vaultSalaryMax}</p>}
                  {vaultMustHaves && <p className="text-xs text-white/60"><span className="font-medium text-white">Must-haves:</span> {vaultMustHaves}</p>}
                  {!vaultIndustries && !vaultTitles && (
                    <p className="text-xs text-amber-400">
                      <AlertTriangle className="inline h-3 w-3 mr-1" />
                      Complete your Identity Vault targeting for better AI discovery results.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ===== SPECIAL INSTRUCTIONS ===== */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Mission Instructions</p>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Special Instructions for the Team</Label>
                <Textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Anything specific you want us to mention to this recruiter?"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-white/70">Additional Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Any other context..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>
            </div>

            {/* ===== SUBMIT ===== */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  <span className="text-sm text-white/70">
                    {remainingSlots} of {monthlyLimit} credits remaining
                  </span>
                </div>
                {remainingSlots <= 3 && remainingSlots > 0 && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                    Running low
                  </Badge>
                )}
              </div>
              <Button
                type="submit"
                disabled={submitting || remainingSlots <= 0}
                className="w-full h-12 text-base bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 hover:-translate-y-0.5 transition-all font-semibold"
              >
                {submitting ? "Deploying..." : aiDiscovery ? "Launch AI Discovery Mission" : "Deploy Professional Submission"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DeployMission;
