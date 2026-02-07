import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Printer } from "lucide-react";

interface LegalModalProps {
  title: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
}

const LegalModal = ({ title, trigger, children }: LegalModalProps) => {
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !contentRef.current) return;
    printWindow.document.write(`
      <html><head><title>${title} - JobApp</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; line-height: 1.8; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        h2 { font-size: 18px; margin-top: 28px; margin-bottom: 8px; color: #2E7DFF; }
        h3 { font-size: 15px; margin-top: 20px; margin-bottom: 6px; }
        p, li { font-size: 14px; color: #444; }
        ul { padding-left: 20px; }
        .header { border-bottom: 2px solid #2E7DFF; padding-bottom: 12px; margin-bottom: 24px; }
        .footer { margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 12px; }
      </style></head><body>
      <div class="header"><h1>${title}</h1><p>JobApp — Last updated: February 2026</p></div>
      ${contentRef.current.innerHTML}
      <div class="footer">© 2026 JobApp. All rights reserved. This document is for your records.</div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl border-border/50 bg-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handlePrint} className="gap-1.5 text-xs text-muted-foreground">
              <Printer className="h-3.5 w-3.5" />
              Print to PDF
            </Button>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-4">
          <div ref={contentRef} className="space-y-6 text-sm leading-relaxed text-muted-foreground">
            {children}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LegalModal;
