import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  linkedin: string;
}

const contacts: Contact[] = [
  { id: "1", name: "Sarah Chen", title: "Engineering Recruiter", company: "Google", email: "s.chen@google.com", linkedin: "#" },
  { id: "2", name: "Mark Williams", title: "Talent Acquisition", company: "Stripe", email: "m.williams@stripe.com", linkedin: "#" },
  { id: "3", name: "Emily Davis", title: "HR Director", company: "Meta", email: "e.davis@meta.com", linkedin: "#" },
  { id: "4", name: "James Park", title: "People Ops", company: "Notion", email: "j.park@notion.so", linkedin: "#" },
  { id: "5", name: "Lisa Thompson", title: "Engineering Recruiter", company: "Vercel", email: "l.thompson@vercel.com", linkedin: "#" },
  { id: "6", name: "David Kim", title: "Talent Lead", company: "Linear", email: "d.kim@linear.app", linkedin: "#" },
  { id: "7", name: "Rachel Green", title: "VP People", company: "Figma", email: "r.green@figma.com", linkedin: "#" },
  { id: "8", name: "Alex Turner", title: "Recruiting Manager", company: "Airbnb", email: "a.turner@airbnb.com", linkedin: "#" },
];

const emailTemplates = [
  {
    title: "Warm Introduction",
    body: `Hi [Name],

I recently applied for the [Role] position at [Company] and wanted to reach out directly. I'm particularly excited about [specific company initiative] and believe my experience in [relevant skill] could contribute meaningfully to the team.

Would you be open to a brief chat? I'd love to learn more about the team and share how my background aligns.

Best regards,
[Your Name]`,
  },
  {
    title: "Follow-Up After Application",
    body: `Hi [Name],

I submitted my application for [Role] at [Company] about a week ago and wanted to follow up. I'm very enthusiastic about the opportunity and the work your team is doing in [specific area].

I'd welcome the chance to discuss how my [specific experience] could add value. Please let me know if there's a good time to connect.

Thank you,
[Your Name]`,
  },
];

const Referrals = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyTemplate = (template: string) => {
    navigator.clipboard.writeText(template);
    toast({
      title: "Template Copied",
      description: "Email template copied to clipboard.",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Referral Network</h1>
          <p className="text-sm text-muted-foreground">
            HR contacts and insider templates for companies you've applied to.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name, company, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-muted/50 pl-10"
          />
        </div>

        {/* Contacts Table */}
        <div className="glass-card rounded-xl">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">HR Contacts</h3>
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3 text-right">Links</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact, i) => (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: i * 0.03 }}
                    className="border-b border-border/20 transition-colors hover:bg-muted/30"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{contact.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{contact.title}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">{contact.company}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{contact.email}</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="space-y-3 p-4 md:hidden">
            {filteredContacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border border-border/30 bg-muted/20 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium text-foreground">{contact.name}</span>
                  <Badge variant="secondary" className="text-xs">{contact.company}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{contact.title}</p>
                <p className="mt-1 text-xs text-primary">{contact.email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Email Templates */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Insider Email Templates</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {emailTemplates.map((template) => (
              <div key={template.title} className="glass-card rounded-xl p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{template.title}</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyTemplate(template.body)}
                    className="gap-1 text-xs text-primary"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap rounded-lg bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground">
                  {template.body}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Referrals;
