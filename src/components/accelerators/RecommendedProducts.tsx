import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, BookOpen, Video, FileText } from "lucide-react";
import { products, type Product } from "@/data/products";
import ProductModal from "./ProductModal";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const categoryIcons: Record<string, React.ElementType> = {
  "E-Book": BookOpen,
  "Video Series": Video,
  "Video Masterclass": Video,
  "PDF Bundle": FileText,
  "Template Kit": FileText,
};

const RecommendedProducts = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  // Show top 3 paid products as recommendations
  const recommended = products.filter((p) => !p.isFree).slice(0, 3);

  const handlePurchase = (product: Product) => {
    setModalOpen(false);
    toast({
      title: "Purchase Successful!",
      description: `"${product.title}" has been added to your library.`,
    });
  };

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <CardTitle className="text-base">Recommended for You</CardTitle>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/accelerators">View All</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {recommended.map((product) => {
            const Icon = categoryIcons[product.category] || FileText;
            return (
              <div
                key={product.id}
                className="group flex cursor-pointer flex-col gap-2 rounded-lg border border-border/50 p-3 transition-colors hover:border-primary/30 hover:bg-muted/30"
                onClick={() => {
                  setSelectedProduct(product);
                  setModalOpen(true);
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${product.imageGradient}`}
                  >
                    <Icon className="h-4 w-4 text-foreground/30" />
                  </div>
                  <Badge variant="outline" className="text-[9px]">
                    {product.category}
                  </Badge>
                </div>
                <h4 className="line-clamp-2 text-xs font-medium text-foreground">
                  {product.title}
                </h4>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-foreground">
                    ${product.memberPrice}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                </div>
                <Button variant="outline" size="sm" className="mt-auto w-full text-xs">
                  <Eye className="mr-1 h-3 w-3" />
                  Quick View
                </Button>
              </div>
            );
          })}
        </div>

        <ProductModal
          product={selectedProduct}
          open={modalOpen}
          onOpenChange={setModalOpen}
          onPurchase={handlePurchase}
        />
      </CardContent>
    </Card>
  );
};

export default RecommendedProducts;
