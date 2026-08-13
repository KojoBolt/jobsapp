import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Printer } from "lucide-react";
import { T } from "@/admin/ui/system";

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

      {/* p-0/gap-0 so the header, body and footer can own their own bands
          instead of floating inside the dialog's default padding. */}
      <DialogContent
        className={`max-w-2xl gap-0 overflow-hidden rounded-2xl border ${T.hairline}
                    bg-white p-0 dark:bg-[#1A1A19]`}
      >
        <div className={`flex items-center justify-between gap-3 border-b ${T.hairline} px-5 py-3.5`}>
          <div className="min-w-0">
            <DialogTitle className={`truncate text-[13.5px] font-bold ${T.ink}`}>
              {title}
            </DialogTitle>
            <DialogDescription className={`text-[11px] ${T.muted}`}>
              Last updated February 2026
            </DialogDescription>
          </div>

          {/* Sits left of the dialog's own close button, which occupies the corner. */}
          <button
            type="button"
            onClick={handlePrint}
            className={`mr-6 inline-flex shrink-0 items-center gap-1.5 rounded-lg border ${T.hairline}
                        px-2.5 py-1.5 text-[12px] font-medium ${T.ink} transition-colors
                        hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            <Printer size={13} />
            Print to PDF
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
          <div ref={contentRef} className={`space-y-5 text-[12.5px] leading-relaxed ${T.ink2}`}>
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LegalModal;
