import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { StatCard } from "../dashboard/StatCard";
import { mockActivities } from "../data/mockData";
import { format } from "date-fns";

const MyActivityPage = (): JSX.Element => {
  const today = new Date();

  const todayCount = mockActivities.filter((a) => {
    const activityDate = new Date(a.timestamp);
    return activityDate.toDateString() === today.toDateString();
  }).length;

  const weekCount = mockActivities.filter((a) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(a.timestamp) >= weekAgo;
  }).length;

  const monthCount = mockActivities.length;

  // Static percentage placeholders (replace later with real calculations)
  const todayPercent = 70;
  const weekPercent = 60;
  const monthPercent = 85;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">My Activity</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Track your review history and performance
        </p>
      </div>

      {/* Stats Cards (Percentage Circle Version) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          number={todayCount}
          label="Reviewed Today"
          percentage={todayPercent}
          accentColor="#10B981"
        />

        <StatCard
          number={weekCount}
          label="Reviewed This Week"
          percentage={weekPercent}
          accentColor="#2563EB"
        />

        <StatCard
          number={monthCount}
          label="Reviewed This Month"
          percentage={monthPercent}
          accentColor="#64748B"
        />
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-6">
          Recent Activity
        </h2>

        <div className="space-y-6">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              {/* Time */}
              <div className="w-20 flex-shrink-0 text-xs text-[#64748B] pt-1">
                {format(activity.timestamp, "HH:mm")}
              </div>

              {/* Activity Card */}
              <div
                className={`flex-1 bg-[#F8FAFC] rounded-lg p-4 border-l-4 ${
                  activity.action === "approved"
                    ? "border-[#10B981]"
                    : "border-[#EF4444]"
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  {activity.action === "approved" ? (
                    <CheckCircle
                      size={20}
                      className="text-[#10B981] flex-shrink-0 mt-0.5"
                    />
                  ) : (
                    <XCircle
                      size={20}
                      className="text-[#EF4444] flex-shrink-0 mt-0.5"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-sm font-semibold ${
                          activity.action === "approved"
                            ? "text-[#10B981]"
                            : "text-[#EF4444]"
                        }`}
                      >
                        {activity.action === "approved"
                          ? "Approved"
                          : "Rejected"}
                      </span>

                      <span className="text-xs text-[#64748B]">
                        {format(activity.timestamp, "MMM d, yyyy")}
                      </span>
                    </div>

                    <div className="text-sm text-[#1E293B] font-medium mb-1">
                      {activity.application.company}
                    </div>

                    <div className="text-sm text-[#64748B]">
                      {activity.application.jobTitle}
                    </div>

                    {activity.notes && (
                      <div className="mt-2 text-sm text-[#64748B] italic bg-white rounded p-2 border border-[#E2E8F0]">
                        "{activity.notes}"
                      </div>
                    )}

                    <button className="mt-3 inline-flex items-center gap-1 text-xs text-[#2563EB] hover:underline">
                      <ExternalLink size={12} />
                      View Application
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-6">
        <h2 className="text-lg font-semibold text-[#1E293B] mb-4">
          Performance Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-[#64748B] mb-2">
              Approval Rate
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-[#10B981]">
                83%
              </div>
              <div className="text-sm text-[#64748B] mb-1">
                lifetime
              </div>
            </div>

            <div className="mt-2 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#10B981] rounded-full"
                style={{ width: "83%" }}
              ></div>
            </div>
          </div>

          <div>
            <div className="text-sm text-[#64748B] mb-2">
              Average Review Time
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-[#2563EB]">
                3.5
              </div>
              <div className="text-sm text-[#64748B] mb-1">
                minutes
              </div>
            </div>

            <div className="mt-2 text-xs text-[#64748B]">
              You're 25% faster than average
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyActivityPage;