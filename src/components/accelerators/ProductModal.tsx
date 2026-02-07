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
  Check,
  ShoppingCart,
  Download,
  Users,
  Gift,
  BookOpen,
  Video,
  FileText,
} from "lucide-react";
import type { Product } from "@/data/products";

const categoryIcons: Record<string, React.ElementType> = {
  "E-Book": BookOpen,
  "Video Series": Video,
  "Video Masterclass": Video,
  "PDF Bundle": FileText,
  "Template Kit": FileText,
};

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPurchased?: boolean;
  onPurchase?: (product: Product) => void;
}

const ProductModal = ({
  product,
  open,
  onOpenChange,
  isPurchased = false,
  onPurchase,
}: ProductModalProps) => {
  if (!product) return null;

  const Icon = categoryIcons[product.category] || FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-border/50 bg-card sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${product.imageGradient}`}
            >
              <Icon className="h-6 w-6 text-foreground/40" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg leading-tight text-foreground">
                {product.title}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {product.category}
                </Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  Recently purchased by {product.recentPurchases} professionals
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="bg-border/50" />

        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.longDescription}
          </p>

          {/* Features */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground">
              What's Included
            </h4>
            <ul className="space-y-1.5">
              {product.features.map((feature, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-interview" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <Separator className="bg-border/50" />

          {/* Price & CTA */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {product.isFree ? (
                <span className="text-2xl font-bold text-status-interview">
                  Free
                </span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-foreground">
                    ${product.memberPrice}
                  </span>
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                </>
              )}
            </div>

            {isPurchased ? (
              <Button variant="default" size="sm">
                <Download className="mr-1.5 h-4 w-4" />
                Download
              </Button>
            ) : product.isFree ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPurchase?.(product)}
              >
                <Gift className="mr-1.5 h-4 w-4" />
                Get Free Access
              </Button>
            ) : (
              <Button
                variant="gold"
                size="sm"
                onClick={() => onPurchase?.(product)}
              >
                <ShoppingCart className="mr-1.5 h-4 w-4" />
                Purchase
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
