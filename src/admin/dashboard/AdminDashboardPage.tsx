import { Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "./StatCard";
import { Button } from "../ui/Button";
import {
  getPendingApplications,
  getTodayStats,
  getWeekStats,
} from "../data/mockData";

const AdminDashboardPage = () => {
  const pendingApps = getPendingApplications();
  const todayStats = getTodayStats();
  const weekStats = getWeekStats();

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Dashboard</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Overview of your application review activity
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <StatCard
    number={pendingApps.length}
    label="Pending Review"
    percentage={65}   
    accentColor="#F59E0B"
  />

  <StatCard
    number={todayStats.reviewed}
    label="Reviewed Today"
    percentage={80}
    accentColor="#10B981"
  />

  <StatCard
    number="8"
    label="Currently Submitting"
    percentage={40}
    accentColor="#2563EB"
  />

  <StatCard
    number={weekStats}
    label="Completed This Week"
    percentage={55}
    accentColor="#64748B"
  />
    </div>

      {/* Quick Action Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <ClipboardList size={24} className="text-[#2563EB]" />
              <h2 className="text-xl font-semibold text-[#1E293B]">
                Review Queue
              </h2>
            </div>

            <p className="text-sm text-[#64748B] mb-4">
              {pendingApps.length} applications waiting for review
            </p>

            <Link to="/admin/review-queue">
              <Button  className="gap-2">
                Start Reviewing
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>

          {/* Preview List */}
          <div className="w-full lg:w-96 bg-[#F8FAFC] rounded-lg p-4">
            <h3 className="text-sm font-semibold text-[#1E293B] mb-3">
              Next in Queue
            </h3>

            <div className="space-y-2">
              {pendingApps.slice(0, 3).map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-md p-3 border border-[#E2E8F0]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#1E293B] truncate">
                        {app.company}
                      </div>
                      <div className="text-xs text-[#64748B] truncate">
                        {app.clientName}
                      </div>
                    </div>
                    <Clock
                      size={14}
                      className="text-[#F59E0B] flex-shrink-0 mt-0.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">
            Today's Performance
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">Total Reviewed</span>
              <span className="text-2xl font-bold text-[#2563EB]">
                {todayStats.reviewed}
              </span>
            </div>

            <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] rounded-full transition-all"
                style={{
                  width: `${(todayStats.reviewed / 20) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-[#D1FAE5] rounded-lg">
                <div className="text-2xl font-bold text-[#10B981]">
                  {todayStats.approved}
                </div>
                <div className="text-xs text-[#64748B] mt-1">Approved</div>
              </div>

              <div className="text-center p-3 bg-[#FEE2E2] rounded-lg">
                <div className="text-2xl font-bold text-[#EF4444]">
                  {todayStats.rejected}
                </div>
                <div className="text-xs text-[#64748B] mt-1">Rejected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-[#1E293B] mb-4">
            Quick Stats
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">
                Average Review Time
              </span>
              <span className="text-sm font-semibold text-[#1E293B]">
                3.5 min
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">Approval Rate</span>
              <span className="text-sm font-semibold text-[#10B981]">
                83%
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-[#E2E8F0]">
              <span className="text-sm text-[#64748B]">This Week</span>
              <span className="text-sm font-semibold text-[#1E293B]">
                {weekStats} reviewed
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#64748B]">This Month</span>
              <span className="text-sm font-semibold text-[#1E293B]">
                156 reviewed
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;