import React, { useState } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, Download, User } from 'lucide-react';
import { Application } from './data/mockData';
import { Button } from './ui/Button';

interface ReviewModalProps {
  application: Application;
  onClose: () => void;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
}

const ReviewModal = ({
  application,
  onClose,
  onApprove,
  onReject,
}: ReviewModalProps) => {
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [showResume, setShowResume] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState(application.coverLetter);
  const [showConfirmReject, setShowConfirmReject] = useState(false);
  
  const handleApprove = () => {
    onApprove(reviewerNotes);
  };
  
  const handleReject = () => {
    if (!showConfirmReject) {
      setShowConfirmReject(true);
    } else {
      onReject(reviewerNotes);
    }
  };
  
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-0 sm:p-4 overflow-y-auto">
        {/* Modal */}
        <div className="bg-white sm:rounded-xl shadow-2xl w-full sm:max-w-[900px] h-full sm:h-auto sm:max-h-[90vh] flex flex-col sm:my-8">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E2E8F0]">
            <h2 className="text-lg sm:text-xl font-bold text-[#1E293B]">Review Application</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F8FAFC] rounded-lg transition-colors"
            >
              <X size={24} className="text-[#64748B]" />
            </button>
          </div>
          
          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="space-y-6">
              {/* Client & Job Info */}
              <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E2E8F0]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-[#64748B]">Client</div>
                    <div className="font-semibold text-[#1E293B]">{application.clientName}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-lg font-semibold text-[#1E293B]">{application.company}</div>
                    <div className="text-base font-medium text-[#64748B]">{application.jobTitle}</div>
                  </div>
                  <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-[#2563EB] hover:underline">href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-[#2563EB] hover:underline"

                    View Job Posting
                    <ExternalLink size={14} />
                  </a>
                </div>
                
                {/* Job Description Expandable */}
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center gap-2 mt-3 text-sm text-[#2563EB] hover:underline"
                >
                  {showDescription ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showDescription ? 'Hide' : 'View'} Full Description
                </button>
                {showDescription && (
                  <div className="mt-3 p-3 bg-white rounded-md text-sm text-[#64748B] leading-relaxed">
                    {application.jobDescription}
                  </div>
                )}
              </div>
              
              {/* Resume Section */}
              <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowResume(!showResume)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors"
                >
                  <h3 className="text-base font-semibold text-[#1E293B]">Client's Resume</h3>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="gap-1" onClick={(e) => e.stopPropagation()}>
                      <Download size={14} />
                      Download PDF
                    </Button>
                    {showResume ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>
                {showResume && (
                  <div className="p-4 bg-white max-h-64 overflow-y-auto">
                    <pre className="text-sm text-[#64748B] whitespace-pre-wrap font-sans leading-relaxed">
                      {application.resume}
                    </pre>
                  </div>
                )}
              </div>
              
              {/* Cover Letter Section */}
              <div>
                <h3 className="text-base font-semibold text-[#1E293B] mb-2">Generated Cover Letter</h3>
                <textarea
                  value={coverLetterText}
                  onChange={(e) => setCoverLetterText(e.target.value)}
                  className="w-full min-h-[300px] p-4 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm text-[#1E293B] leading-relaxed resize-none"
                  placeholder="Cover letter content..."
                />
                <div className="text-xs text-[#64748B] mt-1 text-right">
                  {coverLetterText.length} characters
                </div>
              </div>
              
              {/* Notes Section */}
              <div>
                <h3 className="text-base font-semibold text-[#1E293B] mb-2">Reviewer Notes (Optional)</h3>
                <textarea
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  className="w-full min-h-[100px] p-4 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-sm text-[#1E293B] leading-relaxed resize-none"
                  placeholder="Add any notes about changes made or verification details..."
                />
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-4 sm:px-6 py-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline-danger"
                onClick={handleReject}
                className="flex-1 sm:flex-none"
              >
                {showConfirmReject ? 'Confirm Reject' : 'Reject'}
              </Button>
              {showConfirmReject && (
                <span className="text-xs sm:text-sm text-[#EF4444]">Click again</span>
              )}
            </div>
            <Button
              variant="success"
              onClick={handleApprove}
              className="flex-1 sm:flex-none"
            >
              Approve & Submit
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReviewModal;