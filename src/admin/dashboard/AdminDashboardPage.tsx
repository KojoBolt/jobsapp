import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Clock, ArrowRight } from "lucide-react";
import { StatCard } from "./StatCard";
import { Button } from "../ui/Button";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
  reviewedToday: number;
  totalRejected: number;
  completedThisWeek: number;
  totalThisMonth: number;
  approvalRate: number;
  totalApps: number;
  pendingApps: {
    id: string;
    company_name: string;
    user_full_name: string;
    created_at: string;
  }[];
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<AdminStats>({
    pendingCount: 0,
    approvedToday: 0,
    rejectedToday: 0,
    reviewedToday: 0,
    totalRejected: 0,
    completedThisWeek: 0,
    totalThisMonth: 0,
    approvalRate: 0,
    totalApps: 0,
    pendingApps: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const now = new Date();

        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);

        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        const monthStart = new Date(now);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // Fetch ALL applications in one query
        const { data: allApps, error } = await supabase
          .from("applications")
          .select("id, status, created_at, updated_at, company_name, user_id");


        if (error) {
          console.error("Error fetching stats:", error);
          return;
        }

        const apps = allApps || [];
        const totalApps = apps.length;

        // Pending
        const pendingApps = apps.filter((a) =>
          ["queued", "pending_review"].includes(a.status)
        );

        // ✅ Reviewed today — use created_at since updated_at may not exist
        // Apps that changed to approved/failed today
        // const approvedTodayApps = apps.filter((a) => {
        //   const date = new Date(a.created_at);
        //   return date >= todayStart && a.status === "approved";
        // });

        const approvedTodayApps = apps.filter((a) => {
          const updateDate = new Date(a.updated_at || a.created_at);
          return updateDate >= todayStart && a.status === "approved";
        });

        const rejectedTodayApps = apps.filter((a) => {
          const updateDate = new Date(a.updated_at || a.created_at);
          return updateDate >= todayStart && a.status === "failed";
        });

        // const rejectedTodayApps = apps.filter((a) => {
        //   const date = new Date(a.created_at);
        //   return date >= todayStart && a.status === "failed";
        // });

        const reviewedToday = approvedTodayApps.length + rejectedTodayApps.length;

        // ✅ Total rejected all time
        const totalRejected = apps.filter((a) => a.status === "failed").length;

        // ✅ Completed this week — any terminal status created this week
        const completedThisWeek = apps.filter((a) => {
          const updatedDate = new Date(a.updated_at || a.created_at);
          return (
            updatedDate >= weekStart &&
            ["completed", "interview", "submitted", "approved"].includes(a.status)
          );
    }).length;

        // Total this month
        const totalThisMonth = apps.filter((a) => {
          const date = new Date(a.created_at);
          return date >= monthStart;
        }).length;

        // Approval rate
        const totalReviewed = apps.filter((a) =>
          ["approved", "failed"].includes(a.status)
        ).length;
        const totalApproved = apps.filter(
          (a) => a.status === "approved"
        ).length;
        const approvalRate =
          totalReviewed > 0
            ? Math.round((totalApproved / totalReviewed) * 100)
            : 0;

        // Fetch pending apps with user names for preview
        const pendingUserIds = [...new Set(pendingApps.slice(0, 3).map((a) => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", pendingUserIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.id, p.full_name])
        );

        const pendingPreview = pendingApps.slice(0, 3).map((a) => ({
          id: a.id,
          company_name: a.company_name,
          user_full_name: profileMap.get(a.user_id) || "Unknown User",
          created_at: a.created_at,
        }));

        setStats({
          pendingCount: pendingApps.length,
          approvedToday: approvedTodayApps.length,
          rejectedToday: rejectedTodayApps.length,
          reviewedToday,
          totalRejected,
          completedThisWeek,
          totalThisMonth,
          approvalRate,
          totalApps,
          pendingApps: pendingPreview,
        });
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ✅ Fixed percentages — use real totals as denominators
  const pendingPercent = stats.totalApps > 0
    ? Math.round((stats.pendingCount / stats.totalApps) * 100)
    : 0;

  const reviewedTodayPercent = stats.totalApps > 0
    ? Math.round((stats.reviewedToday / Math.max(stats.totalApps * 0.1, 1)) * 100)
    : 0;

  const rejectedPercent = stats.totalApps > 0
    ? Math.round((stats.totalRejected / stats.totalApps) * 100)
    : 0;

  const completedPercent = stats.totalApps > 0
    ? Math.round((stats.completedThisWeek / stats.totalApps) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B] dark:text-white">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Overview of your application review activity
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            number={stats.pendingCount}
            label="Pending Review"
            percentage={Math.min(pendingPercent, 100)}
            accentColor="#F59E0B"
          />
          <StatCard
            number={stats.reviewedToday}
            label="Reviewed Today"
            percentage={Math.min(reviewedTodayPercent, 100)}
            accentColor="#10B981"
          />
          <StatCard
            number={stats.totalRejected}
            label="Rejected Applications"
            percentage={Math.min(rejectedPercent, 100)}
            accentColor="#EF4444"
          />
          <StatCard
            number={stats.completedThisWeek}
            label="Completed This Week"
            percentage={Math.min(completedPercent, 100)}
            accentColor="#6366F1"
          />
        </div>
      )}

      {/* Quick Action Card */}
      <div className="bg-white rounded-lg shadow-md p-6 dark:bg-gray-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardList size={24} className="text-[#2563EB]" />
              <h2 className="text-xl font-semibold text-[#1E293B] dark:text-white">
                Review Queue
              </h2>
            </div>
            <p className="text-sm text-[#64748B] mb-4">
              {stats.pendingCount} applications waiting for review
            </p>
            <Link to="/admin/review-queue">
              <Button className="gap-2">
                Start Reviewing
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          <div className="w-full lg:w-96 bg-[#F8FAFC] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">
              Next in Queue
            </h3>
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-md p-3 border border-[#E2E8F0] dark:border-gray-700 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : stats.pendingApps.length > 0 ? (
              <div className="space-y-2">
                {stats.pendingApps.map((app) => (
                  <div key={app.id} className="bg-white dark:bg-gray-800 rounded-md p-3 border border-[#E2E8F0] dark:border-gray-700">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#1E293B] truncate dark:text-white">
                          {app.company_name}
                        </div>
                        <div className="text-xs text-[#64748B] truncate">
                          {app.user_full_name}
                        </div>
                      </div>
                      <Clock size={14} className="text-[#F59E0B] flex-shrink-0 mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#64748B] text-center py-4">
                No pending applications
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Performance */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-[#1E293B] dark:text-gray-200 mb-4">
            Today's Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Total Reviewed</span>
              <span className="text-2xl font-bold text-[#2563EB]">
                {stats.reviewedToday}
              </span>
            </div>
            <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all"
                style={{
                  width: `${Math.min((stats.reviewedToday / Math.max(stats.totalApps * 0.1, 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-[#D1FAE5] rounded-lg">
                <div className="text-2xl font-bold text-[#10B981]">
                  {stats.approvedToday}
                </div>
                <div className="text-xs text-[#64748B] mt-1">Approved</div>
              </div>
              <div className="text-center p-3 bg-[#FEE2E2] rounded-lg">
                <div className="text-2xl font-bold text-[#EF4444]">
                  {stats.rejectedToday}
                </div>
                <div className="text-xs text-[#64748B] mt-1">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-[#1E293B] dark:text-gray-200 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0] dark:border-gray-700">
              <span className="text-sm text-[#64748B]">Total Applications</span>
              <span className="text-sm font-semibold text-[#1E293B]">
                {stats.totalApps}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">Approval Rate</span>
              <span className="text-sm font-semibold text-[#10B981]">
                {stats.approvalRate}%
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">Completed This Week</span>
              <span className="text-sm font-semibold text-[#1E293B]">
                {stats.completedThisWeek}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#64748B]">This Month</span>
              <span className="text-sm font-semibold text-[#1E293B]">
                {stats.totalThisMonth} applications
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;