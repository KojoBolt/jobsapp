import React from 'react';

interface BadgeProps {
  status: 'queued' | 'drafting' | 'pending_review' | 'approved' | 'submitted' | 'completed' | 'failed';
  className?: string;
}

const Badge = ({ status, className = '' }: BadgeProps) => {
  const statusConfig = {
    queued: {
      label: 'Queued',
      classes: 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]',
    },
    drafting: {
      label: 'Drafting',
      classes: 'bg-[#DBEAFE] text-[#2563EB] border-[#93C5FD]',
    },
    pending_review: {
      label: 'Pending Review',
      classes: 'bg-[#FEF3C7] text-[#F59E0B] border-[#FCD34D]',
    },
    approved: {
      label: 'Approved',
      classes: 'bg-[#F3E8FF] text-[#9333EA] border-[#D8B4FE]',
    },
    submitted: {
      label: 'Submitted',
      classes: 'bg-[#DBEAFE] text-[#0284C7] border-[#7DD3FC]',
    },
    completed: {
      label: 'Completed',
      classes: 'bg-[#D1FAE5] text-[#10B981] border-[#6EE7B7]',
    },
    failed: {
      label: 'Failed',
      classes: 'bg-[#FEE2E2] text-[#EF4444] border-[#FCA5A5]',
    },
  };
  
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center h-6 px-3 rounded-full text-xs font-medium border ${config.classes} ${className}`}>
      {config.label}
    </span>
  );
};

export default Badge;