import { useState } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { Button } from "../ui/Button";
import ReviewModal from "../../admin/ReviewModal";
import { getPendingApplications, Application } from "../data/mockData";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/admin/toast/ToastContext";

const ReviewQueuePage = (): JSX.Element => {
  const [applications, setApplications] = useState<Application[]>(
    getPendingApplications()
  );

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const { pushToast } = useToast();

  const handleApprove = (notes?: string) => {
    if (!selectedApp) return;

    setApplications((apps) => apps.filter((app) => app.id !== selectedApp.id));

    pushToast({
      variant: "success",
      title: "Approved",
      message: "Application approved and submitted successfully!",
    });

    setSelectedApp(null);
  };

  const handleReject = (notes?: string) => {
    if (!selectedApp) return;

    setApplications((apps) => apps.filter((app) => app.id !== selectedApp.id));

    pushToast({
      variant: "warning",
      title: "Rejected",
      message: "Application rejected.",
    });

    setSelectedApp(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1E293B]">Review Queue</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {applications.length} application{applications.length !== 1 ? "s" : ""} pending review
        </p>
      </div>

      {/* Application List */}
      {applications.length > 0 ? (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Left Section */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <div className="text-sm text-[#64748B] mb-1">{app.clientName}</div>
                    <h3 className="text-lg font-semibold text-[#1E293B]">{app.company}</h3>
                    <div className="text-base font-medium text-[#64748B]">{app.jobTitle}</div>
                  </div>

                  <a
                    href={app.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2563EB] hover:underline truncate block max-w-md"
                  >
                    {app.jobUrl}
                  </a>

                  <div className="flex items-center gap-1 text-xs text-[#64748B]">
                    <Clock size={12} />
                    <span>
                      Submitted{" "}
                      {formatDistanceToNow(app.submittedAt, { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                  <Button variant="primary" onClick={() => setSelectedApp(app)}>
                    Review Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-lg shadow-sm border border-[#E2E8F0] p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#D1FAE5] rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-[#10B981]" />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-[#1E293B] mb-2">All caught up!</h3>
          <p className="text-sm text-[#64748B]">No applications waiting for review</p>
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