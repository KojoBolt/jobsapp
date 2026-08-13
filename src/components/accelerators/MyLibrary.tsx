import { Download, Play, BookOpen, Video, FileText, Library } from "lucide-react";
import { type Product } from "@/hooks/useAccelerators";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

function iconFor(product: Product): React.ElementType {
  if (product.type === "video") return Video;
  if (product.category?.toLowerCase().includes("template")) return FileText;
  return BookOpen;
}

interface MyLibraryProps {
  products: Product[];
  purchasedIds: Set<string>;
  loading: boolean;
  downloadingId: string | null;
  onDownload: (productId: string) => void;
}

const MyLibrary = ({
  products,
  purchasedIds,
  loading,
  downloadingId,
  onDownload,
}: MyLibraryProps) => {
  const { dark } = useRamp();
  const purchased = products.filter((p) => purchasedIds.has(p.id));
  const accent = dark ? CHART.accentDark : CHART.accent;

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={`h-28 animate-pulse rounded-2xl border ${T.hairline}
                        bg-[#F7F7F5] dark:bg-white/[0.03]`}
          />
        ))}
      </div>
    );
  }

  if (purchased.length === 0) {
    return (
      <div className={`rounded-2xl border ${T.hairline} bg-white px-6 py-14 text-center dark:bg-[#1A1A19]`}>
        <span
          className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          <Library size={18} />
        </span>
        <p className={`text-[14px] font-bold ${T.ink}`}>Your library is empty</p>
        <p className={`mx-auto mt-1 max-w-sm text-[12px] leading-relaxed ${T.muted}`}>
          Products you buy appear here for instant download or streaming. Browse the
          gallery to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {purchased.map((product) => {
        const Icon = iconFor(product);
        const isVideo = product.type === "video";
        const busy = downloadingId === product.id;

        return (
          <div
            key={product.id}
            className={`flex items-start gap-3.5 rounded-2xl border ${T.hairline} bg-white p-4
                        dark:bg-[#1A1A19]`}
          >
            <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl">
              {product.cover_url ? (
                <img
                  src={product.cover_url}
                  alt={product.title}
                  className="h-11 w-11 object-cover"
                />
              ) : (
                <span
                  className="grid h-11 w-11 place-items-center"
                  style={{ backgroundColor: `${accent}1A`, color: accent }}
                >
                  <Icon size={18} />
                </span>
              )}
            </span>

            <div className="min-w-0 flex-1">
              <h4 className={`line-clamp-2 text-[13px] font-bold leading-snug ${T.ink}`}>
                {product.title}
              </h4>
              {product.category && (
                <span
                  className={`mt-1 inline-block rounded-md border ${T.hairline} px-1.5 py-0.5
                              text-[10px] font-semibold ${T.muted}`}
                >
                  {product.category}
                </span>
              )}

              <button
                type="button"
                onClick={() => onDownload(product.id)}
                disabled={busy}
                className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg
                           bg-[#111110] px-3 py-2 text-[12px] font-semibold text-white
                           transition-opacity hover:opacity-90 disabled:opacity-50
                           dark:bg-white dark:text-[#111110]"
              >
                {isVideo ? <Play size={13} /> : <Download size={13} />}
                {busy ? "Opening…" : isVideo ? "Watch now" : "Download"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MyLibrary;
