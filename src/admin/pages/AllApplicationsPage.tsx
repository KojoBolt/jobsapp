import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, X, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import Badge from '../Badge';
import { Button } from '../ui/Button';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Application {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  company_name: string;
  job_title: string;
  job_url: string | null;
  job_description: string | null;
  cover_letter: string | null;
  admin_notes: string | null;
  status: "queued" | "drafting" | "pending_review" | "approved" | "submitted" | "completed" | "failed" | "interview";
  created_at: string;
  updated_at: string;
  campaign_id: string | null;
  match_score: number | null;
}

// ─── View Modal ───────────────────────────────────────────────────────────────
const ViewModal = ({
  app,
  onClose,
}: {
  app: Application;
  onClose: () => void;
}) => {
  const [showDescription, setShowDescription] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="text-lg font-bold text-[#1E293B]">Application Details</h2>
            <p className="text-xs text-[#64748B] mt-0.5">ID: {app.id.slice(0, 16)}...</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <X size={20} className="text-[#64748B]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* User + Job Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Applicant</p>
              <p className="text-sm font-semibold text-[#1E293B]">{app.user_full_name}</p>
              <p className="text-xs text-[#64748B]">{app.user_email}</p>
            </div>
            <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
              <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Status</p>
              <div className="md:flex items-center gap-2 flex-wrap">
                <Badge status={app.status} />
                {app.campaign_id && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">
                    Campaign
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Company + Role */}
          <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#64748B] uppercase mb-1">Position</p>
                <p className="text-base font-bold text-[#1E293B]">{app.job_title}</p>
                <p className="text-sm text-[#64748B]">{app.company_name}</p>
              </div>
              <div className="text-right shrink-0">
                {app.match_score !== null && (
                  <div>
                    <p className="text-xs font-semibold text-[#64748B] uppercase mb-1">Match</p>
                    <p className={`text-xl font-bold ${
                      app.match_score >= 70 ? "text-[#10B981]" :
                      app.match_score >= 40 ? "text-[#F59E0B]" :
                      "text-[#EF4444]"
                    }`}>
                      {app.match_score}%
                    </p>
                  </div>
                )}
              </div>
            </div>
            {app.job_url && (
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-xs text-[#7C3AED] hover:underline"
              >
                View Job Posting <ExternalLink size={11} />
              </a>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase mb-1">Submitted</p>
              <p className="text-sm text-[#1E293B]">{format(new Date(app.created_at), 'MMM d, yyyy HH:mm')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase mb-1">Last Updated</p>
              <p className="text-sm text-[#1E293B]">
                {formatDistanceToNow(new Date(app.updated_at || app.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Job Description (collapsible) */}
          {app.job_description && (
            <div>
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center gap-2 text-sm font-semibold text-[#1E293B] mb-2 hover:text-[#7C3AED] transition-colors"
              >
                {showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                Job Description
              </button>
              {showDescription && (
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 max-h-48 overflow-y-auto">
                  <p className="text-sm text-[#64748B] leading-relaxed whitespace-pre-wrap">
                    {app.job_description}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cover Letter */}
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Cover Letter</p>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 max-h-56 overflow-y-auto">
              <p className="text-sm text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                {app.cover_letter || (
                  <span className="text-[#94A3B8] italic">No cover letter generated yet.</span>
                )}
              </p>
            </div>
          </div>

          {/* Admin Notes */}
          {app.admin_notes && (
            <div>
              <p className="text-xs font-semibold text-[#64748B] uppercase mb-2">Admin Notes</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">{app.admin_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex justify-end">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page
const AllApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const itemsPerPage = 25;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);

        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select('id, user_id, company_name, job_title, job_url, job_description, cover_letter, admin_notes, status, created_at, updated_at, campaign_id, match_score')
          .order('created_at', { ascending: false });

        if (appsError) throw appsError;
        if (!appsData || appsData.length === 0) {
          setApplications([]);
          return;
        }

        const userIds = [...new Set(appsData.map((a) => a.user_id))];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);

        const profileMap = new Map(
          (profilesData || []).map((p) => [
            p.id,
            { full_name: p.full_name || 'Unknown', email: p.email || 'No email' },
          ])
        );

        const merged: Application[] = appsData.map((app) => {
          const profile = profileMap.get(app.user_id);
          return {
            ...app,
            user_email: profile?.email || 'No email',
            user_full_name: profile?.full_name || 'Unknown User',
          };
        });

        setApplications(merged);
      } catch (err) {
        console.error('Error fetching applications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] dark:text-white">All Applications</h1>
          <p className="text-sm text-[#64748B] mt-1">
            {loading ? 'Loading...' : `${filteredApps.length} total application${filteredApps.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by name, company, role..."
            className="w-full h-10 pl-10 pr-4 border border-[#E2E8F0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-sm"
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[#64748B]" />
          <span className="text-sm text-[#64748B]">Status:</span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="h-10 px-3 border border-[#E2E8F0] rounded-md focus:outline-none text-sm text-[#1E293B] bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="drafting">Drafting</option>
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="submitted">Submitted</option>
          <option value="interview">Interview</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        {(searchTerm || statusFilter !== 'all') && (
          <button
            onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentPage(1); }}
            className="text-sm text-[#7C3AED] hover:underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] overflow-hidden dark:bg-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#7C3AED]">
                <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Client</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Job Title</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Match</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Submitted</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Last Updated</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : currentApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#64748B]">
                    No applications found
                  </td>
                </tr>
              ) : (
                currentApps.map((app) => (
                  <tr key={app.id} className="hover:bg-[#F8FAFC] transition-colors dark:hover:bg-gray-700 cursor-pointer" onClick={() => setSelectedApp(app)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#EDE9FE] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-[#7C3AED] text-xs font-bold">
                            {getInitials(app.user_full_name)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#1E293B] dark:text-white">{app.user_full_name}</p>
                          <p className="text-xs text-[#64748B] dark:text-gray-400">{app.user_email}</p>
                          {app.campaign_id && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">
                              Campaign
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#1E293B] dark:text-white">{app.company_name}</td>
                    <td className="px-6 py-4 text-sm text-[#64748B] dark:text-gray-400">{app.job_title}</td>
                    <td className="px-6 py-4">
                      {app.match_score !== null ? (
                        <span className={`text-sm font-bold ${
                          app.match_score >= 70 ? "text-[#10B981]" :
                          app.match_score >= 40 ? "text-[#F59E0B]" :
                          "text-[#EF4444]"
                        }`}>
                          {app.match_score}%
                        </span>
                      ) : (
                        <span className="text-xs text-[#94A3B8]">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge status={app.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {format(new Date(app.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#64748B]">
                      {formatDistanceToNow(new Date(app.updated_at || app.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-6 py-4">
                      {/* Wire View button to open modal */}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye size={14} />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filteredApps.length > 0 && (
          <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <div className="text-sm text-[#64748B]">
              Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredApps.length)} of {filteredApps.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft size={16} /> Previous
              </Button>
              <span className="text-sm text-[#64748B]">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/*  View Modal */}
      {selectedApp && (
        <ViewModal
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
        />
      )}
    </div>
  );
};

export default AllApplicationsPage;