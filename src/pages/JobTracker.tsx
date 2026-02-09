import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import UpgradePaywall from "@/components/tracker/UpgradePaywall";
import TrackerStats from "@/components/tracker/TrackerStats";
import JobCardFeed from "@/components/tracker/JobCardFeed";
import AddJobModal from "@/components/tracker/AddJobModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
}

const JobTracker = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editData, setEditData] = useState<JobApplication | null>(null);
  const [loading, setLoading] = useState(true);

  const isSubscribed = profile?.subscription_tier === "plan_1" || profile?.subscription_tier === "plan_2";
  const isPlan2 = profile?.subscription_tier === "plan_2";
  const monthlyLimit = isPlan2 ? 50 : 10;
  const monthlyUsed = profile?.monthly_usage_count || 0;
  const remainingSlots = Math.max(monthlyLimit - monthlyUsed, 0);

  // Check if usage needs reset (30 days since last reset)
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

  // Check for subscription callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      refreshProfile();
      toast({ title: "Welcome to Job Trackr!", description: "Your subscription is now active." });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleAdd = async (data: any) => {
    if (!user) return;
    if (!editData && remainingSlots <= 0) {
      toast({ title: "Monthly limit reached", description: "Upgrade or wait for reset.", variant: "destructive" });
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
        // Increment usage
        await supabase
          .from("profiles")
          .update({ monthly_usage_count: monthlyUsed + 1 } as any)
          .eq("user_id", user.id);
        refreshProfile();
        toast({ title: "Application added" });
      }
    }
    setShowAddModal(false);
    setEditData(null);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("job_applications").delete().eq("id", id);
    if (!error) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Application removed" });
    }
  };

  const handleEdit = (app: JobApplication) => {
    setEditData(app);
    setShowAddModal(true);
  };

  // Compute stats
  const totalApps = applications.length;
  const activeMissions = applications.filter((a) => ["screening", "applied"].includes(a.status)).length;
  const interviews = applications.filter((a) => a.status === "interview").length;
  const offers = applications.filter((a) => a.status === "offer").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {!isSubscribed ? (
          <UpgradePaywall />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className="text-2xl font-bold text-foreground"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Job Trackr
                </h1>
                <p className="text-sm text-muted-foreground">
                  {isPlan2 ? "Pro Hunter" : "Tracker"} • {remainingSlots} submissions left this month
                </p>
              </div>
              <Button
                variant="hero"
                onClick={() => { setEditData(null); setShowAddModal(true); }}
                disabled={remainingSlots <= 0}
              >
                <Plus className="h-4 w-4" />
                Add Application
              </Button>
            </div>

            <TrackerStats
              totalApps={totalApps}
              activeMissions={activeMissions}
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
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobTracker;
