import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquare, ChevronDown, ChevronUp, Brain } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import VerifiedHumanBadge from "@/components/dashboard/VerifiedHumanBadge";
import PrepBotSheet from "@/components/dashboard/PrepBotSheet";
import {Application} from "@/hooks/useDashboardData"


// export interface Application {
//   id: string;
//   company_name: string;  // Changed from 'company'
//   job_title: string;     // Changed from 'role'
//   job_url: string;       // Changed from 'link'
//   status: 'queued' | 'drafting' | 'pending_review' | 'approved' | 'submitted' | 'interview' | 'completed' | 'failed';
//   created_at: string;    // Changed from 'date'
//   human_note?: string;
//   resume_used?: string;
// }

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

interface ApplicationFeedProps {
  applications: Application[];
}

const ApplicationFeed = ({ applications }: ApplicationFeedProps) => {
  const [showAll, setShowAll] = useState(false);
  const [prepBot, setPrepBot] = useState<{ open: boolean; company: string; role: string }>({
    open: false,
    company: "",
    role: "",
  });

 if (!applications || applications.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center">
        <p className="text-lg font-medium text-foreground">No applications yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Submit your first job application to get started!
        </p>
      </div>
    );
  }

  const displayed = showAll ? applications : applications.slice(0, 8);

  const openPrepBot = (company: string, role: string) => {
    setPrepBot({ open: true, company, role });
  };

  return (
    <>
      <PrepBotSheet
        open={prepBot.open}
        onOpenChange={(open) => setPrepBot((prev) => ({ ...prev, open }))}
        company={prepBot.company}
        role={prepBot.role}
      />

      <div className="glass-card rounded-xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Application Feed</h3>
          <Badge variant="outline" className="text-muted-foreground">
            {applications.length} total
          </Badge>
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
                      {app.company_name || 'Unknown Company'}
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
                      {app.job_title || 'Unknown Role'}
                      <ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
                      {(app.status === "submitted" || app.status === "interview") && (
                        <VerifiedHumanBadge variant={app.status === "interview" ? "emerald" : "gold"} />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="human" className="text-[10px]">
                      {app.resume_id ? `Resume #${app.resume_id.slice(0, 8)}` : 'Default'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
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
                              onClick={() => openPrepBot(app.company_name || 'Company', app.job_title || 'Role')}
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
                          <p className="mt-1 text-muted-foreground">
                            No notes available yet
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      <a href={app.job_url} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </a>
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
                    {app.company_name || 'Unknown Company'}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                  {(app.status === "submitted" || app.status === "interview") && (
                    <VerifiedHumanBadge variant={app.status === "interview" ? "emerald" : "gold"} size="sm" />
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
                {app.job_title || 'Unknown Role'}
              </a>
              <div className="mb-2">
                <Badge variant="human" className="text-[10px]">{app.resume_id || 'Default Resume'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  {(app.status === "submitted" || app.status === "interview") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-accent"
                      onClick={() => openPrepBot(app.company_name || 'Company', app.job_title || 'Role')}
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
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Show More */}
        {applications.length > 8 && (
          <div className="border-t border-border/30 p-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="gap-1 text-xs text-muted-foreground"
            >
              {showAll ? (
                <>Show Less <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>Show All ({applications.length}) <ChevronDown className="h-3 w-3" /></>
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default ApplicationFeed;
