import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ResumeManager from "@/components/dashboard/ResumeManager";
import { T } from "@/admin/ui/system";

const Profile = () => {
  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Resume Manager</h1>
          <p className={`text-[12px] ${T.muted}`}>
            Manage up to 5 resume versions. Set a primary resume for new applications.
          </p>
        </div>
        <ResumeManager />
      </div>
    </DashboardLayout>
  );
};

export default Profile;
