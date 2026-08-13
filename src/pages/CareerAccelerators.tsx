import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SocialProofTicker from "@/components/accelerators/SocialProofTicker";
import { ShoppingBag, Library } from "lucide-react";
import ProductGallery from "@/components/accelerators/ProductGallery";
import MyLibrary from "@/components/accelerators/MyLibrary";
import { useAccelerators } from "@/hooks/useAccelerators";
import SocialProofStrip from "@/pages/Socialproofstrip";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";
// import CareerLadderNavigator from "@/pages/CareerLadderNavigator";

type TabKey = "gallery" | "library";

const CareerAccelerators = () => {
  const { dark } = useRamp();
  const [tab, setTab] = useState<TabKey>("gallery");

  const {
    products,
    purchasedIds,
    loading,
    buyingId,
    downloadingId,
    buy,
    download,
  } = useAccelerators();

  const accent = dark ? CHART.accentDark : CHART.accent;

  const tabs = [
    { key: "gallery" as const, label: "Product gallery", icon: ShoppingBag, count: products.length },
    { key: "library" as const, label: "My library", icon: Library, count: purchasedIds.size },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className={`text-[20px] font-bold tracking-[-0.01em] ${T.ink}`}>
            Career Accelerators
          </h1>
          <p className={`text-[12px] ${T.muted}`}>
            Premium resources to fast-track your job search and career growth.
          </p>
        </div>

        {/* Products passed through so the catalogue tiles show real counts. */}
        <SocialProofStrip products={products} />

        {/* Pill tabs, matching the application feed rather than shadcn's default. */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.key === tab;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px]
                            transition-colors ${
                              active
                                ? "font-bold"
                                : `font-medium ${T.ink2} hover:bg-[#F4F4F2] dark:hover:bg-white/5`
                            }`}
                style={active ? { backgroundColor: `${accent}1F`, color: accent } : undefined}
              >
                <Icon size={14} />
                {t.label}
                <span
                  className={`rounded-full px-1.5 text-[10.5px] font-bold ${active ? "" : T.muted}`}
                  style={active ? { backgroundColor: `${accent}26` } : undefined}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {tab === "gallery" ? (
          <ProductGallery
            products={products}
            purchasedIds={purchasedIds}
            loading={loading}
            buyingId={buyingId}
            onBuy={buy}
            // Previously omitted, which left the quick-view modal's download
            // button wired to nothing.
            downloadingId={downloadingId}
            onDownload={download}
          />
        ) : (
          <MyLibrary
            products={products}
            purchasedIds={purchasedIds}
            loading={loading}
            downloadingId={downloadingId}
            onDownload={download}
          />
        )}

        {/* <CareerLadderNavigator /> */}

        <SocialProofTicker />
      </div>
    </DashboardLayout>
  );
};

export default CareerAccelerators;
