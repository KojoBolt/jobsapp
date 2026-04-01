// import React, { useState } from 'react';
// import { X, ExternalLink, ChevronDown, ChevronUp, Download, User } from 'lucide-react';
// import { Button } from './ui/Button';

// // Real type matching DB schema
// interface Application {
//   id: string;
//   user_id: string;
//   company_name: string;
//   job_title: string;
//   job_url: string | null;
//   job_description: string | null;
//   cover_letter: string | null;
//   status: string;
//   admin_notes: string | null;
//   created_at: string;
//   campaign_id: string | null;
//   match_score: number | null;
// }

// interface ReviewModalProps {
//   application: Application;
//   onClose: () => void;
//   onApprove: (notes?: string) => void;
//   onReject: (notes?: string) => void;
// }

// const ReviewModal = ({
//   application,
//   onClose,
//   onApprove,
//   onReject,
// }: ReviewModalProps) => {
//   const [reviewerNotes, setReviewerNotes] = useState('');
//   const [showDescription, setShowDescription] = useState(false);
//   const [coverLetterText, setCoverLetterText] = useState(
//     application.cover_letter || '' // ✅ fixed field name
//   );
//   const [showConfirmReject, setShowConfirmReject] = useState(false);

//   const handleApprove = () => {
//     onApprove(reviewerNotes);
//   };

//   const handleReject = () => {
//     if (!showConfirmReject) {
//       setShowConfirmReject(true);
//     } else {
//       onReject(reviewerNotes);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
//       <div className="bg-white sm:rounded-xl shadow-2xl w-full sm:max-w-[900px] h-full sm:h-auto sm:max-h-[90vh] flex flex-col sm:my-8">
        
//         {/* Header */}
//         <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E2E8F0]">
//           <h2 className="text-lg sm:text-xl font-bold text-[#1E293B]">Review Application</h2>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
//           >
//             <X size={24} className="text-[#64748B]" />
//           </button>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
//           <div className="space-y-6">

//             {/* Job Info */}
//             <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
//               <div className="flex items-start gap-3 mb-3">
//                 <div className="w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center flex-shrink-0">
//                   <User size={20} className="text-white" />
//                 </div>
//                 <div>
//                   {/*  Fixed field names */}
//                   <div className="text-lg font-semibold text-[#1E293B]">
//                     {application.company_name}
//                   </div>
//                   <div className="text-base font-medium text-[#64748B]">
//                     {application.job_title}
//                   </div>
//                 </div>
//               </div>

//               {application.job_url && (
//                 <a
//                   href={application.job_url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline"
//                 >
//                   View Job Posting
//                   <ExternalLink size={14} />
//                 </a>
//               )}

//               {/* Match Score */}
//               {application.match_score !== null && (
//                 <div className="mt-2 text-xs text-[#64748B]">
//                   Match Score:{" "}
//                   <span className="font-semibold text-[#2563EB]">
//                     {application.match_score}%
//                   </span>
//                 </div>
//               )}

//               {/* Job Description */}
//               {application.job_description && (
//                 <>
//                   <button
//                     onClick={() => setShowDescription(!showDescription)}
//                     className="flex items-center gap-2 mt-3 text-sm text-[#2563EB] hover:underline"
//                   >
//                     {showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//                     {showDescription ? "Hide" : "View"} Full Description
//                   </button>
//                   {showDescription && (
//                     <div className="mt-3 p-3 bg-white rounded-md text-sm text-[#64748B] leading-relaxed">
//                       {application.job_description}
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>

//             {/* Cover Letter */}
//             <div>
//               <h3 className="text-base font-semibold text-[#1E293B] mb-2">
//                 Generated Cover Letter
//               </h3>
//               <textarea
//                 value={coverLetterText}
//                 onChange={(e) => setCoverLetterText(e.target.value)}
//                 className="w-full min-h-[300px] p-4 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm text-[#1E293B] leading-relaxed resize-none"
//                 placeholder="Cover letter content..."
//               />
//               <div className="text-xs text-[#64748B] mt-1 text-right">
//                 {coverLetterText.length} characters
//               </div>
//             </div>

//             {/* Reviewer Notes */}
//             <div>
//               <h3 className="text-base font-semibold text-[#1E293B] mb-2">
//                 Reviewer Notes (Optional)
//               </h3>
//               <textarea
//                 value={reviewerNotes}
//                 onChange={(e) => setReviewerNotes(e.target.value)}
//                 className="w-full min-h-[100px] p-4 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm text-[#1E293B] leading-relaxed resize-none"
//                 placeholder="Add any notes about changes made or verification details..."
//               />
//             </div>

