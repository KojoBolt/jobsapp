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
  }) => void;
  editData?: {
    id: string;
    company_name: string;
    position_title: string;
    job_url: string | null;
    status: string;
    submission_type: string;
    notes: string | null;
  } | null;
  isPlan2: boolean;
  remainingSlots: number;
}

const AddJobModal = ({ open, onClose, onSubmit, editData, isPlan2, remainingSlots }: AddJobModalProps) => {
  const [company, setCompany] = useState(editData?.company_name || "");
  const [position, setPosition] = useState(editData?.position_title || "");
  const [url, setUrl] = useState(editData?.job_url || "");
  const [status, setStatus] = useState(editData?.status || "screening");
  const [aiDiscovery, setAiDiscovery] = useState(editData?.submission_type === "ai_discovery");
  const [notes, setNotes] = useState(editData?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      company_name: company.trim(),
      position_title: position.trim(),
      job_url: url.trim(),
      status,
      submission_type: aiDiscovery ? "ai_discovery" : "manual",
      notes: notes.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? "Edit Application" : "Add Application"}</DialogTitle>
          {!editData && (
            <p className="text-xs text-muted-foreground">
              {remainingSlots} submissions remaining this month
            </p>
          )}
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Position Title</Label>
            <Input value={position} onChange={(e) => setPosition(e.target.value)} required maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label>Job URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" placeholder="https://..." maxLength={500} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={500} />
          </div>
          <Button type="submit" className="w-full" variant="hero">
            {editData ? "Save Changes" : "Add Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;
