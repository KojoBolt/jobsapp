import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Pencil, Trash2, Bot, Link2 } from "lucide-react";

interface JobApplication {
  id: string;
  company_name: string;
  position_title: string;
  job_url: string | null;
  status: string;
  submission_type: string;
  notes: string | null;
  applied_at: string;
}

interface JobCardFeedProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  screening: "bg-status-reviewing/20 text-status-reviewing border-status-reviewing/30",
  applied: "bg-status-submitted/20 text-status-submitted border-status-submitted/30",
  interview: "bg-status-interview/20 text-status-interview border-status-interview/30",
  offer: "bg-gold/20 text-gold border-gold/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

const JobCardFeed = ({ applications, onEdit, onDelete }: JobCardFeedProps) => {
  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 py-16">
        <p className="text-lg font-medium text-muted-foreground">No applications yet</p>
        <p className="text-sm text-muted-foreground/70">Click "Add Application" to start tracking</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {applications.map((app, i) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: i * 0.04 }}
            className="glass-card group flex items-center justify-between rounded-xl p-4 transition-colors hover:border-primary/20"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {app.company_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{app.position_title}</h3>
                  {app.submission_type === "ai_discovery" && (
                    <Bot className="h-3.5 w-3.5 text-primary" aria-label="AI Discovery" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{app.company_name}</span>
                  {app.job_url && (
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-xs">{new Date(app.applied_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className={`capitalize ${statusColors[app.status] || ""}`}>
                {app.status}
              </Badge>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(app)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(app.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default JobCardFeed;