//             {/* Existing Admin Notes */}
//             {application.admin_notes && (
//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                 <p className="text-xs font-semibold text-yellow-700 mb-1">
//                   Previous Admin Notes:
//                 </p>
//                 <p className="text-sm text-yellow-800">{application.admin_notes}</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
//           <div className="flex items-center gap-3">
//             <Button
//               variant="outline-danger"
//               onClick={handleReject}
//               className="flex-1 sm:flex-none"
//             >
//               {showConfirmReject ? "Confirm Reject" : "Reject"}
//             </Button>
//             {showConfirmReject && (
//               <span className="text-xs sm:text-sm text-[#EF4444]">Click again to confirm</span>
//             )}
//           </div>
//           <Button
//             variant="success"
//             onClick={handleApprove}
//             className="flex-1 sm:flex-none"
//           >
//             Approve & Submit
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ReviewModal;

import React, { useState } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Button } from './ui/Button';

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
  onApprove: (notes?: string, coverLetter?: string) => void; // ✅ fixed signature
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
  const [coverLetterText, setCoverLetterText] = useState(
    application.cover_letter || ''
  );
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    await onApprove(reviewerNotes, coverLetterText); // ✅ pass cover letter
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!showConfirmReject) {
      setShowConfirmReject(true);
      return;
    }
    setIsSubmitting(true);
    await onReject(reviewerNotes);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white sm:rounded-xl shadow-2xl w-full sm:max-w-[900px] h-full sm:h-auto sm:max-h-[90vh] flex flex-col sm:my-8">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-lg sm:text-xl font-bold text-[#1E293B]">Review Application</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
          >
            <X size={24} className="text-[#64748B]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="space-y-6">

            {/* Job Info */}
            <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-[#1E293B]">
                    {application.company_name}
                  </div>
                  <div className="text-base font-medium text-[#64748B]">
                    {application.job_title}
                  </div>
                </div>
              </div>

              {application.job_url && (
                <a
                  href={application.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline"
                >
                  View Job Posting
                  <ExternalLink size={14} />
                </a>
              )}

              {application.match_score !== null && (
                <div className="mt-2 text-xs text-[#64748B]">
                  Match Score:{" "}
                  <span className={`font-semibold ${
                    application.match_score >= 70 ? "text-[#10B981]" :
                    application.match_score >= 40 ? "text-[#F59E0B]" :
                    "text-[#EF4444]"
                  }`}>
                    {application.match_score}%
                  </span>
                </div>
              )}

              {application.job_description && (
                <>
                  <button
                    onClick={() => setShowDescription(!showDescription)}
                    className="flex items-center gap-2 mt-3 text-sm text-[#2563EB] hover:underline"
                  >
                    {showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showDescription ? "Hide" : "View"} Full Description
                  </button>
                  {showDescription && (
                    <div className="mt-3 p-3 bg-white rounded-md text-sm text-[#64748B] leading-relaxed max-h-48 overflow-y-auto">
                      {application.job_description}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Cover Letter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-[#1E293B]">
                  Generated Cover Letter
                </h3>
                <span className="text-xs text-[#64748B]">Editable</span>
              </div>
              <textarea
                value={coverLetterText}
                onChange={(e) => setCoverLetterText(e.target.value)}
                disabled={isSubmitting}
                className="w-full min-h-[300px] p-4 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm text-[#1E293B] leading-relaxed resize-none disabled:opacity-60"
                placeholder="Cover letter content..."
              />
              <div className="text-xs text-[#64748B] mt-1 text-right">
                {coverLetterText.length} characters
              </div>
            </div>

            {/* Reviewer Notes */}
            <div>
              <h3 className="text-base font-semibold text-[#1E293B] mb-2">
                Reviewer Notes (Optional)
              </h3>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                disabled={isSubmitting}
                className="w-full min-h-[100px] p-4 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm text-[#1E293B] leading-relaxed resize-none disabled:opacity-60"
                placeholder="Add any notes about changes made or verification details..."
              />
            </div>

            {/* Previous Admin Notes */}
            {application.admin_notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-yellow-700 mb-1">
                  Previous Admin Notes:
                </p>
                <p className="text-sm text-yellow-800">{application.admin_notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline-danger"
              onClick={handleReject}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              {isSubmitting ? "Processing..." : showConfirmReject ? "Confirm Reject" : "Reject"}
            </Button>
            {showConfirmReject && !isSubmitting && (
              <span className="text-xs sm:text-sm text-[#EF4444]">Click again to confirm</span>
            )}
          </div>
          <Button
            variant="success"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? "Processing..." : "Approve & Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;