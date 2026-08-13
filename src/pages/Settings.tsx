import DashboardLayout from "@/components/dashboard/DashboardLayout";
import LegalModal from "@/components/legal/LegalModal";
import TermsOfService from "@/components/legal/TermsOfService";
import PrivacyPolicy from "@/components/legal/PrivacyPolicy";
import { FileText, Shield, ExternalLink, Scale } from "lucide-react";
import { CHART, T, Panel, PanelHeader } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

const DOCUMENTS = [
  {
    icon: FileText,
    title: "Terms of Service",
    blurb: "Including AI data processing and Human-in-the-Loop clauses.",
    body: <TermsOfService />,
  },
  {
    icon: Shield,
    title: "Privacy Policy",
    blurb: "Data retention, GDPR/CCPA compliance, and your rights.",
    body: <PrivacyPolicy />,
  },
];

const Settings = () => {
  const { dark } = useRamp();
  const accent = dark ? CHART.accentDark : CHART.accent;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>Settings</h1>
          <p className={`text-[12px] ${T.muted}`}>
            Review the policies that govern your account.
          </p>
        </div>

        <Panel className="overflow-hidden">
          <PanelHeader
            icon={Scale}
            title="Legal center"
            right={
              <span className={`text-[11px] ${T.muted}`}>Updated Feb 2026</span>
            }
          />

          <div className={`divide-y ${T.divide} border-t ${T.hairline}`}>
            {DOCUMENTS.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.title}
                  className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${T.hover}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: `${accent}1A`, color: accent }}
                    >
                      <Icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className={`truncate text-[12.5px] font-bold ${T.ink}`}>{doc.title}</p>
                      <p className={`truncate text-[11px] ${T.muted}`}>{doc.blurb}</p>
                    </div>
                  </div>

                  <LegalModal
                    title={doc.title}
                    trigger={
                      <button
                        type="button"
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border
                                    ${T.hairline} px-2.5 py-1.5 text-[12px] font-medium ${T.ink}
                                    transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
                      >
                        <ExternalLink size={13} />
                        Read
                      </button>
                    }
                  >
                    {doc.body}
                  </LegalModal>
                </div>
              );
            })}
          </div>

          <div className={`border-t ${T.hairline} px-5 py-3`}>
            <p className={`text-[11px] leading-relaxed ${T.muted}`}>
              Each document opens in a reader with a print-to-PDF option, so you can keep a copy
              for your records.
            </p>
          </div>
        </Panel>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
