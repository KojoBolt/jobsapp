import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  AlertCircle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const industries = [
  "Engineering", "Finance", "Marketing", "Product", "Design",
  "Data Science", "Sales", "Operations", "Healthcare", "Legal",
];

const roleTypes = ["Remote", "Hybrid", "On-site"];

const IdentityVault = () => {
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    linkedinUrl: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [targeting, setTargeting] = useState({
    industry: "",
    roleType: "",
    salaryMin: "",
    salaryMax: "",
  });

  // Calculate vault strength
  const getVaultStrength = () => {
    let score = 0;
    const total = 6;
    if (personalInfo.name.trim()) score++;
    if (personalInfo.email.trim()) score++;
    if (personalInfo.phone.trim()) score++;
    if (personalInfo.linkedinUrl.trim()) score++;
    if (resumeFile) score++;
    if (targeting.industry) score++;
    return Math.round((score / total) * 100);
  };

  const vaultStrength = getVaultStrength();

  const getStrengthLabel = () => {
    if (vaultStrength >= 80) return "Deployment Ready";
    if (vaultStrength >= 50) return "Getting There";
    return "Needs Attention";
  };

  const getStrengthColor = () => {
    if (vaultStrength >= 80) return "text-emerald-400";
    if (vaultStrength >= 50) return "text-amber-400";
    return "text-destructive";
  };

  const getStrengthBarClass = () => {
    if (vaultStrength >= 80) return "[&>div]:bg-emerald-500";
    if (vaultStrength >= 50) return "[&>div]:bg-amber-500";
    return "[&>div]:bg-destructive";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
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

        {/* Vault Strength Meter */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.05 }}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`h-5 w-5 ${getStrengthColor()}`} />
                  <span className="text-sm font-semibold text-foreground">Vault Strength</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold tabular-nums ${getStrengthColor()}`}>
                    {vaultStrength}%
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] border-current ${getStrengthColor()}`}
                  >
                    {getStrengthLabel()}
                  </Badge>
                </div>
              </div>
              <Progress value={vaultStrength} className={`h-2.5 ${getStrengthBarClass()}`} />
              {vaultStrength < 80 && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="h-3 w-3" />
                  Complete your LinkedIn and resume to reach "Deployment Ready" status.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Personal Info */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vault-name" className="flex items-center gap-1.5 text-xs">
                    <User className="h-3 w-3" /> Full Name
                  </Label>
                  <Input
                    id="vault-name"
                    placeholder="Jane Doe"
                    value={personalInfo.name}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, name: e.target.value })}
                    className="bg-muted/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vault-email" className="flex items-center gap-1.5 text-xs">
                    <Mail className="h-3 w-3" /> Email Address
                  </Label>
                  <Input
                    id="vault-email"
                    type="email"
                    placeholder="jane@example.com"
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                    className="bg-muted/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vault-phone" className="flex items-center gap-1.5 text-xs">
                    <Phone className="h-3 w-3" /> Phone Number
                  </Label>
                  <Input
                    id="vault-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={personalInfo.phone}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                    className="bg-muted/40"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vault-linkedin" className="flex items-center gap-1.5 text-xs">
                    <Linkedin className="h-3 w-3" /> LinkedIn URL
                  </Label>
                  <Input
                    id="vault-linkedin"
                    placeholder="https://linkedin.com/in/janedoe"
                    value={personalInfo.linkedinUrl}
                    onChange={(e) => setPersonalInfo({ ...personalInfo, linkedinUrl: e.target.value })}
                    className="bg-muted/40"
                  />
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
                <FileText className="h-5 w-5 text-primary" />
                The Resume Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label
                htmlFor="vault-resume"
                className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border/40 bg-muted/20 p-10 text-center transition-all hover:border-primary/40 hover:bg-muted/30"
              >
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
              <input
                id="vault-resume"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Targeting Preferences */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="border-border/30 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                <Briefcase className="h-5 w-5 text-primary" />
                Targeting Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs">Industry</Label>
                  <Select
                    value={targeting.industry}
                    onValueChange={(v) => setTargeting({ ...targeting, industry: v })}
                  >
                    <SelectTrigger className="bg-muted/40">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind.toLowerCase()}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs">
                    <MapPin className="h-3 w-3" /> Role Type
                  </Label>
                  <Select
                    value={targeting.roleType}
                    onValueChange={(v) => setTargeting({ ...targeting, roleType: v })}
                  >
                    <SelectTrigger className="bg-muted/40">
                      <SelectValue placeholder="Remote / Hybrid / On-site" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleTypes.map((rt) => (
                        <SelectItem key={rt} value={rt.toLowerCase()}>
                          {rt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs">
                  <DollarSign className="h-3 w-3" /> Salary Expectations
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="Min (e.g. 80,000)"
                    value={targeting.salaryMin}
                    onChange={(e) => setTargeting({ ...targeting, salaryMin: e.target.value })}
                    className="bg-muted/40"
                  />
                  <Input
                    placeholder="Max (e.g. 150,000)"
                    value={targeting.salaryMax}
                    onChange={(e) => setTargeting({ ...targeting, salaryMax: e.target.value })}
                    className="bg-muted/40"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.25 }} className="flex justify-end">
          <Button size="lg" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Save Vault
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default IdentityVault;
