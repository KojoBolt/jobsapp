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
  Trash2,
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

  const [currentResume, setCurrentResume] = useState<{
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
} | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
 
  // Load saved data from BOTH profiles and resumes
useEffect(() => {
  if (!user) return;
  
  const load = async () => {
    console.log('🚀 Loading Identity Vault data for user:', user.id);
    
    // 1. Fetch data from profiles table (full_name, email)
    console.log('📋 Fetching profile data...');
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, identity_vault_data")
      .eq("id", user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching profile data:', profileError.message);
    } else {
      console.log('✅ Profile data fetched successfully:', { 
        full_name: profileData?.full_name, 
        email: profileData?.email
      });
    }

    // 2. Fetch latest resume from resumes table (user_id equals user.id, ordered by created_at desc)
    console.log('📄 Fetching latest resume...');
    const { data: resumeData, error: resumeError } = await supabase
      .from("resumes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (resumeError) {
      console.error('❌ Error fetching resume data:', resumeError.message);
    } else if (resumeData) {
      console.log('✅ Resume data fetched successfully:', { 
        job_title: resumeData.job_title,
        tone_preference: resumeData.tone_preference,
        created_at: resumeData.created_at,
        file_url: resumeData.file_url,
        file_name: resumeData.file_name
      });
      // Load the saved resume file info
      if (resumeData.file_url && resumeData.file_name) {
        console.log('📁 Setting currentResume:', {
          fileName: resumeData.file_name,
          uploadedAt: resumeData.created_at
        });
        setCurrentResume({
          fileName: resumeData.file_name,
          fileUrl: resumeData.file_url,
          uploadedAt: resumeData.created_at,
        });
        setCurrentResumeId(resumeData.id);
      }
    } else {
      console.log('ℹ️ No resume found for user');
    }

    // 3. If identity_vault_data exists, populate personalInfo and targeting from it
    if (profileData?.identity_vault_data) {
      console.log('💾 Load strategy: Using identity_vault_data from profiles table');
      const vault = profileData.identity_vault_data as Record<string, unknown>;
      
      if (vault.personalInfo) {
        console.log('📝 Setting personalInfo from vault:', vault.personalInfo);
        setPersonalInfo(vault.personalInfo as typeof personalInfo);
      }
      
      if (vault.targeting) {
        console.log('🎯 Setting targeting from vault:', vault.targeting);
        setTargeting(vault.targeting as typeof targeting);
      }
    } 
    // 4. If identity_vault_data doesn't exist, populate personalInfo from profiles table and targeting from resumes table
    else {
      console.log('💾 Load strategy: Using profiles table (personalInfo) and resumes table (targetRoles, toneOfVoice)');
      
      // Populate personalInfo from profiles table
      const loadedPersonalInfo = {
        name: profileData?.full_name || "",
        email: profileData?.email || user.email || "",
        phone: "",
        linkedinUrl: "",
      };
      console.log('📝 Setting personalInfo from profile:', loadedPersonalInfo);
      setPersonalInfo(loadedPersonalInfo);

      // Populate targeting.targetRoles and targeting.toneOfVoice from resumes table
      if (resumeData) {
        const updatedTargeting = {
          industries: [] as string[],
          roleTypes: [] as string[],
          salaryMin: "",
          salaryMax: "",
          targetRoles: resumeData.job_title ? [resumeData.job_title] : [],
          toneOfVoice: resumeData.tone_preference || "",
          targetJobTitles: [] as string[],
          companySizes: [] as string[],
          mustHaves: "",
        };
        console.log(' Setting targeting from resume:', { 
          targetRoles: updatedTargeting.targetRoles,
          toneOfVoice: updatedTargeting.toneOfVoice 
        });
        setTargeting(updatedTargeting);
      } else {
        console.log('No resume data available, targeting preferences remain empty');
      }
    }
    
    console.log('Identity Vault load complete');
  };
  
  load();
}, [user]);

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
      console.error("❌ No user found");
      return;
    }
    
    setSaving(true);
    
    try {
      // Save the vault data (personalInfo and targeting)
      const vaultData = { personalInfo, targeting };
      
      console.log('💾 Saving Identity Vault data for user:', user.id);
      console.log('📦 Vault data to save:', vaultData);
      
      // Try to update with a timeout
      const updatePromise = supabase
        .from("profiles")
        .update({ identity_vault_data: vaultData })
        .eq("id", user.id);
      
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Update timeout")), 10000)
      );
      
      const { error: vaultError, data: updateData } = await Promise.race([
        updatePromise,
        timeoutPromise
      ]) as any;
      
      if (vaultError) {
        console.error('❌ Error saving vault data:', vaultError);
        console.error('Error details:', JSON.stringify(vaultError));
        toast.error(`Failed to save: ${vaultError.message}`);
        setSaving(false);
        return;
      }
      
      console.log('✅ Vault data saved successfully', updateData);
      toast.success("Vault data saved successfully");

      // Handle resume file upload if a new file was selected
      if (resumeFile) {
        console.log('📤 Uploading resume file:', resumeFile.name);
        
        try {
          // Upload file to Supabase Storage
          const fileExt = resumeFile.name.split('.').pop();
          const fileName = `${user.id}/${Date.now()}.${fileExt}`;
          const filePath = `resumes/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("resumes")
            .upload(filePath, resumeFile, { upsert: true });

          if (uploadError) {
            console.error('❌ Error uploading resume:', uploadError);
            toast.error("Failed to upload resume file");
            setSaving(false);
            return;
          }

          console.log('✅ Resume file uploaded successfully');

          // Get the public URL for the uploaded file
          const { data: { publicUrl } } = supabase.storage
            .from("resumes")
            .getPublicUrl(filePath);

          // Update or insert resume record in resumes table
          console.log('📝 Saving resume metadata to database...');
          
          if (currentResume && currentResumeId) {
            // Update existing resume
            const { error: updateError } = await supabase
              .from("resumes")
              .update({
                file_name: resumeFile.name,
                file_url: publicUrl,
                file_path: filePath,
                updated_at: new Date().toISOString(),
              })
              .eq("id", currentResumeId);

            if (updateError) {
              console.error('❌ Error updating resume metadata:', updateError);
              toast.error("Failed to update resume metadata");
              setSaving(false);
              return;
            }
            console.log('✅ Resume metadata updated successfully');
          } else {
            // Insert new resume
            const { error: insertError } = await supabase
              .from("resumes")
              .insert([{
                user_id: user.id,
                file_name: resumeFile.name,
                file_url: publicUrl,
                file_path: filePath,
                created_at: new Date().toISOString(),
              }]);

            if (insertError) {
              console.error('❌ Error inserting resume metadata:', insertError);
              toast.error("Failed to save resume metadata");
              setSaving(false);
              return;
            }
            console.log('✅ Resume metadata inserted successfully');
          }

          // Update currentResume state
          setCurrentResume({
            fileName: resumeFile.name,
            fileUrl: publicUrl,
            uploadedAt: new Date().toISOString(),
          });

          // Clear the resumeFile state
          setResumeFile(null);
          toast.success("Resume uploaded successfully");
        } catch (uploadError) {
          console.error('❌ Unexpected error during resume upload:', uploadError);
          toast.error("An error occurred while uploading the resume");
          setSaving(false);
          return;
        }
      }

      setSaving(false);
      toast.success("Identity Vault saved successfully");
    } catch (error) {
      console.error('❌ Unexpected error during save:', error);
      toast.error("An unexpected error occurred");
      setSaving(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !currentResumeId || !currentResume) return;
    setSaving(true);
    try {
      console.log('🗑️ Deleting resume file from storage:', currentResume.fileName);
      
      // Delete from database first
      const { error: deleteError } = await supabase
        .from("resumes")
        .delete()
        .eq("id", currentResumeId);
      
      if (deleteError) {
        console.error('❌ Error deleting resume from database:', deleteError);
        toast.error("Failed to delete resume");
        setSaving(false);
        return;
      }
      
      console.log('✅ Resume deleted from database successfully');
      
      // Clear the state
      setCurrentResume(null);
      setCurrentResumeId(null);
      setSaving(false);
      toast.success("Resume deleted successfully");
    } catch (error) {
      console.error('❌ Error deleting resume file:', error);
      toast.error("Failed to delete resume file");
      setSaving(false);
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
              {/* Display current saved resume */}
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

              {/* Upload new resume */}
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
