import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Check, ShoppingCart, Download, Play, Users, Gift,
  BookOpen, Video, FileText, Zap, TrendingUp,
} from "lucide-react";
import { type Product, formatPrice } from "@/hooks/useAccelerators";

function iconFor(product: Product): React.ElementType {
  if (product.type === "video") return Video;
  if (product.category?.toLowerCase().includes("template")) return FileText;
  return BookOpen;
}

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPurchased?: boolean;
  onPurchase?: (product: Product) => void;
  onDownload?: (productId: string) => void;
  isBuying?: boolean;
  isDownloading?: boolean;
}

const ProductModal = ({
  product,
  open,
  onOpenChange,
  isPurchased = false,
  onPurchase,
  onDownload,
  isBuying = false,
  isDownloading = false,
}: ProductModalProps) => {
  if (!product) return null;

  const Icon = iconFor(product);
  const isFree = product.price_subunit === 0;
  const isVideo = product.type === "video";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border/50 bg-card sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              {product.cover_url ? (
                <img src={product.cover_url} alt={product.title} className="h-12 w-12 object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                  <Icon className="h-6 w-6 text-foreground/40" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg leading-tight text-foreground">
                {product.title}
              </DialogTitle>
              <DialogDescription className="flex flex-wrap items-center gap-2">
                {product.category && (
                  <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                )}
                {product.recent_purchases ? (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    Recently purchased by {product.recent_purchases} professionals
                  </span>
                ) : null}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="bg-border/50" />

        <div className="space-y-4">
          {product.headline && (
            <h3 className="text-base font-bold leading-snug text-foreground">{product.headline}</h3>
          )}

          {product.hook && (
            <p className="text-sm italic leading-relaxed text-muted-foreground">{product.hook}</p>
          )}

          {product.features && product.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Zap className="h-3.5 w-3.5 text-gold" />
                What's Inside
              </h4>
              <ul className="space-y-2">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-interview" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.result && (
            <div className="rounded-lg border border-status-interview/20 bg-status-interview/5 p-3">
              <p className="flex items-start gap-2 text-sm font-medium text-foreground">
                <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-status-interview" />
                <span>
                  <span className="font-semibold">The Result:</span> {product.result}
                </span>
              </p>
            </div>
          )}

          <Separator className="bg-border/50" />

          {/* Price & CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {isFree ? (
                <span className="text-2xl font-bold text-status-interview">Free</span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(product.price_subunit, product.currency)}
                  </span>
                  {product.compare_at_subunit ? (
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(product.compare_at_subunit, product.currency)}
                    </span>
                  ) : null}
                </>
              )}
            </div>

            {isPurchased ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => onDownload?.(product.id)}
                disabled={isDownloading}
              >
                {isVideo ? <Play className="mr-1.5 h-4 w-4" /> : <Download className="mr-1.5 h-4 w-4" />}
                {isDownloading ? "Opening…" : isVideo ? "Watch Now" : "Download"}
              </Button>
            ) : isFree ? (
              <Button variant="default" size="sm" onClick={() => onPurchase?.(product)} disabled={isBuying}>
                <Gift className="mr-1.5 h-4 w-4" />
                {isBuying ? "Adding…" : "Get Free Access"}
              </Button>
            ) : (
              <Button
                variant="gold"
                size="lg"
                className="font-bold"
                onClick={() => onPurchase?.(product)}
                disabled={isBuying}
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                {isBuying ? "Processing…" : "Buy Now"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;