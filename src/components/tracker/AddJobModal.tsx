import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bot, Link2 } from "lucide-react";

interface AddJobModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    company_name: string;
    position_title: string;
    job_url: string;
    status: string;
    submission_type: string;
    notes: string;
    salary_range: string;
    location: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    applied_at: string;
  }) => void;
  editData?: {
    id: string;
    company_name: string;
    position_title: string;
    job_url: string | null;
    status: string;
    submission_type: string;
    notes: string | null;
    salary_range?: string | null;
    location?: string | null;
    contact_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    applied_at?: string;
  } | null;
  isPlan2: boolean;
  remainingSlots: number;
}

const statuses = [
  { value: "applied", label: "Applied" },
  { value: "screening", label: "Screening" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

const AddJobModal = ({ open, onClose, onSubmit, editData, isPlan2, remainingSlots }: AddJobModalProps) => {
  const [company, setCompany] = useState(editData?.company_name || "");
  const [position, setPosition] = useState(editData?.position_title || "");
  const [url, setUrl] = useState(editData?.job_url || "");
  const [status, setStatus] = useState(editData?.status || "applied");
  const [aiDiscovery, setAiDiscovery] = useState(editData?.submission_type === "ai_discovery");
  const [notes, setNotes] = useState(editData?.notes || "");
  const [salaryRange, setSalaryRange] = useState(editData?.salary_range || "");
  const [location, setLocation] = useState(editData?.location || "");
  const [contactName, setContactName] = useState(editData?.contact_name || "");
  const [contactEmail, setContactEmail] = useState(editData?.contact_email || "");
  const [contactPhone, setContactPhone] = useState(editData?.contact_phone || "");
  const [appliedAt, setAppliedAt] = useState(
    editData?.applied_at ? new Date(editData.applied_at).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      company_name: company.trim(),
      position_title: position.trim(),
      job_url: url.trim(),
      status,
      submission_type: aiDiscovery ? "ai_discovery" : "manual",
      notes: notes.trim(),
      salary_range: salaryRange.trim(),
      location: location.trim(),
      contact_name: contactName.trim(),
      contact_email: contactEmail.trim(),
      contact_phone: contactPhone.trim(),
      applied_at: new Date(appliedAt).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border/50 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Application" : "Add Application"}</DialogTitle>
          {!editData && (
            <p className="text-xs text-muted-foreground">
              {remainingSlots} submissions remaining this month
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row: Company + Position */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Position Title *</Label>
              <Input value={position} onChange={(e) => setPosition(e.target.value)} required maxLength={100} />
            </div>
          </div>

          {/* Row: Status + Date Applied */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Applied</Label>
              <Input type="date" value={appliedAt} onChange={(e) => setAppliedAt(e.target.value)} />
            </div>
          </div>

          {/* Row: Salary + Location */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Salary Range</Label>
              <Input value={salaryRange} onChange={(e) => setSalaryRange(e.target.value)} placeholder="e.g. $80k - $100k" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Remote, NYC" maxLength={200} />
            </div>
          </div>

          {/* Job URL */}
          <div className="space-y-2">
            <Label>Job Posting URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://..." maxLength={500} />
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Contact Information</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Contact Name" maxLength={100} />
              <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Contact Email" type="email" maxLength={200} />
            </div>
            <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Contact Phone" type="tel" maxLength={30} />
          </div>

          {/* Plan 2 toggle */}
          {isPlan2 && !editData && (
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div className="flex items-center gap-2">
                {aiDiscovery ? <Bot className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{aiDiscovery ? "AI + Human Discovery" : "I'll provide the link"}</p>
                  <p className="text-xs text-muted-foreground">
                    {aiDiscovery ? "Let our team find & apply for you" : "Manual submission with your link"}
                  </p>
                </div>
              </div>
              <Switch checked={aiDiscovery} onCheckedChange={setAiDiscovery} />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} placeholder="Any additional notes..." />
          </div>

          <Button type="submit" className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white hover:opacity-90 hover:-translate-y-0.5 transition-all">
            {editData ? "Save Changes" : "Add Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;
