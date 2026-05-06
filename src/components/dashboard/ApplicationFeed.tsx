import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Brain,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import VerifiedHumanBadge from "@/components/dashboard/VerifiedHumanBadge";
import PrepBotSheet from "@/components/dashboard/PrepBotSheet";
import { Application } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const statusVariant: Record<string, "reviewing" | "submitted" | "interview"> = {
  queued: "reviewing",
  drafting: "reviewing",
  pending_review: "reviewing",
  approved: "reviewing",
  submitted: "submitted",
  interview: "interview",
  completed: "submitted",
  failed: "submitted",
};

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
interface DeleteModalProps {
  isOpen: boolean;
  isDeleteAll: boolean;
  companyName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteModal = ({
  isOpen,
  isDeleteAll,
  companyName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md rounded-xl border border-border/50 bg-background p-6 shadow-2xl"
      >
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>

          {/* Text */}
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {isDeleteAll ? "Delete All Applications?" : "Delete Application?"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {isDeleteAll
                ? "This will permanently delete all your applications. This action cannot be undone."
                : `This will permanently delete your application to ${companyName || "this company"}. This action cannot be undone.`}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex w-full gap-3 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1 gap-2"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {isDeleteAll ? "Delete All" : "Delete"}
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
interface ApplicationFeedProps {
  applications: Application[];
  onApplicationDeleted?: () => void;
}

const ApplicationFeed = ({ applications, onApplicationDeleted }: ApplicationFeedProps) => {
  const { user } = useAuth();
  const [localApplications, setLocalApplications] = useState<Application[]>(applications);
  const [currentPage, setCurrentPage] = useState(1);
  const [prepBot, setPrepBot] = useState<{ open: boolean; company: string; role: string }>({
    open: false,
    company: "",
    role: "",
  });

  // Modal state
  const [modal, setModal] = useState<{
    open: boolean;
    isDeleteAll: boolean;
    targetId: string | null;
    companyName: string;
  }>({
    open: false,
    isDeleteAll: false,
    targetId: null,
    companyName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Keep in sync when parent updates
  useEffect(() => {
    setLocalApplications(applications);
  }, [applications]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(localApplications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayed = localApplications.slice(startIndex, endIndex);

  const openPrepBot = (company: string, role: string) => {
    setPrepBot({ open: true, company, role });
  };

  // Open single delete modal
  const confirmDelete = (id: string, companyName: string) => {
    setModal({ open: true, isDeleteAll: false, targetId: id, companyName });
  };

  // Open delete all modal
  const confirmDeleteAll = () => {
    setModal({ open: true, isDeleteAll: true, targetId: null, companyName: "" });
  };

  const closeModal = () => {
    if (!isDeleting) {
      setModal({ open: false, isDeleteAll: false, targetId: null, companyName: "" });
    }
  };

  // Handle single delete
  const handleDelete = async () => {
    if (!modal.targetId || !user) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", modal.targetId)
        .eq("user_id", user.id);

      if (error) throw error;

      const newApps = localApplications.filter((a) => a.id !== modal.targetId);
      setLocalApplications(newApps);

      // If we deleted last item on page, go back
      const newTotalPages = Math.ceil(newApps.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }

      closeModal();
      if (onApplicationDeleted) onApplicationDeleted();
    } catch (error: any) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle delete all
  const handleDeleteAll = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setLocalApplications([]);
      setCurrentPage(1);
      closeModal();
      if (onApplicationDeleted) onApplicationDeleted();
    } catch (error: any) {
      console.error("Delete all error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!localApplications || localApplications.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-lg font-medium text-foreground">No applications yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit your first job application to get started!
        </p>
      </div>
    );
  }

  return (
    <>
      <PrepBotSheet
        open={prepBot.open}
        onOpenChange={(open) => setPrepBot((prev) => ({ ...prev, open }))}
        company={prepBot.company}
        role={prepBot.role}
      />

      {/* Delete Modal */}
      <AnimatePresence>
        {modal.open && (
          <DeleteModal
            isOpen={modal.open}
            isDeleteAll={modal.isDeleteAll}
            companyName={modal.companyName}
            onConfirm={modal.isDeleteAll ? handleDeleteAll : handleDelete}
            onCancel={closeModal}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>

      <div className="glass-card rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Application Feed</h3>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-muted-foreground">
              {localApplications.length} total
            </Badge>
            {/* ✅ Delete All Button */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={confirmDeleteAll}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete All
            </Button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Resume</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((app, i) => (
                <motion.tr
                  key={app.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                  className="border-b border-border/20 transition-colors hover:bg-muted/30"
                >
                  <td className="px-6 py-4">
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                    >
                      {app.company_name || "Unknown Company"}
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <a
                      href={app.job_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {app.job_title || "Unknown Role"}
                      <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
                      {(app.status === "submitted" || app.status === "interview") && (
                        <VerifiedHumanBadge
                          variant={app.status === "interview" ? "emerald" : "gold"}
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="human" className="text-[10px]">
                      {app.resume_id ? `Resume #${app.resume_id.slice(0, 8)}` : "Default"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(app.status === "submitted" || app.status === "interview") && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                openPrepBot(
                                  app.company_name || "Company",
                                  app.job_title || "Role"
                                )
                              }
                            >
                              <Brain className="h-3.5 w-3.5 text-accent" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="text-xs">
                            Open Prep-Bot Intel
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MessageSquare className="h-3.5 w-3.5 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-xs text-sm">
                          <p className="font-medium text-primary">Human Touch Note:</p>
                          <p className="mt-1 text-muted-foreground">No notes available yet</p>
                        </TooltipContent>
                      </Tooltip>
                      <a href={app.job_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </a>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10"
                            onClick={() =>
                              confirmDelete(app.id, app.company_name || "this company")
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs">
                          Delete Application
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="space-y-3 p-4 md:hidden">
          {displayed.map((app, i) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="rounded-lg border border-border/30 bg-muted/20 p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <a
                    href={app.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {app.company_name || "Unknown Company"}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  {(app.status === "submitted" || app.status === "interview") && (
                    <VerifiedHumanBadge
                      variant={app.status === "interview" ? "emerald" : "gold"}
                      size="sm"
                    />
                  )}
                </div>
                <Badge variant={statusVariant[app.status]} className="text-xs">
                  {app.status}
                </Badge>
              </div>
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-2 block text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {app.job_title || "Unknown Role"}
              </a>
              <div className="mb-2">
                <Badge variant="human" className="text-[10px]">
                  {app.resume_id || "Default Resume"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(app.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1">
                  {(app.status === "submitted" || app.status === "interview") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-accent"
                      onClick={() =>
                        openPrepBot(app.company_name || "Company", app.job_title || "Role")
                      }
                    >
                      <Brain className="h-3 w-3" />
                      Prep
                    </Button>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                        <MessageSquare className="h-3 w-3" />
                        Note
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-sm">
                      <p className="font-medium text-primary">Human Touch Note:</p>
                      <p className="mt-1 text-muted-foreground">No notes available yet</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => confirmDelete(app.id, app.company_name || "this company")}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        {localApplications.length > 0 && (
          <div className="border-t border-border/30 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-muted-foreground">
                Showing {startIndex + 1} – {Math.min(endIndex, localApplications.length)} of{" "}
                {localApplications.length}
              </div>
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 text-xs"
                    title="First page"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-3 text-xs"
                  >
                    <ChevronDown className="h-4 w-4 rotate-180" />
                  </Button>
                  <div className="flex flex-wrap items-center gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      if (totalPages <= 5) return i + 1;
                      if (currentPage <= 3) return i + 1;
                      if (currentPage >= totalPages - 2) return totalPages - 4 + i;
                      return currentPage - 2 + i;
                    }).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="h-8 w-8 p-0 text-xs font-medium"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-3 text-xs"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 text-xs"
                    title="Last page"
                  >
                    <ChevronUp className="h-4 w-4 rotate-180" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">
                    Page {currentPage} of {totalPages}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ApplicationFeed;