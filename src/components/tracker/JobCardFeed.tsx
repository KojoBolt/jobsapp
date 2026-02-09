import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ExternalLink, Pencil, Trash2, Bot, Search, Briefcase,
  Calendar, DollarSign, MapPin, ChevronDown, User, Mail, Phone,
  StickyNote, ShieldCheck, ClipboardList,
} from "lucide-react";

interface JobApplication {
  id: string;
  company_name: string;
  position_title: string;
  job_url: string | null;
  status: string;
  submission_type: string;
  notes: string | null;
  applied_at: string;
  salary_range?: string | null;
  location?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

interface JobCardFeedProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

const statusConfig: Record<string, { label: string; textClass: string; bgClass: string }> = {
  applied: { label: "Applied", textClass: "text-tracker-applied", bgClass: "bg-tracker-applied-bg" },
  screening: { label: "Screening", textClass: "text-tracker-screening", bgClass: "bg-tracker-screening-bg" },
  interview: { label: "Interview", textClass: "text-tracker-interview", bgClass: "bg-tracker-interview-bg" },
  offer: { label: "Offer", textClass: "text-tracker-offer", bgClass: "bg-tracker-offer-bg" },
  rejected: { label: "Rejected", textClass: "text-tracker-rejected", bgClass: "bg-tracker-rejected-bg" },
  accepted: { label: "Accepted", textClass: "text-tracker-accepted", bgClass: "bg-tracker-accepted-bg" },
  declined: { label: "Declined", textClass: "text-tracker-declined", bgClass: "bg-tracker-declined-bg" },
};

const allStatuses = Object.keys(statusConfig);

const JobCardFeed = ({ applications, onEdit, onDelete }: JobCardFeedProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = applications
    .filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          app.company_name.toLowerCase().includes(q) ||
          app.position_title.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search by company or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full border-white/10 bg-white/5 text-white sm:w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {allStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {statusConfig[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Empty States */}
      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 py-16">
          <Briefcase className="mb-4 h-12 w-12 text-white/30" />
          <p className="text-lg font-medium text-white/80" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            No applications yet
          </p>
          <p className="mt-1 text-sm text-white/50">Click "Add Application" to start tracking your job search</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 py-16">
          <Search className="mb-4 h-12 w-12 text-white/30" />
          <p className="text-lg font-medium text-white/80">No applications found</p>
          <p className="mt-1 text-sm text-white/50">Try adjusting your search or filter</p>
        </div>
      ) : (
        /* Application Cards */
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((app, i) => {
              const cfg = statusConfig[app.status] || statusConfig.applied;
              const hasContact = app.contact_name || app.contact_email || app.contact_phone;
              const hasExtra = hasContact || app.notes;

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="group rounded-2xl bg-white/95 p-5 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--tracker-applied))] to-[hsl(var(--tracker-screening))] text-sm font-bold text-white">
                        {app.company_name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3
                          className="text-lg font-semibold text-gray-900"
                          style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          {app.company_name}
                        </h3>
                      <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">{app.position_title}</span>
                          {app.submission_type === "manual" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                              <ClipboardList className="h-2.5 w-2.5" />
                              Self-Tracked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary animate-pulse">
                              <ShieldCheck className="h-2.5 w-2.5" />
                              JobApp Verified
                            </span>
                          )}
                          {app.submission_type === "ai_discovery" && (
                            <Bot className="h-3.5 w-3.5 text-tracker-screening" aria-label="AI Discovery" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${cfg.bgClass} ${cfg.textClass}`}
                      >
                        {cfg.label}
                      </span>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-gray-800" onClick={() => onEdit(app)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => onDelete(app.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                    {(app as any).salary_range && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {(app as any).salary_range}
                      </span>
                    )}
                    {(app as any).location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {(app as any).location}
                      </span>
                    )}
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-tracker-applied hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {app.submission_type !== "manual" ? "View Submission Proof" : "Job Posting"}
                      </a>
                    )}
                  </div>

                  {/* Collapsible contact/notes */}
                  {hasExtra && (
                    <Collapsible>
                      <CollapsibleTrigger className="mt-3 flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600">
                        <ChevronDown className="h-3 w-3 transition-transform [[data-state=open]>&]:rotate-180" />
                        Contact & Notes
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 space-y-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-600">
                        {hasContact && (
                          <div className="flex flex-wrap gap-4">
                            {(app as any).contact_name && (
                              <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{(app as any).contact_name}</span>
                            )}
                            {(app as any).contact_email && (
                              <a href={`mailto:${(app as any).contact_email}`} className="flex items-center gap-1 text-tracker-applied hover:underline">
                                <Mail className="h-3.5 w-3.5" />{(app as any).contact_email}
                              </a>
                            )}
                            {(app as any).contact_phone && (
                              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{(app as any).contact_phone}</span>
                            )}
                          </div>
                        )}
                        {app.notes && (
                          <div className="flex items-start gap-1">
                            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{app.notes}</span>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default JobCardFeed;
