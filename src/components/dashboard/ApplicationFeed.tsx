import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Application {
  id: string;
  company: string;
  role: string;
  link: string;
  status: "Reviewing" | "Submitted" | "Interview";
  date: string;
  humanNote: string;
}

const sampleApplications: Application[] = [
  { id: "1", company: "Google", role: "Senior Software Engineer", link: "#", status: "Interview", date: "Feb 5, 2026", humanNote: "Highlighted your distributed systems experience from your last role. Emphasized leadership in paragraph 2." },
  { id: "2", company: "Stripe", role: "Full Stack Engineer", link: "#", status: "Submitted", date: "Feb 4, 2026", humanNote: "Personalized paragraph 2 to highlight your SQL and payments experience. Added fintech keywords." },
  { id: "3", company: "Meta", role: "Product Engineer", link: "#", status: "Submitted", date: "Feb 4, 2026", humanNote: "Focused on your React expertise and scale. Referenced Meta's infrastructure blog in closing." },
  { id: "4", company: "Notion", role: "Frontend Engineer", link: "#", status: "Reviewing", date: "Feb 3, 2026", humanNote: "Emphasized your passion for productivity tools and collaborative editing experience." },
  { id: "5", company: "Vercel", role: "Developer Experience", link: "#", status: "Interview", date: "Feb 3, 2026", humanNote: "Connected your open-source contributions to their developer platform mission." },
  { id: "6", company: "Linear", role: "Software Engineer", link: "#", status: "Submitted", date: "Feb 2, 2026", humanNote: "Highlighted your experience with real-time collaboration and WebSocket systems." },
  { id: "7", company: "Figma", role: "Systems Engineer", link: "#", status: "Submitted", date: "Feb 2, 2026", humanNote: "Focused on your C++ background and performance optimization case studies." },
  { id: "8", company: "Datadog", role: "Backend Engineer", link: "#", status: "Reviewing", date: "Feb 1, 2026", humanNote: "Tailored to their observability stack. Mentioned your monitoring pipeline project." },
  { id: "9", company: "Plaid", role: "API Engineer", link: "#", status: "Submitted", date: "Feb 1, 2026", humanNote: "Emphasized API design patterns and your experience with financial data integrations." },
  { id: "10", company: "Airbnb", role: "Staff Engineer", link: "#", status: "Interview", date: "Jan 31, 2026", humanNote: "Highlighted your microservices migration leadership and system design expertise." },
  { id: "11", company: "Coinbase", role: "Security Engineer", link: "#", status: "Submitted", date: "Jan 30, 2026", humanNote: "Focused on your cryptography background and secure architecture experience." },
  { id: "12", company: "Shopify", role: "Full Stack Developer", link: "#", status: "Reviewing", date: "Jan 30, 2026", humanNote: "Connected your e-commerce side projects to their merchant platform mission." },
];

const statusVariant: Record<string, "reviewing" | "submitted" | "interview"> = {
  Reviewing: "reviewing",
  Submitted: "submitted",
  Interview: "interview",
};

const ApplicationFeed = () => {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? sampleApplications : sampleApplications.slice(0, 8);

  return (
    <div className="glass-card rounded-xl">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <h3 className="text-sm font-semibold text-foreground">Application Feed</h3>
        <Badge variant="outline" className="text-muted-foreground">
          {sampleApplications.length} total
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
                  <span className="text-sm font-medium text-foreground">{app.company}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{app.role}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant={statusVariant[app.status]}>{app.status}</Badge>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-muted-foreground">{app.date}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-xs text-sm">
                        <p className="font-medium text-primary">Human Touch Note:</p>
                        <p className="mt-1 text-muted-foreground">{app.humanNote}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
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
              <span className="font-medium text-foreground">{app.company}</span>
              <Badge variant={statusVariant[app.status]} className="text-xs">
                {app.status}
              </Badge>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">{app.role}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{app.date}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
                    <MessageSquare className="h-3 w-3" />
                    Human Note
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-sm">
                  <p className="font-medium text-primary">Human Touch Note:</p>
                  <p className="mt-1 text-muted-foreground">{app.humanNote}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Show More */}
      {sampleApplications.length > 8 && (
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
              <>Show All ({sampleApplications.length}) <ChevronDown className="h-3 w-3" /></>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApplicationFeed;
