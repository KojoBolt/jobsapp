import React, { useState, useEffect } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Search, ExternalLink, Clock } from "lucide-react";
import { Button } from "../ui/Button";
import ReviewModal from "../../admin/ReviewModal";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/admin/toast/ToastContext";
import { supabase } from "@/integrations/supabase/client";

interface Application {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_url: string | null;
  job_description: string | null;
  cover_letter: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  campaign_id: string | null;
  match_score: number | null;
}

interface UserWithApps {
  user_id: string;
  full_name: string;
  email: string;
  total_apps: number;
  applications: Application[];
}

type TabKey = "pending" | "approved" | "submitted" | "revision" | "completed" | "rejected";

const TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "pending",   label: "All Applications",     statuses: ["queued", "pending_review"] },
  { key: "approved",  label: "Approved",        statuses: ["approved"] },
  { key: "submitted", label: "Submitted",       statuses: ["submitted"] },
  { key: "revision",  label: "Needs Revision",  statuses: ["drafting"] },
  { key: "completed", label: "Completed",       statuses: ["interview", "completed"] },
  { key: "rejected",  label: "Rejected",        statuses: ["failed"] },
];

const ITEMS_PER_PAGE = 10;
const JOBS_PER_PAGE = 5;

const statusColors: Record<string, string> = {
  queued:         "text-[#F59E0B]",
  pending_review: "text-[#F59E0B]",
  approved:       "text-[#10B981]",
  submitted:      "text-[#10B981]",
  drafting:       "text-[#6366F1]",
  interview:      "text-[#10B981]",
  completed:      "text-[#10B981]",
  failed:         "text-[#EF4444]",
};

