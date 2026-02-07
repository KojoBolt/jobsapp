import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, BookOpen, Video, FileText, Gift, ShoppingCart } from "lucide-react";
import type { Product } from "@/data/products";

const categoryIcons: Record<string, React.ElementType> = {
  "E-Book": BookOpen,
  "Video Series": Video,
  "Video Masterclass": Video,
  "PDF Bundle": FileText,
  "Template Kit": FileText,
};

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  isLoading?: boolean;
}

const ProductCard = ({ product, onQuickView, onBuyNow, isLoading = false }: ProductCardProps) => {
  const Icon = categoryIcons[product.category] || FileText;

  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Image Placeholder */}
      <div
        className={`relative flex h-48 items-center justify-center bg-gradient-to-br ${product.imageGradient}`}
      >
        <Icon className="h-16 w-16 text-foreground/20 transition-transform duration-300 group-hover:scale-110" />
        {product.isFree && (
          <div className="absolute left-3 top-3">
            <Badge className="border-status-interview/30 bg-status-interview/15 text-status-interview">
              <Gift className="mr-1 h-3 w-3" />
              Free
            </Badge>
          </div>
        )}
        <div className="absolute right-3 top-3">
          <Badge variant="outline" className="border-border/50 bg-background/80 backdrop-blur-sm">
            {product.category}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-3 p-5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
          {product.title}
        </h3>

        <p className="line-clamp-2 text-xs text-muted-foreground">
          {product.headline}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          {product.isFree ? (
            <span className="text-lg font-bold text-status-interview">Free</span>
          ) : (
            <>
              <span className="text-lg font-bold text-foreground">
                ${product.memberPrice}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
              <Badge variant="human" className="ml-auto text-[10px]">
                Member Price
              </Badge>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onQuickView(product)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Quick View
          </Button>
          {!product.isFree && (
            <Button
              variant="gold"
              size="sm"
              className="flex-1 font-bold"
              onClick={() => onBuyNow?.(product)}
              disabled={isLoading}
            >
              <ShoppingCart className="mr-1.5 h-3.5 w-3.5" />
              {isLoading ? "…" : "Get This Now"}
            </Button>
          )}
          {product.isFree && (
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => onBuyNow?.(product)}
            >
              <Gift className="mr-1.5 h-3.5 w-3.5" />
              Get Free
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
