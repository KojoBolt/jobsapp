import { Eye, BookOpen, Video, FileText, Gift, ShoppingCart, Check } from "lucide-react";
import { type Product, formatPrice } from "@/hooks/useAccelerators";
import { CHART, T } from "@/admin/ui/system";
import { useRamp } from "@/admin/ui/charts";

function iconFor(product: Product): React.ElementType {
  if (product.type === "video") return Video;
  if (product.category?.toLowerCase().includes("template")) return FileText;
  return BookOpen;
}

interface ProductCardProps {
  product: Product;
  isPurchased: boolean;
  onQuickView: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  isBuying?: boolean;
}

const ProductCard = ({
  product,
  isPurchased,
  onQuickView,
  onBuyNow,
  isBuying = false,
}: ProductCardProps) => {
  const { dark } = useRamp();
  const Icon = iconFor(product);
  const isFree = product.price_subunit === 0;

  const accent = dark ? CHART.accentDark : CHART.accent;
  const good = dark ? CHART.goodDark : CHART.good;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border ${T.hairline} bg-white
                  transition-shadow hover:shadow-[0_4px_16px_rgba(28,25,23,0.07)] dark:bg-[#1A1A19]`}
    >
      {/* ── Cover ──────────────────────────────────────────────────────── */}
      <div className="relative h-40 w-full overflow-hidden">
        {product.cover_url ? (
          <img
            src={product.cover_url}
            alt={product.title}
            className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-40 items-center justify-center"
            style={{ backgroundColor: dark ? "rgba(255,255,255,0.03)" : "#F4F4F2" }}
          >
            <Icon size={40} style={{ color: accent, opacity: 0.5 }} />
          </div>
        )}

        {isFree && (
          <span
            className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md px-2 py-1
                       text-[10px] font-bold"
            style={{ backgroundColor: good, color: dark ? "#0D0D0D" : "#FFFFFF" }}
          >
            <Gift size={10} />
            Free
          </span>
        )}

        {product.category && (
          <span
            className={`absolute right-3 top-3 rounded-md border ${T.hairline} bg-white/90 px-2 py-1
                        text-[10px] font-semibold ${T.ink2} backdrop-blur-sm dark:bg-[#1A1A19]/90`}
          >
            {product.category}
          </span>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className={`line-clamp-2 text-[13.5px] font-bold leading-snug ${T.ink}`}>
          {product.title}
        </h3>

        {/* `description` is the field the hook's Product actually carries — the
            previous `headline` belongs to the unrelated Product type in
            @/data/products and was always undefined here. */}
        {product.description && (
          <p className={`mt-1 line-clamp-2 text-[11.5px] leading-relaxed ${T.muted}`}>
            {product.description}
          </p>
        )}

        <div className="mt-3 flex items-baseline gap-2">
          {isFree ? (
            <span className="text-[18px] font-bold" style={{ color: good }}>
              Free
            </span>
          ) : (
            <>
              <span className={`text-[18px] font-bold tracking-[-0.01em] ${T.ink}`}>
                {formatPrice(product.price_subunit, product.currency)}
              </span>
              {product.compare_at_subunit ? (
                <span className={`text-[12px] line-through ${T.muted}`}>
                  {formatPrice(product.compare_at_subunit, product.currency)}
                </span>
              ) : null}
            </>
          )}
        </div>

        <div className="mt-3.5 flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border
                        ${T.hairline} px-3 py-2 text-[12px] font-semibold ${T.ink}
                        transition-colors hover:bg-[#F4F4F2] dark:hover:bg-white/5`}
          >
            <Eye size={13} />
            Quick view
          </button>

          {isPurchased ? (
            <span
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2
                         text-[12px] font-semibold"
              style={{ backgroundColor: `${good}1F`, color: good }}
            >
              <Check size={13} strokeWidth={3} />
              Owned
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onBuyNow(product)}
              disabled={isBuying}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg
                         bg-[#111110] px-3 py-2 text-[12px] font-semibold text-white
                         transition-opacity hover:opacity-90 disabled:opacity-50
                         dark:bg-white dark:text-[#111110]"
            >
              {isFree ? <Gift size={13} /> : <ShoppingCart size={13} />}
              {isBuying ? "…" : isFree ? "Get free" : "Get this"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