const ReviewQueuePage = (): JSX.Element => {
  const [users, setUsers] = useState<UserWithApps[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("pending");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [jobPages, setJobPages] = useState<Record<string, number>>({});
  const { pushToast } = useToast();

  useEffect(() => {
    const fetchUsersWithApps = async () => {
      try {
        setLoading(true);
        const activeTabConfig = TABS.find((t) => t.key === activeTab);
        const statuses = activeTabConfig?.statuses || ["queued"];

        // Step 1: Fetch applications
        const { data: appsData, error: appsError } = await supabase
          .from("applications")
          .select("*")
          .in("status", statuses)
          .order("created_at", { ascending: false });

        if (appsError) {
          pushToast({ variant: "error", title: "Error", message: "Failed to load applications" });
          return;
        }

        if (!appsData || appsData.length === 0) {
          setUsers([]);
          return;
        }

        // Step 2: Get unique user IDs
        const userIds = [...new Set(appsData.map((a) => a.user_id))];

        // Step 3: Fetch profiles - try without RLS by using an admin approach
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", userIds);



        // Step 4: Build profile map
        const profileMap = new Map<string, { full_name: string; email: string }>();
        (profilesData || []).forEach((p: any) => {
          profileMap.set(p.id, {
            full_name: p.full_name || p.first_name || "Unknown User",
            email: p.email || "No email",
          });
        });

        // Step 5: Group applications by user
        const userMap = new Map<string, UserWithApps>();

        appsData.forEach((app) => {
          const userId = app.user_id;
          const profile = profileMap.get(userId);

          if (!userMap.has(userId)) {
            userMap.set(userId, {
              user_id: userId,
              full_name: profile?.full_name || "Unknown User",
              email: profile?.email || "No email",
              total_apps: 0,
              applications: [],
            });
          }

          const user = userMap.get(userId)!;
          user.total_apps += 1;
          user.applications.push({
            id: app.id,
            user_id: app.user_id,
            company_name: app.company_name,
            job_title: app.job_title,
            job_url: app.job_url,
            job_description: app.job_description,
            cover_letter: app.cover_letter,
            status: app.status,
            admin_notes: app.admin_notes,
            created_at: app.created_at,
            campaign_id: app.campaign_id,
            match_score: app.match_score,
          });
        });

        setUsers(Array.from(userMap.values()));
        setCurrentPage(1);
        setExpandedUser(null);
      } catch (err) {
        pushToast({ variant: "error", title: "Error", message: "An unexpected error occurred" });
      } finally {
        setLoading(false);
      }
    };

    fetchUsersWithApps();
  }, [activeTab, pushToast]);

  const handleApprove = async (notes?: string, coverLetter?: string) => {
    if (!selectedApp) return;
    try {
      const { data, error } = await supabase
        .from("applications")
        .update({
          status: "approved",
          admin_notes: notes || "",
          cover_letter: coverLetter || selectedApp.cover_letter,
        })
        .eq("id", selectedApp.id)
        .select();

      if (error) {
        pushToast({ variant: "error", title: "Error", message: `Failed to approve: ${error.message}` });
        return;
      }
      if (!data || data.length === 0) {
        pushToast({ variant: "error", title: "Error", message: "Update failed — check RLS policies" });
        return;
      }

      // Remove approved app from user's list
      setUsers((prev) => prev.map((user) => ({
        ...user,
        applications: user.applications.filter((a) => a.id !== selectedApp.id),
        total_apps: user.total_apps - 1,
      })).filter((user) => user.total_apps > 0));

      pushToast({ variant: "success", title: "Approved", message: "Application approved successfully!" });
      setSelectedApp(null);
    } catch (error: any) {
      pushToast({ variant: "error", title: "Error", message: error.message || "Unexpected error" });
    }
  };

  const handleReject = async (notes?: string) => {
    if (!selectedApp) return;
    try {
      const { data, error } = await supabase
        .from("applications")
        .update({ status: "failed", admin_notes: notes || "" })
        .eq("id", selectedApp.id)
        .select();

      if (error) {
        pushToast({ variant: "error", title: "Error", message: `Failed to reject: ${error.message}` });
        return;
      }
      if (!data || data.length === 0) {
        pushToast({ variant: "error", title: "Error", message: "Update failed — check RLS policies" });
        return;
      }

      // Remove rejected app from user's list
      setUsers((prev) => prev.map((user) => ({
        ...user,
        applications: user.applications.filter((a) => a.id !== selectedApp.id),
        total_apps: user.total_apps - 1,
      })).filter((user) => user.total_apps > 0));

      pushToast({ variant: "warning", title: "Rejected", message: "Application rejected." });
      setSelectedApp(null);
    } catch (error: any) {
      pushToast({ variant: "error", title: "Error", message: error.message || "Unexpected error" });
    }
  };

  // Filter by search
  const filtered = users.filter((user) =>
    user.full_name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [1, 2];
    if (currentPage > 4) pages.push("...");
    for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 3) pages.push("...");
    pages.push(totalPages - 1, totalPages);
    return pages;
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const getJobPage = (userId: string) => jobPages[userId] || 1;

  const setJobPage = (userId: string, page: number) => {
    setJobPages((prev) => ({ ...prev, [userId]: page }));
  };

  const getPaginatedJobs = (user: UserWithApps) => {
    const page = getJobPage(user.user_id);
    const start = (page - 1) * JOBS_PER_PAGE;
    return {
      jobs: user.applications.slice(start, start + JOBS_PER_PAGE),
      totalPages: Math.ceil(user.applications.length / JOBS_PER_PAGE),
      currentPage: page,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Review Queue</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {loading ? "Loading..." : `${filtered.length} user${filtered.length !== 1 ? "s" : ""} with pending applications`}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-[#1E293B] placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0]">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setCurrentPage(1); }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-[#7C3AED] text-[#7C3AED]"
                  : "border-transparent text-[#64748B] hover:text-[#1E293B]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C3AED]" />
            <p className="text-[#64748B] mt-4">Loading...</p>
          </div>
        </div>
      ) : paginated.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <table className="w-full">
            {/* Purple Header */}
            <thead>
              <tr className="bg-[#7C3AED] text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Customer Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Total Applications</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {paginated.map((user) => (
                <React.Fragment key={user.user_id}>
                  {/* User Row */}
                  <tr
                    className="hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                    onClick={() => setExpandedUser(
                      expandedUser === user.user_id ? null : user.user_id
                    )}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] text-sm font-bold shrink-0">
                          {getInitials(user.full_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1E293B]">{user.full_name}</p>
                          <p className="text-xs text-[#64748B]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#EDE9FE] text-[#7C3AED] text-sm font-bold">
                        {user.total_apps}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedUser(
                            expandedUser === user.user_id ? null : user.user_id
                          );
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#7C3AED] border border-[#7C3AED] rounded-lg hover:bg-[#EDE9FE] transition-colors"
                      >
                        {expandedUser === user.user_id ? (
                          <><ChevronUp size={14} /> Hide Jobs</>
                        ) : (
                          <><ChevronDown size={14} /> View Jobs</>
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Jobs List */}
                  {expandedUser === user.user_id && (
                    <tr key={`${user.user_id}-expanded`}>
                      <td colSpan={4} className="px-0 py-0">
                        <div className="bg-[#F8FAFC] border-t border-b border-[#E2E8F0]">
                          {/* Jobs sub-header */}
                          <div className="grid grid-cols-5 px-8 py-2 bg-[#EDE9FE] text-xs font-semibold text-[#7C3AED] uppercase tracking-wider">
                            <span>Company</span>
                            <span>Job Title</span>
                            <span>Match Score</span>
                            <span>Date</span>
                            <span>Action</span>
                          </div>

                          {/* Jobs rows */}
                          {(() => {
                            const { jobs, totalPages, currentPage } = getPaginatedJobs(user);
                            return (
                              <>
                                {jobs.map((app, idx) => (
                                  <div
                                    key={app.id}
                                    className={`grid grid-cols-5 px-8 py-3 items-center text-sm ${
                                      idx !== jobs.length - 1
                                        ? "border-b border-[#E2E8F0]"
                                        : ""
                                    } hover:bg-white transition-colors`}
                                  >
                                    {/* Company */}
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#2563EB] text-xs font-bold shrink-0">
                                        {app.company_name?.slice(0, 2).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="font-medium text-[#1E293B]">{app.company_name}</p>
                                        {app.job_url && (
                                          <a
                                            href={app.job_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs text-[#7C3AED] hover:underline flex items-center gap-0.5"
                                          >
                                            View <ExternalLink size={9} />
                                          </a>
                                        )}
                                      </div>
                                    </div>

                                    {/* Job Title */}
                                    <span className="text-[#64748B]">{app.job_title}</span>

                                    {/* Match Score */}
                                    <span className={`font-bold ${
                                      app.match_score === null ? "text-[#94A3B8]" :
                                      app.match_score >= 70 ? "text-[#10B981]" :
                                      app.match_score >= 40 ? "text-[#F59E0B]" :
                                      "text-[#EF4444]"
                                    }`}>
                                      {app.match_score !== null ? `${app.match_score}%` : "N/A"}
                                    </span>

                                    {/* Date */}
                                    <span className="text-[#64748B]">
                                      {format(new Date(app.created_at), "d MMM yyyy")}
                                    </span>

                                    {/* Action */}
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold capitalize ${statusColors[app.status] || "text-[#64748B]"}`}>
                                        {app.status.replace("_", " ")}
                                      </span>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => setSelectedApp(app)}
                                      >
                                        Review
                                      </Button>
                                    </div>
                                  </div>
                                ))}

                                {/* Jobs pagination */}
                                {totalPages > 1 && (
                                  <div className="flex items-center justify-between px-8 py-3 border-t border-[#E2E8F0]">
                                    <p className="text-xs text-[#64748B]">
                                      Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setJobPage(user.user_id, currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded text-[#64748B] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                      >
                                        ← Previous
                                      </button>
                                      <button
                                        onClick={() => setJobPage(user.user_id, currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded text-[#64748B] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                      >
                                        Next →
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
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
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-[#10B981]" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-[#1E293B] mb-2">All caught up!</h3>
          <p className="text-sm text-[#64748B]">No applications in this category</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748B]">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            {getPageNumbers().map((page, idx) =>
              page === "..." ? (
                <span key={idx} className="px-3 py-1.5 text-sm text-[#64748B]">...</span>
              ) : (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(Number(page))}
                  className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                    currentPage === page
                      ? "border-[#7C3AED] bg-[#7C3AED] text-white"
                      : "border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-[#E2E8F0] rounded-lg text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedApp && (
        <ReviewModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

export default ReviewQueuePage;