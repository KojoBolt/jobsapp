import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LegalModal from "@/components/legal/LegalModal";
import TermsOfService from "@/components/legal/TermsOfService";
import PrivacyPolicy from "@/components/legal/PrivacyPolicy";
import { Button } from "@/components/ui/button";
import { FileText, Shield, Download } from "lucide-react";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account preferences and legal documents.
          </p>
        </div>

        {/* Legal Center */}
        <div className="glass-card rounded-xl">
          <div className="border-b border-border/50 px-6 py-4">
            <h3 className="text-sm font-semibold text-foreground">Legal Center</h3>
            <p className="text-xs text-muted-foreground">
              Review our policies and download them for your records.
            </p>
          </div>

          <div className="divide-y divide-border/20">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Terms of Service</p>
                  <p className="text-xs text-muted-foreground">
                    Including AI Data Processing & Human-in-the-Loop clauses
                  </p>
                </div>
              </div>
              <LegalModal
                title="Terms of Service"
                trigger={
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary">
                    <Download className="h-3.5 w-3.5" />
                    View & Print
                  </Button>
                }
              >
                <TermsOfService />
              </LegalModal>
            </div>

            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Privacy Policy</p>
                  <p className="text-xs text-muted-foreground">
                    Data retention, GDPR/CCPA compliance, and your rights
                  </p>
                </div>
              </div>
              <LegalModal
                title="Privacy Policy"
                trigger={
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary">
                    <Download className="h-3.5 w-3.5" />
                    View & Print
                  </Button>
                }
              >
                <PrivacyPolicy />
              </LegalModal>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
