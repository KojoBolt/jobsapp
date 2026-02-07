import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, Zap, User, FileText, Sliders, Crosshair, Building2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { title: "Personal Info", icon: User },
  { title: "Resume & Links", icon: FileText },
  { title: "Role Preferences", icon: Building2 },
  { title: "Custom Targeting", icon: Crosshair },
  { title: "Preferences", icon: Sliders },
];

const industries = [
  "Engineering",
  "Finance",
  "Marketing",
  "Product",
  "Design",
  "Data Science",
  "Sales",
  "Operations",
];

const tones = [
  { value: "professional", label: "Professional", desc: "Formal and polished" },
  { value: "creative", label: "Creative", desc: "Bold and distinctive" },
  { value: "technical", label: "Technical", desc: "Data-driven and precise" },
];

const jobTitleOptions = [
  "Senior PM",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Tech Lead",
  "Staff Engineer",
  "Data Scientist",
  "Product Designer",
  "DevOps Engineer",
  "Engineering Manager",
];

const companySizeOptions = [
  "Pre-Seed / Seed",
  "Series A Startup",
  "Series B-C",
  "Late Stage / Pre-IPO",
  "Public / Fortune 500",
  "Government / Non-Profit",
];

const OnboardingForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    linkedinUrl: "",
    resumeFile: null as File | null,
    targetRoles: "",
    industry: "",
    tone: "professional",
    selectedJobTitles: [] as string[],
    selectedCompanySizes: [] as string[],
    priorityLinks: "",
    aiAfterPriority: true,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    toast({
      title: "Profile Complete! 🚀",
      description: "Your Identity Vault is set. We're preparing your applications now.",
    });
    navigate("/dashboard");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, resumeFile: e.target.files[0] });
    }
  };

  const toggleJobTitle = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedJobTitles: prev.selectedJobTitles.includes(title)
        ? prev.selectedJobTitles.filter((t) => t !== title)
        : [...prev.selectedJobTitles, title],
    }));
  };

  const toggleCompanySize = (size: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCompanySizes: prev.selectedCompanySizes.includes(size)
        ? prev.selectedCompanySizes.filter((s) => s !== size)
        : [...prev.selectedCompanySizes, size],
    }));
  };

  const priorityLinkCount = formData.priorityLinks
    .split("\n")
    .filter((line) => line.trim().startsWith("http")).length;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">JobApp</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground">Your Identity Vault</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us about yourself so we can represent you perfectly.
          </p>
          <Link to="/">
            <Button variant="ghost" size="sm" className="mt-3 gap-1 text-xs text-muted-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Homepage
            </Button>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-1">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-1">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-medium transition-colors ${
                  i <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px w-5 sm:w-8 transition-colors ${
                    i < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="glass-card rounded-xl p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                  <p className="text-sm text-muted-foreground">We'll use this to customize your applications.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Resume & Links */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Resume & Links</h3>
                  <p className="text-sm text-muted-foreground">Upload your materials so we can tailor each application.</p>
                </div>
                <div className="space-y-2">
                  <Label>Resume (PDF)</Label>
                  <label
                    htmlFor="resume"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/30 p-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/50"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    {formData.resumeFile ? (
                      <span className="text-sm font-medium text-primary">
                        {formData.resumeFile.name}
                      </span>
                    ) : (
                      <>
                        <span className="text-sm text-foreground">Drop your resume here</span>
                        <span className="text-xs text-muted-foreground">PDF, up to 10MB</span>
                      </>
                    )}
                  </label>
                  <input
                    id="resume"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/johndoe"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 3: Role Preferences */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Role Preferences</h3>
                  <p className="text-sm text-muted-foreground">Select your target job titles and preferred company sizes.</p>
                </div>

                {/* Job Titles */}
                <div className="space-y-3">
                  <Label>Target Job Titles</Label>
                  <div className="flex flex-wrap gap-2">
                    {jobTitleOptions.map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => toggleJobTitle(title)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          formData.selectedJobTitles.includes(title)
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company Size */}
                <div className="space-y-3">
                  <Label>Preferred Company Size</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {companySizeOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleCompanySize(size)}
                        className={`rounded-lg border p-2.5 text-left text-xs font-medium transition-all ${
                          formData.selectedCompanySizes.includes(size)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/50 bg-muted/30 text-muted-foreground hover:border-border hover:text-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Custom Targeting (Priority 30) */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">Custom Targeting</h3>
                    <Badge variant="gold" className="text-[10px]">Optional</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Paste up to 30 job links you want us to prioritize.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="priorityLinks">Priority Applications (Manual Links)</Label>
                    <span className={`text-xs font-mono ${priorityLinkCount > 30 ? "text-destructive" : "text-muted-foreground"}`}>
                      {priorityLinkCount}/30 links
                    </span>
                  </div>
                  <Textarea
                    id="priorityLinks"
                    placeholder={"https://careers.google.com/jobs/123\nhttps://stripe.com/jobs/456\nhttps://notion.so/careers/789\n\nPaste one link per line..."}
                    value={formData.priorityLinks}
                    onChange={(e) => setFormData({ ...formData, priorityLinks: e.target.value })}
                    className="min-h-[160px] bg-muted/50 font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    These are your "dream job" applications. Our team will handle them first with extra care.
                  </p>
                </div>

                {/* AI Toggle */}
                <div className="rounded-lg border border-border/30 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <Switch
                      checked={formData.aiAfterPriority}
                      onCheckedChange={(checked) => setFormData({ ...formData, aiAfterPriority: checked })}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        AI + Human Team for remaining roles
                      </p>
                      <p className="text-xs text-muted-foreground">
                        After these {priorityLinkCount || 30}, use AI + Human Team to find and apply to the remaining{" "}
                        <span className="font-semibold text-primary">{200 - Math.min(priorityLinkCount || 30, 30)} matched roles</span>.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Preferences */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Targeting Preferences</h3>
                  <p className="text-sm text-muted-foreground">Help us find the right roles for you.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRoles">Target Roles</Label>
                  <Input
                    id="targetRoles"
                    placeholder="e.g., Senior Engineer, Tech Lead"
                    value={formData.targetRoles}
                    onChange={(e) => setFormData({ ...formData, targetRoles: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(v) => setFormData({ ...formData, industry: v })}
                  >
                    <SelectTrigger className="bg-muted/50">
                      <SelectValue placeholder="Select your industry" />
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
                <div className="space-y-3">
                  <Label>Tone of Voice</Label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {tones.map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, tone: tone.value })}
                        className={`rounded-lg border p-3 text-left transition-all ${
                          formData.tone === tone.value
                            ? "border-primary bg-primary/10"
                            : "border-border/50 bg-muted/30 hover:border-border"
                        }`}
                      >
                        <p className={`text-sm font-medium ${formData.tone === tone.value ? "text-primary" : "text-foreground"}`}>
                          {tone.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{tone.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="mt-8 flex items-center justify-between">
            {currentStep > 0 ? (
              <Button variant="ghost" onClick={handleBack} className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {currentStep < steps.length - 1 ? (
              <Button variant="hero" onClick={handleNext} className="gap-1">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} className="gap-1">
                Launch Campaign
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;
