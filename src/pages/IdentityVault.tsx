import { useState, useEffect, useCallback } from "react";
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
  "Full-stack", "Backend", "Frontend", "DevOps", "Project Manager",
  "Product Manager", "Data Analyst", "UX Designer", "UI Designer",
  "QA Engineer", "Mobile Developer", "Cloud Architect",
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

const IdentityVault = () => {
  const { user } = useAuth();
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

  // Load saved data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("identity_vault_data")
        .eq("user_id", user.id)
        .single();
      if (data?.identity_vault_data) {
        const vault = data.identity_vault_data as Record<string, unknown>;
        if (vault.personalInfo) setPersonalInfo(vault.personalInfo as typeof personalInfo);
        if (vault.targeting) setTargeting(vault.targeting as typeof targeting);
      }
    };
    load();
  }, [user]);

  const getVaultStrength = useCallback(() => {
    let score = 0;
    const total = 8;
    if (personalInfo.name.trim()) score++;
    if (personalInfo.email.trim()) score++;
    if (personalInfo.linkedinUrl.trim()) score++;
    if (resumeFile) score++;
    if (targeting.industries.length > 0) score++;
    if (targeting.targetRoles.length > 0) score++;
    if (targeting.toneOfVoice) score++;
    if (targeting.targetJobTitles.length > 0) score++;
    return Math.round((score / total) * 100);
  }, [personalInfo, resumeFile, targeting]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const vaultData = JSON.parse(JSON.stringify({ personalInfo, targeting }));
    const { error } = await supabase
      .from("profiles")
      .update({ identity_vault_data: vaultData })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to save vault data");
    } else {
      toast.success("Identity Vault saved successfully");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setResumeFile(e.target.files[0]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <motion.div {...fadeUp} transition={{ duration: 0.4 }}>
          <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
            Identity Vault: <span className="gradient-text">Your Professional DNA</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Centralize your professional profile. The stronger your vault, the better your applications.
          </p>
        </motion.div>

        {/* Vault Strength */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
          <VaultStrengthMeter strength={getVaultStrength()} />
        </motion.div>

        {/* Personal Info */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                <User className="h-5 w-5 text-primary" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vault-name" className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3" /> Full Name
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
                  <Input id="vault-linkedin" placeholder="https://linkedin.com/in/janedoe" value={personalInfo.linkedinUrl}
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
            <CardContent>
              <label htmlFor="vault-resume"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/40 bg-muted/20 p-10 text-center transition-all hover:border-primary/40 hover:bg-muted/30">
                {resumeFile ? (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15">
                      <FileText className="h-6 w-6 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-emerald-400">{resumeFile.name}</span>
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
              {/* Industry - Multi-select */}
              <div className="space-y-2">
                <Label className="text-xs">Industry (select multiple)</Label>
                <MultiSelectChips options={industries} selected={targeting.industries}
                  onChange={(v) => setTargeting({ ...targeting, industries: v })} />
              </div>

              {/* Role Type - Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <MapPin className="h-3 w-3" /> Role Type (select multiple)
                </Label>
                <MultiSelectChips options={roleTypes} selected={targeting.roleTypes}
                  onChange={(v) => setTargeting({ ...targeting, roleTypes: v })} />
              </div>

              {/* Target Roles - Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Target className="h-3 w-3" /> Target Roles (select multiple)
                </Label>
                <MultiSelectChips options={targetRoleOptions} selected={targeting.targetRoles}
                  onChange={(v) => setTargeting({ ...targeting, targetRoles: v })} />
              </div>

              {/* Salary */}
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

              {/* Tone of Voice */}
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
              {/* Target Job Titles - free text chips */}
              <div className="space-y-2">
                <Label className="text-xs">Target Job Titles</Label>
                <ChipInput values={targeting.targetJobTitles}
                  onChange={(v) => setTargeting({ ...targeting, targetJobTitles: v })}
                  placeholder="Type a title and press Enter (e.g. Senior Product Designer)" />
              </div>

              {/* Company Size - Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <Building2 className="h-3 w-3" /> Preferred Company Size
                </Label>
                <MultiSelectChips options={companySizeOptions} selected={targeting.companySizes}
                  onChange={(v) => setTargeting({ ...targeting, companySizes: v })} />
              </div>

              {/* Must-haves */}
              <div className="space-y-2">
                <Label className="text-xs">Role Preferences / Must-haves</Label>
                <Textarea placeholder="e.g. Must have health insurance, 4-day work week, no gambling or tobacco industries..."
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
