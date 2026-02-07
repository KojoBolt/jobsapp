import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, Zap, User, FileText, Sliders } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { title: "Personal Info", icon: User },
  { title: "Resume & Links", icon: FileText },
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
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((step, i) => (
            <div key={step.title} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                  i <= currentStep
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-px w-8 sm:w-12 transition-colors ${
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

            {/* Step 3: Preferences */}
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
