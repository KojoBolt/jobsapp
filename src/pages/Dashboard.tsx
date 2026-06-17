import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCards from "@/components/dashboard/StatsCards";
import ApplicationFeed from "@/components/dashboard/ApplicationFeed";
import PowerUpWidget from "@/components/dashboard/PowerUpWidget";
import DeployButton from "@/components/dashboard/DeployButton";
import CrossSellBanner from "@/components/dashboard/CrossSellBanner";
import { useAuth } from "@/hooks/useAuth";  
import { useDashboardData } from "@/hooks/useDashboardData";  
import { Loader2, Radar } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client"; 
import { useNotifications } from "@/hooks/useNotifications";

const Dashboard = () => {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useDashboardData(user?.id);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [campaignLoading, setCampaignLoading] = useState(true);

  useNotifications();

  useEffect(() => {
    if (!user) return;

    const check = async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("id, total_jobs, processed_jobs, next_batch_at, status")
        .eq("user_id", user.id)
        .eq("status", "running") // Only get actively running campaigns
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active campaign:", error);
        return;
      }

      // Safeguard: If the database flag is "running" but all jobs are processed, 
      // it's effectively done. Prevent UI ghosting.
      if (data && data.total_jobs > 0 && data.processed_jobs >= data.total_jobs) {
        setActiveCampaign(null);
      } else {
        setActiveCampaign(data); // Will set to null perfectly if data is null
      }
      
      setCampaignLoading(false);
    };

    check();
    
    // Polling backup
    const interval = setInterval(check, 30000); 
    
    return () => clearInterval(interval);
  }, [user]);

  function getTimeUntil(isoDate: string): string {
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return "any moment";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <p className="text-lg text-destructive">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Overview</h1>
          <p className="text-sm text-muted-foreground">
            Track your application campaign in real-time.
          </p>
        </div>

<CrossSellBanner variant="tracker" />
        <DeployButton />
        
        <PowerUpWidget 
          remaining={data?.applications_remaining || 0}
          status={data?.balance_status || 'Active'}
          plan={data?.plan || 'free'}
        />
        <StatsCards data={data} />
        <ApplicationFeed applications={data?.applications || []} onApplicationDeleted={refetch} />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;