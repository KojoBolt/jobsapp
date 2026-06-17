import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, BookOpen, Video, FileText, Gift, ShoppingCart, Check } from "lucide-react";
import { type Product, formatPrice } from "@/hooks/useAccelerators";

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

const ProductCard = ({ product, isPurchased, onQuickView, onBuyNow, isBuying = false }: ProductCardProps) => {
  const Icon = iconFor(product);
  const isFree = product.price_subunit === 0;

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Cover */}
      <div className="relative h-48 w-full overflow-hidden">
        {product.cover_url ? (
          <img
            src={product.cover_url}
            alt={product.title}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-48 items-center justify-center bg-gradient-to-br from-muted to-muted/40">
            <Icon className="h-16 w-16 text-foreground/20 transition-transform duration-300 group-hover:scale-110" />
          </div>
        )}

        {isFree && (
          <div className="absolute left-3 top-3">
            <Badge className="border-status-interview/30 bg-status-interview/15 text-status-interview">
              <Gift className="mr-1 h-3 w-3" />
              Free
            </Badge>
          </div>
        )}
        {product.category && (
          <div className="absolute right-3 top-3">
            <Badge variant="outline" className="border-border/50 bg-background/80 backdrop-blur-sm">
              {product.category}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {product.title}
        </h3>

        {product.headline && (
          <p className="line-clamp-2 text-xs text-muted-foreground">{product.headline}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {isFree ? (
            <span className="text-lg font-bold text-status-interview">Free</span>
          ) : (
            <>
              <span className="text-lg font-bold text-foreground">
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

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onQuickView(product)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Quick View
          </Button>

          {isPurchased ? (
            <Button variant="default" size="sm" className="flex-1" disabled>
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Owned
            </Button>
          ) : isFree ? (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onBuyNow(product)}
              disabled={isBuying}
            >
              <Gift className="mr-1.5 h-3.5 w-3.5" />
              {isBuying ? "…" : "Get Free"}
            </Button>
          ) : (
            <Button
              variant="gold"
              size="sm"
              className="flex-1 font-bold"
              onClick={() => onBuyNow(product)}
              disabled={isBuying}
            >
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              {isBuying ? "…" : "Get This Now"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;