import { useState, useEffect } from "react";
import { Search, ExternalLink, CheckCircle, Clock, Send } from "lucide-react";
import { Button } from "../ui/Button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/admin/toast/ToastContext";
import { format } from "date-fns";

interface ApprovedApplication {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_url: string | null;
  cover_letter: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
  user_full_name: string;
  user_email: string;
}

const ITEMS_PER_PAGE = 10;

const SubmissionQueuePage = (): JSX.Element => {
  const [applications, setApplications] = useState<ApprovedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    fetchApprovedApps();
  }, []);

  const fetchApprovedApps = async () => {
    try {
      setLoading(true);

      const { data: apps, error } = await supabase
        .from("applications")
        .select("*")
        .eq("status", "approved")
        .order("updated_at", { ascending: true }); // oldest approved first

      if (error) {
        pushToast({ variant: "error", title: "Error", message: "Failed to load queue" });
        return;
      }

      if (!apps || apps.length === 0) {
        setApplications([]);
        return;
      }

      const userIds = [...new Set(apps.map((a) => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, { full_name: p.full_name, email: p.email }])
      );

      const enriched: ApprovedApplication[] = apps.map((app) => {
        const profile = profileMap.get(app.user_id);
        return {
          ...app,
          user_full_name: profile?.full_name || "Unknown User",
          user_email: profile?.email || "No email",
        };
      });

      setApplications(enriched);
    } catch (err) {
      pushToast({ variant: "error", title: "Error", message: "Unexpected error" });
    } finally {
      setLoading(false);
    }
  };

  const getAdminId = async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  // Single submit — race-guarded + audit-stamped.
  const handleMarkSubmitted = async (appId: string) => {
    setSubmitting(appId);
    try {
      const adminId = await getAdminId();
      const { data, error } = await supabase
        .from("applications")
        .update({
          status: "submitted",
          submitted_at: new Date().toISOString(),
          submitted_by: adminId,
        })
        .eq("id", appId)
        .eq("status", "approved")            // only approved → submitted
        .select();

      if (error) {
        pushToast({ variant: "error", title: "Error", message: `Failed: ${error.message}` });
        return;
      }
      if (!data || data.length === 0) {
        pushToast({ variant: "warning", title: "Skipped", message: "This application is no longer awaiting submission." });
        setApplications((prev) => prev.filter((a) => a.id !== appId)); // drop stale row
        return;
      }

      setApplications((prev) => prev.filter((a) => a.id !== appId));
      pushToast({ variant: "success", title: "Submitted!", message: "Application marked as submitted." });
    } catch (err: any) {
      pushToast({ variant: "error", title: "Error", message: err.message });
    } finally {
      setSubmitting(null);
    }
  };

  // Bulk submit — scoped to the CURRENTLY FILTERED set (respects the search box),
  // chunked to stay within request limits, race-guarded, audit-stamped.
  const handleSubmitAll = async () => {
    if (filtered.length === 0) return;
    const ok = window.confirm(
      `Mark all ${filtered.length} approved application${filtered.length === 1 ? "" : "s"} as submitted? This cannot be undone.`
    );
    if (!ok) return;

    setSubmittingAll(true);
    try {
      const adminId = await getAdminId();
      const ids = filtered.map((a) => a.id);
      const submittedIds = new Set<string>();

      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const { data, error } = await supabase
          .from("applications")
          .update({
            status: "submitted",
            submitted_at: new Date().toISOString(),
            submitted_by: adminId,
          })
          .in("id", chunk)
          .eq("status", "approved")
          .select("id");

        if (error) {
          pushToast({ variant: "error", title: "Error", message: `Failed partway: ${error.message}` });
          break;
        }
        (data || []).forEach((r: { id: string }) => submittedIds.add(r.id));
      }

      if (submittedIds.size > 0) {
        setApplications((prev) => prev.filter((a) => !submittedIds.has(a.id)));
        pushToast({
          variant: "success",
          title: "Submitted",
          message: `${submittedIds.size} application${submittedIds.size === 1 ? "" : "s"} marked as submitted.`,
        });
      } else {
        pushToast({ variant: "warning", title: "Nothing submitted", message: "No approved applications were updated." });
      }
    } catch (e: any) {
      pushToast({ variant: "error", title: "Error", message: e.message });
    } finally {
      setSubmittingAll(false);
    }
  };

  const filtered = applications.filter((app) =>
    app.company_name.toLowerCase().includes(search.toLowerCase()) ||
    app.job_title.toLowerCase().includes(search.toLowerCase()) ||
    app.user_full_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] dark:text-white">Submission Queue</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {loading ? "Loading..." : `${filtered.length} approved application${filtered.length !== 1 ? "s" : ""} ready to submit`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && filtered.length > 0 && (
            <button
              onClick={handleSubmitAll}
              disabled={submittingAll}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#10B981] rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50"
            >
              <Send size={14} />
              {submittingAll ? "Submitting…" : `Submit All (${filtered.length})`}
            </button>
          )}
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7C3AED] dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Clock size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-blue-800">How to use this queue</p>
          <p className="text-xs text-blue-600 mt-0.5">
            These applications have been reviewed and approved. Open the job URL, submit manually using the user's cover letter, then click "Mark as Submitted".
          </p>
        </div>
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
                <th className="px-6 py-4 text-left text-sm font-semibold">Applicant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Job Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Approved On</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-gray-700">
              {paginated.map((app) => (
                <>
                  <tr key={app.id} className="hover:bg-[#F8FAFC] dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-[#1E293B] dark:text-white">{app.user_full_name}</p>
                        <p className="text-xs text-[#64748B] dark:text-gray-400">{app.user_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-[#1E293B] dark:text-white">{app.company_name}</p>
                        {app.job_url && (
                          <a
                            href={app.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#7C3AED] dark:text-purple-400 hover:underline flex items-center gap-0.5"
                          >
                            Open Job <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B] dark:text-gray-400">{app.job_title}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B] dark:text-gray-400">
                      {format(new Date(app.updated_at || app.created_at), "d MMM yyyy")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)}
                          className="text-xs text-[#7C3AED] hover:underline"
                        >
                          {expandedApp === app.id ? "Hide Letter" : "View Letter"}
                        </button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleMarkSubmitted(app.id)}
                          disabled={submitting === app.id || submittingAll}
                        >
                          {submitting === app.id ? "..." : (
                            <span className="flex items-center gap-1">
                              <CheckCircle size={12} />
                              Mark Submitted
                            </span>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {expandedApp === app.id && (
                    <tr key={`${app.id}-cover`}>
                      <td colSpan={5} className="px-6 py-4 bg-[#F8FAFC] dark:bg-gray-700 border-t border-[#E2E8F0] dark:border-gray-600">
                        <p className="text-xs font-semibold text-[#64748B] dark:text-gray-400 uppercase mb-2">Cover Letter</p>
                        <div className="bg-white dark:bg-gray-800 border border-[#E2E8F0] dark:border-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
                          <p className="text-sm text-[#1E293B] dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {app.cover_letter || "No cover letter available."}
                          </p>
                        </div>
                        {app.admin_notes && (
                          <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">Admin Notes:</p>
                            <p className="text-xs text-yellow-800 dark:text-yellow-300 mt-1">{app.admin_notes}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-[#E2E8F0] dark:border-gray-700 p-12 text-center">
          <div className="w-16 h-16 bg-[#D1FAE5] dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#10B981]" />
          </div>
          <h3 className="text-xl font-semibold text-[#1E293B] dark:text-white mb-2">Queue is empty!</h3>
          <p className="text-sm text-[#64748B] dark:text-gray-400">No approved applications waiting to be submitted.</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#64748B] dark:text-gray-400">Page {currentPage} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-[#E2E8F0] dark:border-gray-600 rounded-lg text-[#64748B] dark:text-gray-400 hover:bg-[#F8FAFC] dark:hover:bg-gray-700 disabled:opacity-40"
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

export default SubmissionQueuePage;