import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Linkedin,
  Upload,
  FileText,
  Briefcase,
  MapPin,
  DollarSign,
  ShieldCheck,
  Target,
  Building2,
  MessageSquare,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import VaultStrengthMeter from "@/components/identity-vault/VaultStrengthMeter";
import MultiSelectChips from "@/components/identity-vault/MultiSelectChips";
import ChipInput from "@/components/identity-vault/ChipInput";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const industries = [
  "Engineering", "Finance", "Marketing", "Product", "Design",
  "Data Science", "Sales", "Operations", "Healthcare", "Legal",
];
const roleTypes = ["Remote", "Hybrid", "On-site"];
const targetRoleOptions = [
  "Full-stack", "Backend", "Frontend", "WordPress Developer", "DevOps", "Project Manager",
  "Product Manager", "Data Analyst", "UX Designer", "UI Designer",
  "QA Engineer", "Mobile Developer", "Cloud Architect", "AI/ML Engineer", "Security Specialist",
  "Content Writer", "Digital Marketer", "Sales Executive", "Customer Success Manager",
  "HR Specialist", "Finance Analyst", "Legal Counsel", "Video Editor", "Other",
];
const companySizeOptions = [
  "Startup (1-10)", "Early Stage (11-50)", "Mid-Market (51-500)", "Enterprise (500+)",
];
const toneOptions = [
  { value: "bold", label: "Bold & Assertive", description: "Bold and distinctive" },
  { value: "professional", label: "Professional & Corporate", description: "Formal and polished" },
  { value: "creative", label: "Creative & Personality-driven", description: "Bold and distinctive" },
  { value: "concise", label: "Concise & Technical", description: "Data-driven and precise" },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-resume`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: formData,
      }
    );

    const data = await response.json();
    console.log("Edge Function response:", data);

    if (!response.ok) {
      console.error("Edge function error:", data.error);
      throw new Error(data.error || "Extraction failed");
    }

    if (!data.extractedText) {
      throw new Error("No text returned");
    }

    return data.extractedText;
  } catch (error) {
    console.error("PDF extraction failed:", error);
    return "";
  }
};

const IdentityVault = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [saving, setSaving] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    name: "", email: "", phone: "", linkedinUrl: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targeting, setTargeting] = useState({
    industries: [] as string[],
    roleTypes: [] as string[],
    salaryMin: "",
    salaryMax: "",
    targetRoles: [] as string[],
    toneOfVoice: "",
    targetJobTitles: [] as string[],
    companySizes: [] as string[],
    mustHaves: "",
  });

  // ✅ State for the "Other" custom role input
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [customRoles, setCustomRoles] = useState<string[]>([]);

  const [currentResume, setCurrentResume] = useState<{
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  } | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);

  // ✅ Detect if "Other" is selected in targetRoles
  const otherSelected = targeting.targetRoles.includes("Other");

  // ✅ Add custom role to the list and clear input
  const handleAddCustomRole = () => {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    if (customRoles.includes(trimmed)) {
      toast.error("You've already added this role.");
      return;
    }
    setCustomRoles((prev) => [...prev, trimmed]);
    setCustomRoleInput("");
  };

  // ✅ Remove a custom role chip
  const handleRemoveCustomRole = (role: string) => {
    setCustomRoles((prev) => prev.filter((r) => r !== role));
  };

  // ✅ Allow pressing Enter to add a custom role
  const handleCustomRoleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomRole();
    }
  };

  const loadVaultData = useCallback(async () => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, email, identity_vault_data")
        .eq("id", user.id)
        .single();

      if (profileError) console.error("Error fetching profile:", profileError.message);

      const { data: resumeData, error: resumeError } = await supabase
        .from("resumes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (resumeError) console.error("Error fetching resume:", resumeError.message);

      if (resumeData?.file_url && resumeData?.file_name) {
        setCurrentResume({
          fileName: resumeData.file_name,
          fileUrl: resumeData.file_url,
          uploadedAt: resumeData.created_at || new Date().toISOString(),
        });
        setCurrentResumeId(resumeData.id);
      } else {
        setCurrentResume(null);
        setCurrentResumeId(null);
      }

      if (profileData?.identity_vault_data) {
        const vault = profileData.identity_vault_data as Record<string, unknown>;
        if (vault.personalInfo) setPersonalInfo(vault.personalInfo as typeof personalInfo);
        if (vault.targeting) setTargeting(vault.targeting as typeof targeting);

        // ✅ Restore saved custom roles from vault
        if (vault.customRoles) setCustomRoles(vault.customRoles as string[]);
      } else {
        setPersonalInfo({
          name: profileData?.full_name || "",
          email: profileData?.email || user.email || "",
          phone: "",
          linkedinUrl: "",
        });

        setTargeting({
          industries: [],
          roleTypes: [],
          salaryMin: "",
          salaryMax: "",
          targetRoles: resumeData?.job_title ? [resumeData.job_title] : [],
          toneOfVoice: resumeData?.tone_preference || "",
          targetJobTitles: [],
          companySizes: [],
          mustHaves: "",
        });
      }
    } catch (error) {
      console.error("Unexpected error loading vault:", error);
    }
  }, [user]);

  useEffect(() => {
    loadVaultData();
  }, [user, loadVaultData]);

  useEffect(() => {
    loadVaultData();
  }, [location.pathname, loadVaultData]);

  const getVaultStrength = useCallback(() => {
    let score = 0;
    const total = 8;
    if (personalInfo.name.trim()) score++;
    if (personalInfo.email.trim()) score++;
    if (personalInfo.linkedinUrl.trim()) score++;
    if (resumeFile || currentResume) score++;
    if (targeting.industries.length > 0) score++;
    if (targeting.targetRoles.length > 0) score++;
    if (targeting.toneOfVoice) score++;
    if (targeting.targetJobTitles.length > 0) score++;
    return Math.round((score / total) * 100);
  }, [personalInfo, resumeFile, currentResume, targeting]);

  const handleSave = async () => {
    if (!user) {
      toast.error("User not authenticated");
      return;
    }
    setSaving(true);

    try {
      // Include customRoles in the vault data so they persist across sessions
      const vaultData = { personalInfo, targeting, customRoles };
      const { error: vaultError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, identity_vault_data: vaultData }, { onConflict: "id" })
        .eq("id", user.id);

      if (vaultError) {
        console.error("Vault save error:", vaultError);
        toast.error(`Failed to save: ${vaultError.message}`);
        setSaving(false);
        return;
      }

      if (resumeFile) {
        toast.info("Extracting resume text...");

        const extractedText = await extractTextFromPDF(resumeFile);
        console.log("Extracted text length:", extractedText.length);
        console.log("Extracted text preview:", extractedText.slice(0, 200));

        if (!extractedText) {
          toast.warning("Could not extract text from PDF. Please ensure it's a text-based PDF.");
        }

        const fileExt = resumeFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const filePath = `resumes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, resumeFile, { upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Failed to upload resume file");
          setSaving(false);
          return;
        }

        const { data } = supabase.storage
          .from("resumes")
          .getPublicUrl(filePath);

        const publicUrl = data?.publicUrl;

        if (!publicUrl) {
          toast.error("Failed to get resume URL");
          setSaving(false);
          return;
        }

        if (currentResume && currentResumeId) {
          const { error: updateError } = await supabase
            .from("resumes")
            .update({
              file_name: resumeFile.name,
              file_url: publicUrl,
              file_path: filePath,
              extracted_text: extractedText,
              updated_at: new Date().toISOString(),
            })
            .eq("id", currentResumeId);

          if (updateError) {
            toast.error("Failed to update resume");
            setSaving(false);
            return;
          }
        } else {
          const { error: insertError } = await supabase
            .from("resumes")
            .insert([{
              user_id: user.id,
              file_name: resumeFile.name,
              file_url: publicUrl,
              file_path: filePath,
              extracted_text: extractedText,
              created_at: new Date().toISOString(),
            }]);

          if (insertError) {
            toast.error("Failed to save resume");
            setSaving(false);
            return;
          }
        }

        setCurrentResume({
          fileName: resumeFile.name,
          fileUrl: publicUrl,
          uploadedAt: new Date().toISOString(),
        });
        setResumeFile(null);
        toast.success("Resume uploaded and text extracted successfully");
      }

      setSaving(false);
      toast.success("Identity Vault saved successfully");
      await loadVaultData();
    } catch (error) {
      console.error("Unexpected error during save:", error);
      setSaving(false);
      toast.error("An unexpected error occurred while saving");
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !currentResumeId || !currentResume) return;
    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from("resumes")
        .delete()
        .eq("id", currentResumeId);

      if (deleteError) {
        toast.error("Failed to delete resume");
        setSaving(false);
        return;
      }

      setCurrentResume(null);
      setCurrentResumeId(null);
      setSaving(false);
      toast.success("Resume deleted successfully");
    } catch (error) {
      toast.error("Failed to delete resume");
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold text-foreground font-poppins" style={{ fontFamily: "'Playfair Display', font-poppins" }}>
            Identity Vault: <span className="gradient-text font-poppins">Your Professional DNA</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground font-poppins">
            Centralize your professional profile. The stronger your vault, the better your applications.
          </p>
        </motion.div>

        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
          <VaultStrengthMeter strength={getVaultStrength()} />
        </motion.div>

        {/* Personal Info */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                <User className="h-5 w-5 text-primary font-poppins" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vault-name" className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3 font-poppins" /> Full Name
                  </Label>
                  <Input id="vault-name" placeholder="Jane Doe" value={personalInfo.name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })} className="bg-muted/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vault-email" className="flex items-center gap-1.5 text-xs">
                    <Mail className="h-3 w-3" /> Email Address
                  </Label>
                  <Input id="vault-email" type="email" placeholder="jane@example.com" value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })} className="bg-muted/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vault-phone" className="flex items-center gap-1.5 text-xs">
                    <Phone className="h-3 w-3" /> Phone Number
                  </Label>
                  <Input id="vault-phone" type="tel" placeholder="+1 (555) 000-0000" value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} className="bg-muted/40" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vault-linkedin" className="flex items-center gap-1.5 text-xs">
                    <Linkedin className="h-3 w-3" /> LinkedIn URL
                  </Label>
                  <Input id="vault-linkedin" placeholder="https://linkedin.com/in/jane-doe" value={personalInfo.linkedinUrl}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, linkedinUrl: e.target.value })} className="bg-muted/40" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Resume Hub */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                <FileText className="h-5 w-5 text-primary" /> The Resume Hub
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentResume && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                        <FileText className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-emerald-400">{currentResume.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded on {new Date(currentResume.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDeleteResume}
                      disabled={saving}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <label htmlFor="vault-resume"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/40 bg-muted/20 p-10 text-center transition-all hover:border-primary/40 hover:bg-muted/30">
                {resumeFile ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
                      <FileText className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-blue-400">{resumeFile.name}</span>
                    <span className="text-xs text-muted-foreground">Click to replace</span>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Upload className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Upload your resume</span>
                    <span className="text-xs text-muted-foreground">PDF format, up to 10MB</span>
                  </>
                )}
              </label>
              <input id="vault-resume" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Targeting Preferences */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                <Briefcase className="h-5 w-5 text-primary" /> Targeting Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs">Industry (select multiple)</Label>
                <MultiSelectChips options={industries} selected={targeting.industries}
                  onChange={(v) => setTargeting({ ...targeting, industries: v })} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3" /> Role Type (select multiple)
                </Label>
                <MultiSelectChips options={roleTypes} selected={targeting.roleTypes}
                  onChange={(v) => setTargeting({ ...targeting, roleTypes: v })} />
              </div>

              {/* ✅ Target Roles with "Other" custom input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Target className="h-3 w-3" /> Target Roles (select multiple)
                </Label>
                <MultiSelectChips
                  options={targetRoleOptions}
                  selected={targeting.targetRoles}
                  onChange={(v) => setTargeting({ ...targeting, targetRoles: v })}
                />

                {/* ✅ Show custom role input only when "Other" is selected */}
                {otherSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-3 space-y-3"
                  >
                    <Label className="text-xs text-muted-foreground">
                      Add your own role(s)
                    </Label>

                    {/* Input row */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Blockchain Developer, Growth Hacker..."
                        value={customRoleInput}
                        onChange={(e) => setCustomRoleInput(e.target.value)}
                        onKeyDown={handleCustomRoleKeyDown}
                        className="bg-muted/40 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddCustomRole}
                        disabled={!customRoleInput.trim()}
                        className="shrink-0 gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>

                    {/* Custom role chips */}
                    {customRoles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {customRoles.map((role) => (
                          <span
                            key={role}
                            className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          >
                            {role}
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomRole(role)}
                              className="ml-0.5 rounded-full hover:text-destructive transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <DollarSign className="h-3 w-3" /> Salary Expectations
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Min (e.g. 80,000)" value={targeting.salaryMin}
                    onChange={(e) => setTargeting({ ...targeting, salaryMin: e.target.value })} className="bg-muted/40" />
                  <Input placeholder="Max (e.g. 150,000)" value={targeting.salaryMax}
                    onChange={(e) => setTargeting({ ...targeting, salaryMax: e.target.value })} className="bg-muted/40" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <MessageSquare className="h-3 w-3" /> Tone of Voice
                </Label>
                <Select value={targeting.toneOfVoice}
                  onValueChange={(v) => setTargeting({ ...targeting, toneOfVoice: v })}>
                  <SelectTrigger className="bg-muted/40">
                    <SelectValue placeholder="Select preferred tone" />
                  </SelectTrigger>
                  <SelectContent>
                    {toneOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        <span>{t.label}</span>
                        <span className="ml-2 text-xs text-muted-foreground">— {t.description}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Role Specifics */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                <Building2 className="h-5 w-5 text-primary" /> Role Specifics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-xs">Target Job Titles</Label>
                <ChipInput values={targeting.targetJobTitles}
                  onChange={(v) => setTargeting({ ...targeting, targetJobTitles: v })}
                  placeholder="Type a title and press Enter (e.g. Senior Product Designer)" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Building2 className="h-3 w-3" /> Preferred Company Size
                </Label>
                <MultiSelectChips options={companySizeOptions} selected={targeting.companySizes}
                  onChange={(v) => setTargeting({ ...targeting, companySizes: v })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Role Preferences / Must-haves</Label>
                <Textarea placeholder="e.g. Must have health insurance, 4-day work week..."
                  value={targeting.mustHaves}
                  onChange={(e) => setTargeting({ ...targeting, mustHaves: e.target.value })}
                  className="bg-muted/40 min-h-[100px]" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.3 }} className="flex justify-end">
          <Button size="lg" className="gap-2" onClick={handleSave} disabled={saving}>
            <ShieldCheck className="h-4 w-4" />
            {saving ? "Saving..." : "Save Vault"}
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default IdentityVault;