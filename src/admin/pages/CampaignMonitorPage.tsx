import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronUp, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/admin/toast/ToastContext";
import { format, formatDistanceToNow } from "date-fns";
import React from "react";

interface Campaign {
  id: string;
  user_id: string;
  status: string;
  total_jobs: number;
  processed_jobs: number;
  created_at: string;
  user_full_name: string;
  user_email: string;
  success_rate: number;
}

const ITEMS_PER_PAGE = 10;

const statusColors: Record<string, string> = {
  running:   "bg-blue-100 text-blue-600",
  completed: "bg-green-100 text-green-600",
  failed:    "bg-red-100 text-red-600",
};

const CampaignMonitorPage = (): JSX.Element => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [expandedApps, setExpandedApps] = useState<Record<string, any[]>>({});
  const { pushToast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);

      const { data: campaignsData, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        pushToast({ variant: "error", title: "Error", message: "Failed to load campaigns" });
        return;
      }

      if (!campaignsData || campaignsData.length === 0) {
        setCampaigns([]);
        return;
      }

      // Fetch user profiles
      const userIds = [...new Set(campaignsData.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
      );

      // Fetch application counts per campaign
      const { data: appData } = await supabase
        .from("applications")
        .select("campaign_id, status")
        .in("campaign_id", campaignsData.map((c) => c.id));

      const appMap = new Map<string, any[]>();
      (appData || []).forEach((a) => {
        if (!appMap.has(a.campaign_id)) appMap.set(a.campaign_id, []);
        appMap.get(a.campaign_id)!.push(a);
      });

      const enriched: Campaign[] = campaignsData.map((c) => {
        const profile = profileMap.get(c.user_id);
        const apps = appMap.get(c.id) || [];
        const submitted = apps.filter((a) =>
          ["submitted", "interview", "completed", "approved"].includes(a.status)
        ).length;
        const successRate = apps.length > 0
          ? Math.round((submitted / apps.length) * 100)
          : 0;

        return {
          id: c.id,
          user_id: c.user_id,
          status: c.status,
          total_jobs: c.total_jobs,
          processed_jobs: c.processed_jobs,
          created_at: c.created_at,
          user_full_name: profile?.full_name || "Unknown User",
          user_email: profile?.email || "No email",
          success_rate: successRate,
        };
      });

      setCampaigns(enriched);
    } catch (err) {
      pushToast({ variant: "error", title: "Error", message: "Unexpected error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignApps = async (campaignId: string) => {
    if (expandedApps[campaignId]) return; // already loaded
    const { data } = await supabase
      .from("applications")
      .select("id, company_name, job_title, status, created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .limit(10);
    setExpandedApps((prev) => ({ ...prev, [campaignId]: data || [] }));
  };

  const handleExpand = (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
    } else {
      setExpandedCampaign(campaignId);
      fetchCampaignApps(campaignId);
    }
  };

  const filtered = campaigns.filter((c) =>
    c.user_full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.user_email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] dark:text-white">Campaign Monitor</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {loading ? "Loading..." : `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Campaigns", value: campaigns.length, color: "#7C3AED" },
          { label: "Running", value: campaigns.filter((c) => c.status === "running").length, color: "#2563EB" },
          { label: "Completed", value: campaigns.filter((c) => c.status === "completed").length, color: "#10B981" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-[#E2E8F0] dark:border-gray-700 p-4">
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-sm text-[#64748B]">{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]" />
        </div>
      ) : paginated.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-[#E2E8F0] dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#7C3AED] text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Success Rate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Started</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-gray-700">
              {paginated.map((campaign) => (
                <React.Fragment key={campaign.id}>
                  <tr className="hover:bg-[#F8FAFC] dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] text-xs font-bold shrink-0">
                          {getInitials(campaign.user_full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1E293B] dark:text-gray-200">{campaign.user_full_name}</p>
                          <p className="text-xs text-[#64748B]">{campaign.user_email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${statusColors[campaign.status] || "bg-gray-100 text-gray-600"}`}>
                        {campaign.status === "running" && (
                          <Activity size={10} className="inline mr-1 animate-pulse" />
                        )}
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#7C3AED] rounded-full transition-all"
                            style={{
                              width: `${campaign.total_jobs > 0
                                ? Math.round((campaign.processed_jobs / campaign.total_jobs) * 100)
                                : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-xs text-[#64748B]">
                          {campaign.processed_jobs}/{campaign.total_jobs}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-bold ${
                        campaign.success_rate >= 70 ? "text-[#10B981]" :
                        campaign.success_rate >= 40 ? "text-[#F59E0B]" :
                        "text-[#EF4444]"
                      }`}>
                        {campaign.success_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      <div>
                        <p>{format(new Date(campaign.created_at), "d MMM yyyy")}</p>
                        <p className="text-xs">{formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleExpand(campaign.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#7C3AED] border border-[#7C3AED] rounded-lg hover:bg-[#EDE9FE] transition-colors"
                      >
                        {expandedCampaign === campaign.id
                          ? <><ChevronUp size={14} /> Hide</>
                          : <><ChevronDown size={14} /> View Apps</>
                        }
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Applications */}
                  {expandedCampaign === campaign.id && (
                    <tr>
                      <td colSpan={6} className="px-0 py-0">
                        <div className="bg-[#F8FAFC] border-t border-[#E2E8F0]">
                          <div className="grid grid-cols-4 px-8 py-2 bg-[#EDE9FE] text-xs font-semibold text-[#7C3AED] uppercase">
                            <span>Company</span>
                            <span>Job Title</span>
                            <span>Status</span>
                            <span>Date</span>
                          </div>
                          {(expandedApps[campaign.id] || []).length > 0 ? (
                            expandedApps[campaign.id].map((app, idx) => (
                              <div
                                key={app.id}
                                className={`grid grid-cols-4 px-8 py-3 text-sm items-center ${
                                  idx !== expandedApps[campaign.id].length - 1
                                    ? "border-b border-[#E2E8F0]"
                                    : ""
                                } hover:bg-white`}
                              >
                                <span className="font-medium text-[#1E293B]">{app.company_name}</span>
                                <span className="text-[#64748B]">{app.job_title}</span>
                                <span className={`text-xs font-semibold capitalize ${
                                  app.status === "approved" || app.status === "submitted" ? "text-[#10B981]" :
                                  app.status === "failed" ? "text-[#EF4444]" :
                                  "text-[#F59E0B]"
                                }`}>
                                  {app.status.replace("_", " ")}
                                </span>
                                <span className="text-[#64748B]">
                                  {format(new Date(app.created_at), "d MMM yyyy")}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="px-8 py-4 text-sm text-[#64748B]">
                              Loading applications...
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-[#E2E8F0] dark:border-gray-700 p-12 text-center">
          <h3 className="text-xl font-semibold text-[#1E293B] dark:text-gray-200 mb-2">No campaigns yet</h3>
          <p className="text-sm text-[#64748B]">Campaigns will appear here when users deploy applications.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748B]">Page {currentPage} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40"
            >
              ← Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1.5 text-sm border rounded-lg ${
                  currentPage === page
                    ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                    : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignMonitorPage;