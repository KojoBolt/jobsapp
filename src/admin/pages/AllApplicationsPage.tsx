import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Eye, X, ExternalLink, ChevronDown, ChevronUp, Inbox, AlertTriangle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  T, Panel, Th, Avatar, StatusPill, ScoreMeter, SearchInput,
  PrimaryButton, GhostButton, Pagination, EmptyState,
} from '@/admin/ui/system';
import {
  useRegisterExport, useAdminActions, RANGE_LABEL,
} from '@/admin/context/AdminActionsContext';

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
  // Mirrors the app_status enum exactly — "interview" belongs to the job
  // tracker's vocabulary, not this table, and querying it is a 22P02 error.
  status: "queued" | "drafting" | "pending_review" | "approved" | "submitted" | "completed" | "failed";
  created_at: string;
  updated_at: string;
  campaign_id: string | null;
  match_score: number | null;
}

const STATUSES = [
  'all', 'queued', 'drafting', 'pending_review',
  'approved', 'submitted', 'completed', 'failed',
] as const;

const label = (s: string) =>
  s === 'all' ? 'All statuses' : s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ─── Detail modal ────────────────────────────────────────────────────────── */

const Field = ({ label: l, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`}>{l}</p>
    {children}
  </div>
);

const ViewModal = ({ app, onClose }: { app: Application; onClose: () => void }) => {
  const [showDescription, setShowDescription] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`my-8 w-full max-w-2xl overflow-hidden rounded-2xl border ${T.hairline}
                    bg-white shadow-2xl dark:bg-[#1A1A19]`}
      >
        <div className={`flex items-center justify-between border-b ${T.hairline} px-5 py-3.5`}>
          <div className="min-w-0">
            <h2 className={`text-[15px] font-bold ${T.ink}`}>Application details</h2>
            <p className={`truncate text-[11px] ${T.muted}`}>ID {app.id.slice(0, 18)}…</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                        transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[72vh] space-y-5 overflow-y-auto px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`rounded-xl border ${T.hairline} p-3.5`}>
              <Field label="Applicant">
                <div className="flex items-center gap-2.5">
                  <Avatar name={app.user_full_name} size={30} />
                  <div className="min-w-0">
                    <p className={`truncate text-[13px] font-semibold ${T.ink}`}>{app.user_full_name}</p>
                    <p className={`truncate text-[11px] ${T.muted}`}>{app.user_email}</p>
                  </div>
                </div>
              </Field>
            </div>
            <div className={`rounded-xl border ${T.hairline} p-3.5`}>
              <Field label="Status">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={app.status} />
                  {app.campaign_id && (
                    <span className={`rounded-md border ${T.hairline} px-1.5 py-0.5 text-[10px] font-medium ${T.ink2}`}>
                      Campaign
                    </span>
                  )}
                </div>
              </Field>
            </div>
          </div>

          <div className={`rounded-xl border ${T.hairline} p-3.5`}>
            <div className="flex items-start justify-between gap-4">
              <Field label="Position">
                <p className={`text-[15px] font-bold ${T.ink}`}>{app.job_title}</p>
                <p className={`text-[12.5px] ${T.ink2}`}>{app.company_name}</p>
              </Field>
              {app.match_score !== null && (
                <div className="shrink-0 text-right">
                  <Field label="Match"><ScoreMeter value={app.match_score} /></Field>
                </div>
              )}
            </div>
            {app.job_url && (
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#2a78d6] hover:underline dark:text-[#3987e5]"
              >
                View job posting <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Submitted">
              <p className={`text-[12.5px] ${T.ink}`}>
                {format(new Date(app.created_at), 'MMM d, yyyy HH:mm')}
              </p>
            </Field>
            <Field label="Last updated">
              <p className={`text-[12.5px] ${T.ink}`}>
                {formatDistanceToNow(new Date(app.updated_at || app.created_at), { addSuffix: true })}
              </p>
            </Field>
          </div>

          {app.job_description && (
            <div>
              <button
                onClick={() => setShowDescription((v) => !v)}
                className={`mb-2 flex items-center gap-1.5 text-[12px] font-semibold ${T.ink} hover:opacity-70`}
              >
                {showDescription ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                Job description
              </button>
              {showDescription && (
                <div className={`max-h-48 overflow-y-auto rounded-xl border ${T.hairline} bg-[#FAFAF8] p-3.5 dark:bg-white/[0.02]`}>
                  <p className={`whitespace-pre-wrap text-[12.5px] leading-relaxed ${T.ink2}`}>
                    {app.job_description}
                  </p>
                </div>
              )}
            </div>
          )}

          <Field label="Cover letter">
            <div className={`max-h-56 overflow-y-auto rounded-xl border ${T.hairline} bg-[#FAFAF8] p-3.5 dark:bg-white/[0.02]`}>
              <p className={`whitespace-pre-wrap text-[12.5px] leading-relaxed ${T.ink}`}>
                {app.cover_letter || (
                  <span className={`italic ${T.muted}`}>No cover letter generated yet.</span>
                )}
              </p>
            </div>
          </Field>

          {app.admin_notes && (
            <Field label="Admin notes">
              <div className="rounded-xl border border-[#FAB219]/30 bg-[#FAB219]/10 p-3.5">
                <p className={`text-[12.5px] ${T.ink}`}>{app.admin_notes}</p>
              </div>
            </Field>
          )}
        </div>

        <div className={`flex justify-end border-t ${T.hairline} px-5 py-3`}>
          <GhostButton onClick={onClose}>Close</GhostButton>
        </div>
      </div>
    </div>
  );
};

/* ─── Page ────────────────────────────────────────────────────────────────── */

const csvCell = (v: unknown) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const AllApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const itemsPerPage = 25;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        setLoadError(null);

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
          ]),
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
      } catch (err: any) {
        console.error('[AllApplications] fetch failed:', err);
        setLoadError(err?.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const { inRange, range } = useAdminActions();

  const filteredApps = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return applications.filter((app) => {
      const matchesSearch =
        app.user_email.toLowerCase().includes(q) ||
        app.user_full_name.toLowerCase().includes(q) ||
        app.company_name.toLowerCase().includes(q) ||
        app.job_title.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      return matchesSearch && matchesStatus && inRange(app.created_at);
    });
  }, [applications, searchTerm, statusFilter, inRange]);

  const totalPages = Math.ceil(filteredApps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  // Exports what's on screen — filters included — not the whole table.
  const exportCsv = useCallback(() => {
    const header = ['Applicant', 'Email', 'Company', 'Job title', 'Match', 'Status', 'Submitted'];
    const rows = filteredApps.map((a) => [
      a.user_full_name, a.user_email, a.company_name, a.job_title,
      a.match_score ?? '', a.status, format(new Date(a.created_at), 'yyyy-MM-dd'),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredApps]);

  useRegisterExport(exportCsv);

  const hasFilters = searchTerm !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>All Applications</h1>
          <p className={`text-[12px] ${T.muted}`}>
            {loading
              ? 'Loading…'
              : `${filteredApps.length} application${filteredApps.length !== 1 ? 's' : ''}${
                  hasFilters || range !== 'all' ? ` of ${applications.length}` : ''
                }`}
            {range !== 'all' && !loading && (
              <> · {RANGE_LABEL[range].toLowerCase()}</>
            )}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <SearchInput
            value={searchTerm}
            onChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
            placeholder="Name, company, role…"
            className="w-full sm:w-64"
          />

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className={`min-w-0 flex-1 rounded-lg border ${T.hairline} bg-white px-2.5 py-1.5 text-[12px]
                        font-medium ${T.ink2} focus:outline-none focus:ring-2
                        focus:ring-[#2a78d6]/30 dark:bg-[#1A1A19] sm:flex-none`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{label(s)}</option>
            ))}
          </select>

          {hasFilters && (
            <GhostButton
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCurrentPage(1); }}
            >
              Clear
            </GhostButton>
          )}
        </div>
      </div>

      {/* ── Mobile: one card per application ────────────────────────────── */}
      <div className="space-y-3 md:hidden">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Panel key={i} className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 animate-pulse rounded-full bg-[#EFEFEC] dark:bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                  <div className="h-3 w-44 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                </div>
              </div>
            </Panel>
          ))
        ) : currentApps.length > 0 ? (
          currentApps.map((app) => (
            <Panel key={app.id} className="overflow-hidden">
              <button
                onClick={() => setSelectedApp(app)}
                className={`w-full text-left transition-colors ${T.hover}`}
              >
                <div className="flex items-start gap-3 p-4">
                  <Avatar name={app.user_full_name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[14px] font-bold ${T.ink}`}>
                      {app.user_full_name}
                    </p>
                    <p className={`truncate text-[12px] ${T.muted}`}>{app.user_email}</p>
                  </div>
                  {app.campaign_id && (
                    <span className={`shrink-0 rounded-md border ${T.hairline} px-1.5 py-0.5 text-[9.5px] font-medium ${T.muted}`}>
                      Campaign
                    </span>
                  )}
                </div>

                <div className={`space-y-3 border-t ${T.hairline} p-4`}>
                  <div>
                    <p className={`text-[13px] font-semibold ${T.ink}`}>{app.company_name}</p>
                    <p className={`text-[12px] ${T.ink2}`}>{app.job_title}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <StatusPill status={app.status} />
                    <ScoreMeter value={app.match_score} />
                  </div>
                </div>

                <div className={`flex items-center justify-between gap-3 border-t ${T.hairline} px-4 py-3`}>
                  <span className={`text-[11.5px] ${T.muted}`}>
                    {format(new Date(app.created_at), 'd MMM yyyy')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#111110] px-3 py-1.5
                                   text-[12px] font-semibold text-white dark:bg-white dark:text-[#111110]">
                    <Eye size={13} /> View
                  </span>
                </div>
              </button>
            </Panel>
          ))
        ) : (
          <Panel>
            {loadError ? (
              <EmptyState icon={AlertTriangle} title="Couldn't load applications" hint={loadError} />
            ) : (
              <EmptyState
                icon={Inbox}
                title={hasFilters ? 'No matches' : 'No applications yet'}
                hint={
                  hasFilters
                    ? 'Try a different search or status filter.'
                    : 'Applications appear here once users deploy.'
                }
              />
            )}
          </Panel>
        )}

        {!loading && filteredApps.length > 0 && (
          <div className="pt-1">
            <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* ── Desktop: table ──────────────────────────────────────────────── */}
      <Panel className="hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px]">
            <thead className={`border-b ${T.hairline} bg-[#FAFAF8] dark:bg-white/[0.02]`}>
              <tr>
                <Th>Client</Th>
                <Th>Company</Th>
                <Th>Job title</Th>
                <Th>Match</Th>
                <Th>Status</Th>
                <Th>Submitted</Th>
                <Th>Updated</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className={`divide-y ${T.divide}`}>
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-5 py-3.5">
                        <div className="h-3.5 animate-pulse rounded bg-[#EFEFEC] dark:bg-white/10" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : currentApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    {loadError ? (
                      <EmptyState
                        icon={AlertTriangle}
                        title="Couldn't load applications"
                        hint={loadError}
                      />
                    ) : (
                      <EmptyState
                        icon={Inbox}
                        title={hasFilters ? 'No matches' : 'No applications yet'}
                        hint={
                          hasFilters
                            ? 'Try a different search or status filter.'
                            : 'Applications appear here once users deploy.'
                        }
                      />
                    )}
                  </td>
                </tr>
              ) : (
                currentApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`cursor-pointer transition-colors ${T.hover}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={app.user_full_name} />
                        <div className="min-w-0">
                          <p className={`truncate text-[13px] font-semibold ${T.ink}`}>
                            {app.user_full_name}
                          </p>
                          <p className={`truncate text-[11px] ${T.muted}`}>{app.user_email}</p>
                        </div>
                        {app.campaign_id && (
                          <span className={`shrink-0 rounded-md border ${T.hairline} px-1.5 py-0.5 text-[9.5px] font-medium ${T.muted}`}>
                            Campaign
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`px-5 py-3.5 text-[12.5px] font-semibold ${T.ink}`}>
                      {app.company_name}
                    </td>
                    <td className={`px-5 py-3.5 text-[12.5px] ${T.ink2}`}>{app.job_title}</td>
                    <td className="px-5 py-3.5"><ScoreMeter value={app.match_score} /></td>
                    <td className="px-5 py-3.5"><StatusPill status={app.status} /></td>
                    <td className={`px-5 py-3.5 text-[12px] tabular-nums ${T.ink2}`}>
                      {format(new Date(app.created_at), 'd MMM yyyy')}
                    </td>
                    <td className={`px-5 py-3.5 text-[12px] ${T.muted}`}>
                      {formatDistanceToNow(new Date(app.updated_at || app.created_at), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <PrimaryButton onClick={() => setSelectedApp(app)}>
                        <Eye size={13} /> View
                      </PrimaryButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredApps.length > 0 && (
          <div className={`border-t ${T.hairline} px-5 py-3`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={`hidden text-[12px] sm:block ${T.muted}`}>
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredApps.length)} of{' '}
                {filteredApps.length}
              </p>
              <Pagination page={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
            </div>
          </div>
        )}
      </Panel>

      {selectedApp && <ViewModal app={selectedApp} onClose={() => setSelectedApp(null)} />}
    </div>
  );
};

export default AllApplicationsPage;
