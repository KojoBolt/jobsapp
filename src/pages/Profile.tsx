import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ResumeManager from "@/components/dashboard/ResumeManager";

const Profile = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resume Manager</h1>
          <p className="text-sm text-muted-foreground">
            Manage up to 5 resume versions. Set a primary resume for new applications.
          </p>
        </div>
        <ResumeManager />
      </div>
    </DashboardLayout>
  );
};

export default Profile;
