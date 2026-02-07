import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCards from "@/components/dashboard/StatsCards";
import ApplicationFeed from "@/components/dashboard/ApplicationFeed";
import PowerUpWidget from "@/components/dashboard/PowerUpWidget";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Overview</h1>
          <p className="text-sm text-muted-foreground">
            Track your application campaign in real-time.
          </p>
        </div>
        <PowerUpWidget />
        <StatsCards />
        <ApplicationFeed />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
