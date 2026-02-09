import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import UpgradePaywall from "@/components/tracker/UpgradePaywall";
import TrackerStats from "@/components/tracker/TrackerStats";
import JobCardFeed from "@/components/tracker/JobCardFeed";
import AddJobModal from "@/components/tracker/AddJobModal";
import CrossSellBanner from "@/components/dashboard/CrossSellBanner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface JobApplication {
  id: string;
  user_id: string;
  company_name: string;
  position_title: string;
  job_url: string | null;
  status: string;
  submission_type: string;
  notes: string | null;
  applied_at: string;
  created_at: string;
  updated_at: string;
  salary_range?: string | null;
  location?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

const getLocalSubscription = () => {
  try {
    const raw = localStorage.getItem("job_trackr_subscribed");
    if (!raw) return null;
    return JSON.parse(raw) as { tier: string; timestamp: number };
  } catch {
    return null;
  }
};

const JobTracker = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editData, setEditData] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);

  const localSub = getLocalSubscription();
  const localTier = localSub?.tier || null;
  const effectiveTier = profile?.subscription_tier || localTier;
  const isSubscribed = effectiveTier === "plan_1" || effectiveTier === "plan_2";
  const isPlan2 = effectiveTier === "plan_2";
  const isGuest = !user;

  const monthlyLimit = isPlan2 ? 50 : 10;
  const monthlyUsed = profile?.monthly_usage_count || 0;
  const remainingSlots = Math.max(monthlyLimit - monthlyUsed, 0);

  // Handle subscription callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      const plan = params.get("plan") || "plan_1";
      localStorage.setItem("job_trackr_subscribed", JSON.stringify({ tier: plan, timestamp: Date.now() }));
      if (user) refreshProfile();
      toast({ title: "Welcome to Job Trackr!", description: "Your subscription is now active." });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Usage reset check
  useEffect(() => {
    if (!profile?.usage_reset_at || !user) return;
    const resetDate = new Date(profile.usage_reset_at);
    const now = new Date();
    const daysSinceReset = (now.getTime() - resetDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceReset >= 30) {
      supabase
        .from("profiles")
        .update({ monthly_usage_count: 0, usage_reset_at: now.toISOString() } as any)
        .eq("user_id", user.id)
        .then(() => refreshProfile());
    }
  }, [profile, user]);

  // Fetch applications
  useEffect(() => {
    if (!user || !isSubscribed) { setLoading(false); return; }
    const fetchApps = async () => {
      const { data } = await supabase
        .from("job_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setApplications((data as JobApplication[]) || []);
      setLoading(false);
    };
    fetchApps();
  }, [user, isSubscribed]);

  const handleAdd = async (data: any) => {
    if (!user) {
      toast({ title: "Sign up required", description: "Create an account to save applications.", variant: "destructive" });
      return;
    }
    const isServiceSubmission = data.submission_type !== "manual";

    if (!editData && isServiceSubmission && remainingSlots <= 0) {
      toast({ title: "Monthly credits exhausted", description: "Manual tracking is still unlimited.", variant: "destructive" });
      return;
    }

    if (editData) {
      const { error } = await supabase
        .from("job_applications")
        .update(data as any)
        .eq("id", editData.id);
      if (!error) {
        setApplications((prev) => prev.map((a) => (a.id === editData.id ? { ...a, ...data } : a)));
        toast({ title: "Application updated" });
      }
    } else {
      const { data: newApp, error } = await supabase
        .from("job_applications")
        .insert({ ...data, user_id: user.id } as any)
        .select()
        .single();
      if (!error && newApp) {
        setApplications((prev) => [newApp as JobApplication, ...prev]);
        // Only increment usage for service submissions
        if (isServiceSubmission) {
          await supabase
            .from("profiles")
            .update({ monthly_usage_count: monthlyUsed + 1 } as any)
            .eq("user_id", user.id);
          refreshProfile();
        }
        toast({ title: isServiceSubmission ? "Application deployed" : "Application tracked" });
      }
    }
    setShowAddModal(false);
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (!error) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Application removed" });
    }
  };

  const handleEdit = (app: JobApplication) => {
    if (!user) return;
    setEditData(app);
    setShowAddModal(true);
  };

  // Stats
  const totalApps = applications.length;
  const activeApps = applications.filter((a) => ["applied", "screening", "interview", "offer"].includes(a.status)).length;
  const interviews = applications.filter((a) => a.status === "interview").length;
  const offers = applications.filter((a) => a.status === "offer").length;

  return (
    <DashboardLayout>
      <div className={isSubscribed ? "min-h-screen rounded-2xl p-6" : ""} style={isSubscribed ? { background: "var(--tracker-gradient)" } : {}}>
        <div className="space-y-6">
          {!isSubscribed ? (
            <UpgradePaywall />
          ) : (
            <>
              {isGuest && (
                <Alert className="border-white/20 bg-white/10 text-white">
                  <AlertDescription className="text-sm">
                    🎉 Tracker unlocked! <a href="/auth" className="font-semibold underline">Sign up</a> to save your applications and track progress.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h1
                    className="text-3xl font-bold text-white"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    Job Trackr
                  </h1>
                  <p className="text-sm text-white/60">
                    {isPlan2 ? "Pro Hunter" : "Tracker"} • {isGuest ? "Sign up to start tracking" : "Unlimited manual tracking"}
                  </p>
                </div>
                <Button
                  className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 hover:-translate-y-0.5 transition-all"
                  onClick={() => { setEditData(null); setShowAddModal(true); }}
                  disabled={isGuest}
                >
                  <Plus className="h-4 w-4" />
                  Add Application
                </Button>
              </div>

              <TrackerStats
                totalApps={totalApps}
                activeApps={activeApps}
                interviews={interviews}
                offers={offers}
              />

              <JobCardFeed
                applications={applications}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              <AddJobModal
                open={showAddModal}
                onClose={() => { setShowAddModal(false); setEditData(null); }}
                onSubmit={handleAdd}
                editData={editData}
                isPlan2={isPlan2}
                remainingSlots={remainingSlots}
                isSubscribed={isSubscribed}
              />

              <CrossSellBanner variant="deployment" />
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobTracker;
