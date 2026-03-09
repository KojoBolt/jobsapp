import { useState, useEffect } from "react";
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
import { ArrowRight, ArrowLeft, Upload, CheckCircle2, Zap, User, FileText, Sliders, Crosshair, Building2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromPDF } from "@/lib/pdfExtractor";
import { uploadToCloudinary } from "@/lib/cloudinaryUpload";

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
  const [uploading, setUploading] = useState(false);
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
  const { user, profile, loading } = useAuth();

  // Fetch user data from Supabase profile on component mount
  useEffect(() => {
  if (user && profile && !loading) {
    setFormData((prev) => ({
      ...prev,
      fullName: profile.full_name || "",
      email: user.email || "",
    }));
  }
}, [profile, user, loading]);

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

  const handleSubmit = async () => {
    try {
      setUploading(true);
      console.log("1) submit started");

      // 1. Get current user from context
      if (!user) {
        console.error("No user found in context");
        throw new Error("You must be logged in to complete onboarding");
      }

      console.log("2) user ok", { user_id: user.id, email: user.email });

      // 2a. Verify Supabase session is active
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("2b) Supabase session check:", { 
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        matches: session?.user?.id === user.id,
        error: sessionError?.message 
      });

      // 2. Upload resume to Supabase Storage (if file exists)
      let fileUrl = "";
      let extractedText = "";

//   if (formData.resumeFile) {
//   console.log("3) uploading file...");
  
//   // Validate file
//   if (!formData.resumeFile.type.includes('pdf')) {
//     throw new Error('Only PDF files are allowed');
//   }

//   if (formData.resumeFile.size > 10 * 1024 * 1024) {
//     throw new Error('File size must be less than 10MB');
//   }

//   // Create unique filename
//   const timestamp = Date.now();
//   const sanitizedName = formData.resumeFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
//   const filePath = `${user.id}/${timestamp}-${sanitizedName}`;

//   console.log("About to upload file:", filePath);

//   // Upload to storage with timeout
//   const uploadWithTimeout = async () => {
//     const uploadPromise = supabase.storage
//       .from("resumes")
//       .upload(filePath, formData.resumeFile!, { 
//         upsert: true,
//         cacheControl: '3600'
//       });

//     const timeoutPromise = new Promise<never>((_, reject) =>
//       setTimeout(() => reject(new Error("Upload timed out after 30s")), 30000)
//     );

//     return await Promise.race([uploadPromise, timeoutPromise]);
//   };

//   console.log("Starting upload...");
//   const { data: uploadData, error: uploadError } = await uploadWithTimeout();
  
//   console.log("4) upload done", { uploadData, uploadError });

//   if (uploadError) {
//     console.error("Upload error:", uploadError);
//     throw new Error(`Upload failed: ${uploadError.message}`);
//   }

//   console.log("5) Upload successful, getting file URL...");

//   // Get file URL
//   const { data: { publicUrl } } = supabase
//     .storage
//     .from('resumes')
//     .getPublicUrl(filePath);

//   fileUrl = publicUrl;
//   console.log("File URL:", fileUrl);

//   // Extract text from PDF
//   console.log("6) Extracting PDF text...");
//   try {
//     extractedText = await extractTextFromPDF(formData.resumeFile);
//     console.log("7) Extraction done. length:", extractedText?.length);
//   } catch (pdfError) {
//     console.error("PDF extraction error:", pdfError);
//     extractedText = "PDF text extraction failed - file uploaded successfully";
//   }

//   // Save resume to database
//   console.log("8) Inserting resume row...");
//   const { error: resumeError } = await supabase
//     .from('resumes')
//     .insert({
//       user_id: user.id,
//       file_name: formData.resumeFile.name,
//       file_url: fileUrl,
//       extracted_text: extractedText,
//       job_title: formData.targetRoles || '',
//       location: '',
//       salary_expectation: '',
//       tone_preference: formData.tone,
//     });

//   console.log("9) Resume insert done", resumeError);

//   if (resumeError) {
//     console.error("Resume insert error:", resumeError);
//     throw new Error(`Failed to save resume: ${resumeError.message}`);
//   }
// }

      if (formData.resumeFile) {
  console.log("3) uploading file to Cloudinary...");
  
  // Validate file
  if (!formData.resumeFile.type.includes('pdf')) {
    throw new Error('Only PDF files are allowed');
  }

  if (formData.resumeFile.size > 10 * 1024 * 1024) {
    throw new Error('File size must be less than 10MB');
  }

  console.log("Starting Cloudinary upload...");
  
  // Upload to Cloudinary
  const { url: cloudinaryUrl, publicId } = await uploadToCloudinary(
    formData.resumeFile,
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  );
  
  fileUrl = cloudinaryUrl;
  console.log("4) Upload successful, URL:", fileUrl);

  // Extract text from PDF
  console.log("5) Extracting PDF text...");
  try {
    extractedText = await extractTextFromPDF(formData.resumeFile);
    console.log("6) Extraction done. length:", extractedText?.length);
  } catch (pdfError) {
    console.error("PDF extraction error:", pdfError);
    extractedText = "PDF text extraction failed - file uploaded successfully";
  }

  // Save resume to database (with Cloudinary URL)
  console.log("7) Inserting resume row...");
  const resumePayload = {
    user_id: user.id,
    file_name: formData.resumeFile.name,
    file_url: fileUrl,
    cloudinary_public_id: publicId,
    extracted_text: extractedText,
    extracted_text_length: extractedText?.length,
    job_title: formData.targetRoles || '',
    location: '',
    salary_expectation: '',
    tone_preference: formData.tone,
  };
  console.log("Resume insert payload:", resumePayload);

  try {
    // 7a. Test if RLS is working by doing a simple SELECT first
    console.log("7a) Testing RLS with SELECT query...");
    const { data: testData, error: testError } = await supabase
      .from('resumes')
      .select('id')
      .limit(1);
    console.log("7b) RLS SELECT test result:", { 
      success: !testError, 
      dataCount: testData?.length,
      error: testError?.message 
    });

    // 7c. Now attempt the insert
    console.log("8a) Starting resume insert...");
    const { data: insertData, error: resumeError } = await supabase
      .from('resumes')
      .insert({
        user_id: resumePayload.user_id,
        file_name: resumePayload.file_name,
        file_url: resumePayload.file_url,
        cloudinary_public_id: resumePayload.cloudinary_public_id,
        extracted_text: resumePayload.extracted_text,
        job_title: resumePayload.job_title,
        location: resumePayload.location,
        salary_expectation: resumePayload.salary_expectation,
        tone_preference: resumePayload.tone_preference,
      })
      .select();

    console.log("8b) Resume insert result:", { 
      success: !resumeError, 
      dataId: insertData ? insertData[0]?.id : undefined,
      error: resumeError 
    });

    if (resumeError) {
      console.error("8c) Resume insert error details:", {
        message: resumeError.message,
        code: resumeError.code,
        details: resumeError.details,
        hint: resumeError.hint,
        status: (resumeError as any).status,
      });
      throw new Error(
        `Failed to save resume to database: ${resumeError.message || JSON.stringify(resumeError)}`
      );
    }

    console.log("8d) Resume insert succeeded with ID:", insertData?.[0]?.id);
  } catch (resumeError: any) {
    console.error("8g) Resume insert exception caught:", {
      message: resumeError.message,
      code: resumeError.code,
      stack: resumeError.stack?.split('\n').slice(0, 3).join('\n'),
    });
    throw resumeError;
  }
}

      // 4. Update profile with onboarding data (only full_name, email already comes from profile)
      console.log("9) updating profile...");
      console.log("Profile update payload:", {
        user_id: user.id,
        full_name: formData.fullName,
      });

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
          })
          .eq('id', user.id)
          .select();

        console.log("10) Profile update response:", { dataLength: profileData?.length, error: profileError?.message });

        if (profileError) {
          console.error("Profile update error details:", {
            message: profileError.message,
            code: profileError.code,
            details: profileError.details,
            hint: profileError.hint,
          });
          throw new Error(
            `Failed to update profile: ${profileError.message || JSON.stringify(profileError)}`
          );
        }

        if (!profileData || profileData.length === 0) {
          console.warn("Profile update returned no data");
        } else {
          console.log("Profile successfully updated");
        }
      } catch (profileError: any) {
        console.error("Profile update exception:", {
          message: profileError.message,
          code: profileError.code,
        });
        throw profileError;
      }

      // Success!
      toast({
        title: "Profile Complete! 🚀",
        description: "Your Identity Vault is set. We're preparing your applications now.",
      });

      navigate("/dashboard");
      
    } catch (error: any) {
      console.error('Onboarding error:', {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        hint: error.hint,
        stack: error.stack,
        fullError: JSON.stringify(error),
      });
      
      // Provide more specific error messages
      let errorMessage = error.message || "Failed to complete onboarding. Please try again.";
      
      if (error.code === 'TIMEOUT') {
        errorMessage = "Resume insert timed out - possible RLS policy issue. Ensure your account has permission to upload resumes. Please refresh and try again.";
      } else if (error.code === 'PGRST116') {
        errorMessage = "The resumes table doesn't exist or you don't have permission to access it. Please contact support.";
      } else if (error.code === '42P01') {
        errorMessage = "Database table doesn't exist. Please contact support.";
      } else if (error.message?.includes('RLS') || error.message?.includes('Permission denied')) {
        errorMessage = "Permission denied: RLS policy prevents this operation. Ensure you're logged in and have the latest database schema.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      console.log("11) finally: setUploading(false)");
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.includes('pdf')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Opps File too large",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setFormData({ ...formData, resumeFile: file });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

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
                    disabled
                    className="bg-muted/50 cursor-not-allowed opacity-70"
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
                    disabled
                    className="bg-muted/50 cursor-not-allowed opacity-70"
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
              <Button variant="ghost" onClick={handleBack} className="gap-1" disabled={uploading}>
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
              <Button variant="hero" onClick={handleSubmit} className="gap-1" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Launch Campaign
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingForm;