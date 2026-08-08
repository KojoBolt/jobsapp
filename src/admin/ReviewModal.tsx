import { useEffect, useState } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, Check, Ban } from 'lucide-react';
import {
  T, Avatar, ScoreMeter, GhostButton, ConfirmDialog,
} from '@/admin/ui/system';

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

interface ReviewModalProps {
  application: Application;
  onClose: () => void;
  onApprove: (notes?: string, coverLetter?: string) => void;
  onReject: (notes?: string) => void;
}

const ReviewModal = ({
  application,
  onClose,
  onApprove,
  onReject,
}: ReviewModalProps) => {
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState(application.cover_letter || '');
  const [confirmReject, setConfirmReject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const edited = coverLetterText !== (application.cover_letter || '');

  // Escape closes, but never mid-submit or while the reject dialog is up.
  // The backdrop deliberately does NOT close: this modal holds an editable
  // cover letter, and a stray click outside would discard the edits silently.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting && !confirmReject) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isSubmitting, confirmReject, onClose]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onApprove(reviewerNotes, coverLetterText);
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    await onReject(reviewerNotes);
    setIsSubmitting(false);
    setConfirmReject(false);
  };

  const textarea = `w-full rounded-xl border ${T.hairline} bg-white p-3.5 text-[12.5px] leading-relaxed
                    ${T.ink} resize-none focus:outline-none focus:ring-2 focus:ring-[#2a78d6]/30
                    disabled:opacity-60 dark:bg-[#1A1A19]`;
  const sectionLabel = `text-[10px] font-semibold uppercase tracking-[0.08em] ${T.muted}`;

  return (
    <>
      {/* z-[1900] clears the sticky header (z-[1000]) — at the previous z-50
          the header painted over this modal. */}
      <div className="fixed inset-0 z-[1900] flex items-start justify-center overflow-y-auto bg-black/40 p-0 backdrop-blur-sm sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review application"
          className={`flex h-full w-full flex-col border ${T.hairline} bg-white shadow-2xl
                      dark:bg-[#1A1A19] sm:my-8 sm:h-auto sm:max-h-[88vh] sm:max-w-[900px] sm:rounded-2xl`}
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className={`flex items-center justify-between gap-3 border-b ${T.hairline} px-5 py-3.5`}>
            <div className="min-w-0">
              <h2 className={`text-[15px] font-bold ${T.ink}`}>Review application</h2>
              <p className={`truncate text-[11px] ${T.muted}`}>
                {application.company_name} · {application.job_title}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close"
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${T.hairline} ${T.ink2}
                          transition-colors hover:bg-[#F4F4F2] disabled:opacity-50 dark:hover:bg-white/5`}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Body ────────────────────────────────────────────────────── */}
          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {/* Job info */}
            <div className={`rounded-xl border ${T.hairline} p-4`}>
              <div className="flex items-start gap-3">
                <Avatar name={application.company_name || '?'} size={38} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[15px] font-bold ${T.ink}`}>
                    {application.company_name}
                  </p>
                  <p className={`truncate text-[12.5px] ${T.ink2}`}>{application.job_title}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
                    {application.match_score !== null && (
                      <span className="inline-flex items-center gap-2">
                        <span className={sectionLabel}>Match</span>
                        <ScoreMeter value={application.match_score} />
                      </span>
                    )}
                    {application.job_url && (
                      <a
                        href={application.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#2a78d6] hover:underline dark:text-[#3987e5]"
                      >
                        View job posting <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {application.job_description && (
                <>
                  <button
                    onClick={() => setShowDescription((v) => !v)}
                    className={`mt-3 flex items-center gap-1.5 text-[12px] font-semibold ${T.ink} hover:opacity-70`}
                  >
                    {showDescription ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showDescription ? 'Hide' : 'View'} full description
                  </button>
                  {showDescription && (
                    <div className={`mt-2 max-h-48 overflow-y-auto rounded-xl border ${T.hairline} bg-[#FAFAF8] p-3.5 dark:bg-white/[0.02]`}>
                      <p className={`whitespace-pre-wrap text-[12.5px] leading-relaxed ${T.ink2}`}>
                        {application.job_description}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cover letter */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className={sectionLabel}>Generated cover letter</span>
                <span
                  className={`text-[10.5px] ${
                    edited ? 'font-semibold text-[#2a78d6] dark:text-[#3987e5]' : T.muted
                  }`}
                >
                  {edited ? 'Edited' : 'Editable'}
                </span>
              </div>
              <textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                disabled={isSubmitting}
                className={`${textarea} min-h-[280px]`}
                placeholder="Cover letter content…"
              />
              <div className="mt-1 flex items-center justify-between gap-3">
                <span className={`text-[10.5px] ${T.muted}`}>
                  {edited ? 'Edits are saved when you approve — rejecting discards them.' : ''}
                </span>
                <span className={`shrink-0 text-[10.5px] tabular-nums ${T.muted}`}>
                  {coverLetterText.length} characters
                </span>
              </div>
            </div>

            {/* Reviewer notes */}
            <div>
              <label className={`mb-1.5 block ${sectionLabel}`}>Reviewer notes (optional)</label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                disabled={isSubmitting}
                className={`${textarea} min-h-[90px]`}
                placeholder="Notes about changes made or verification details…"
              />
            </div>

            {/* Previous notes */}
            {application.admin_notes && (
              <div className="rounded-xl border border-[#FAB219]/30 bg-[#FAB219]/10 p-3.5">
                <p className={sectionLabel}>Previous admin notes</p>
                <p className={`mt-1 text-[12.5px] ${T.ink}`}>{application.admin_notes}</p>
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div
            className={`flex flex-col-reverse items-stretch justify-between gap-2 border-t ${T.hairline}
                        bg-[#FAFAF8] px-5 py-3.5 dark:bg-white/[0.02] sm:flex-row sm:items-center`}
          >
            <button
              onClick={() => !isSubmitting && setConfirmReject(true)}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#D03B3B]/40
                         px-3 py-1.5 text-[12px] font-semibold text-[#B32F2F] transition-colors
                         hover:bg-[#D03B3B]/10 disabled:opacity-50 dark:text-[#EF7A7A]"
            >
              <Ban size={13} /> Reject
            </button>

            <div className="flex items-center gap-2 sm:justify-end">
              <GhostButton onClick={() => !isSubmitting && onClose()}>Cancel</GhostButton>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#111110] px-3.5 py-1.5
                           text-[12px] font-semibold text-white transition-opacity hover:opacity-90
                           disabled:opacity-50 dark:bg-white dark:text-[#111110]"
              >
                <Check size={13} />
                {isSubmitting ? 'Working…' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReject}
        busy={isSubmitting}
        destructive
        title="Reject this application?"
        confirmLabel="Reject"
        body={
          <>
            <strong>{application.job_title}</strong> at{' '}
            <strong>{application.company_name}</strong> will be marked as rejected.
            {reviewerNotes
              ? ' Your reviewer notes will be saved with it.'
              : ' No reviewer notes were added — consider explaining why.'}
          </>
        }
        onConfirm={handleReject}
        onCancel={() => setConfirmReject(false)}
      />
    </>
  );
};

export default ReviewModal;
