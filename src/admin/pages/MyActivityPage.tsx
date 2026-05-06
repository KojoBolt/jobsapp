import { useState, useEffect } from "react";
import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { StatCard } from "../dashboard/StatCard";
import { format, formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface Activity {
  id: string;
  action: "approved" | "failed";
  company_name: string;
  job_title: string;
  job_url: string | null;
  admin_notes: string | null;
  updated_at: string;
}

const MyActivityPage = (): JSX.Element => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    monthCount: 0,
    approvalRate: 0,
    todayPercent: 0,
    weekPercent: 0,
    monthPercent: 0,
  });

  useEffect(() => {
    const fetchActivity = async () => {
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

        // Fetch all reviewed applications
        const { data, error } = await supabase
          .from("applications")
          .select("id, status, company_name, job_title, job_url, admin_notes, updated_at, created_at")
          .in("status", ["approved", "failed"])
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching activity:", error);
          return;
        }

        const apps = data || [];

        // Map to activity format
        const mapped: Activity[] = apps.map((app) => ({
          id: app.id,
          action: app.status === "approved" ? "approved" : "failed",
          company_name: app.company_name,
          job_title: app.job_title,
          job_url: app.job_url,
          admin_notes: app.admin_notes,
          updated_at: app.updated_at || app.created_at,
        }));

        setActivities(mapped);

        // Calculate stats
        const todayApps = apps.filter((a) => {
          const date = new Date(a.updated_at || a.created_at);
          return date >= todayStart;
        });

        const weekApps = apps.filter((a) => {
          const date = new Date(a.updated_at || a.created_at);
          return date >= weekStart;
        });

        const monthApps = apps.filter((a) => {
          const date = new Date(a.updated_at || a.created_at);
          return date >= monthStart;
        });

        const totalApproved = apps.filter((a) => a.status === "approved").length;
        const approvalRate = apps.length > 0
          ? Math.round((totalApproved / apps.length) * 100)
          : 0;

        // Calculate percentages relative to total
        const total = apps.length || 1;
        setStats({
          todayCount: todayApps.length,
          weekCount: weekApps.length,
          monthCount: monthApps.length,
          approvalRate,
          todayPercent: Math.min(Math.round((todayApps.length / total) * 100), 100),
          weekPercent: Math.min(Math.round((weekApps.length / total) * 100), 100),
          monthPercent: Math.min(Math.round((monthApps.length / total) * 100), 100),
        });
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, []);

  // Group activities by date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = format(new Date(activity.updated_at), "MMM d, yyyy");
    if (!groups[date]) groups[date] = [];
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B] dark:text-white">My Activity</h1>
        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
          Track your review history and performance
        </p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-50 rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            number={stats.todayCount}
            label="Reviewed Today"
            percentage={stats.todayPercent}
            accentColor="#10B981"
          />
          <StatCard
            number={stats.weekCount}
            label="Reviewed This Week"
            percentage={stats.weekPercent}
            accentColor="#2563EB"
          />
          <StatCard
            number={stats.monthCount}
            label="Reviewed This Month"
            percentage={stats.monthPercent}
            accentColor="#64748B"
          />
        </div>
      )}

      {/* Activity Feed */}
      <div className="rounded-lg shadow-sm border border-[#E2E8F0] dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#1E293B] dark:text-white">Recent Activity</h2>
          <span className="text-sm text-[#64748B] dark:text-gray-400">
            {activities.length} total reviews
          </span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-20 h-4 bg-gray-200 rounded" />
                <div className="flex-1 h-20 bg-gray-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium text-[#1E293B]">No activity yet</p>
            <p className="text-sm text-[#64748B] mt-1">
              Start reviewing applications to see your activity here.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-[#E2E8F0]" />
                  <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider px-2">
                    {date}
                  </span>
                  <div className="h-px flex-1 bg-[#E2E8F0]" />
                </div>

                <div className="space-y-4">
                  {dayActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-4">
                      {/* Time */}
                      <div className="w-14 flex-shrink-0 text-xs text-[#64748B] pt-1 text-right">
                        {format(new Date(activity.updated_at), "HH:mm")}
                      </div>

                      {/* Activity Card */}
                      <div
                        className={`flex-1 bg-[#F8FAFC] dark:bg-gray-800 rounded-lg p-4 border-l-4 ${
                          activity.action === "approved"
                            ? "border-[#10B981]"
                            : "border-[#EF4444]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {activity.action === "approved" ? (
                            <CheckCircle size={18} className="text-[#10B981] flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle size={18} className="text-[#EF4444] flex-shrink-0 mt-0.5" />
                          )}

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className={`text-sm font-semibold ${
                                activity.action === "approved"
                                  ? "text-[#10B981]"
                                  : "text-[#EF4444]"
                              }`}>
                                {activity.action === "approved" ? "Approved" : "Rejected"}
                              </span>
                              <span className="text-xs text-[#94A3B8]">
                                {formatDistanceToNow(new Date(activity.updated_at), { addSuffix: true })}
                              </span>
                            </div>

                            <div className="text-sm font-medium text-[#1E293B]">
                              {activity.company_name}
                            </div>
                            <div className="text-sm text-[#64748B]">
                              {activity.job_title}
                            </div>

                            {activity.admin_notes && (
                              <div className="mt-2 text-sm text-[#64748B] italic bg-white dark:bg-gray-800 rounded p-2 border border-[#E2E8F0] dark:border-gray-700">
                                "{activity.admin_notes}"
                              </div>
                            )}

                            {activity.job_url && (
                              <a
                                href={activity.job_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline"
                              >
                                <ExternalLink size={11} />
                                View Job Posting
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-[#E2E8F0] dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-[#1E293B] dark:text-gray-200 mb-4">
          Performance Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-[#64748B] mb-2">Approval Rate</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-[#10B981]">
                {stats.approvalRate}%
              </div>
              <div className="text-sm text-[#64748B] mb-1">lifetime</div>
            </div>
            <div className="mt-2 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full transition-all"
                style={{ width: `${stats.approvalRate}%` }}
              />
            </div>
          </div>

          <div>
            <div className="text-sm text-[#64748B] mb-2">Total Reviewed</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-[#2563EB]">
                {activities.length}
              </div>
              <div className="text-sm text-[#64748B] mb-1">all time</div>
            </div>
            <div className="mt-2 text-xs text-[#64748B]">
              {activities.filter((a) => a.action === "approved").length} approved,{" "}
              {activities.filter((a) => a.action === "failed").length} rejected
            </div>
          </div>

          <div>
            <div className="text-sm text-[#64748B] mb-2">This Month</div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-[#64748B]">
                {stats.monthCount}
              </div>
              <div className="text-sm text-[#64748B] mb-1">reviews</div>
            </div>
            <div className="mt-2 text-xs text-[#64748B]">
              {stats.weekCount} in the last 7 days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyActivityPage;