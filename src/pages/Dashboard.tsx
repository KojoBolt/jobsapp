import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCards from "@/components/dashboard/StatsCards";
import ApplicationFeed from "@/components/dashboard/ApplicationFeed";
import PowerUpWidget from "@/components/dashboard/PowerUpWidget";
import DeployButton from "@/components/dashboard/DeployButton";
import RecommendedProducts from "@/components/accelerators/RecommendedProducts";
import CrossSellBanner from "@/components/dashboard/CrossSellBanner";
import { useAuth } from "@/hooks/useAuth";  // ADD THIS
import { useDashboardData } from "@/hooks/useDashboardData";  // ADD THIS
import { Loader2 } from "lucide-react";  // ADD THIS

const Dashboard = () => {
  // ADD THESE 3 LINES ↓
  const { user } = useAuth();
  const { data, loading, error } = useDashboardData(user?.id);

  // ADD LOADING STATE ↓
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // ADD ERROR STATE ↓
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
        
        {/* Now 'data' exists! */}
        <PowerUpWidget 
          remaining={data?.applications_remaining || 0}
          status={data?.balance_status || 'Active'}
          plan={data?.plan || 'free'}
        />
        <StatsCards data={data} />
        <ApplicationFeed applications={data?.applications || []} />
        <RecommendedProducts />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;