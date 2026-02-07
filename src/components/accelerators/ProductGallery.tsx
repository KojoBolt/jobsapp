import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { products, careerBundle, type Product } from "@/data/products";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ProductGallery = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const initiatePaystackCheckout = async (
    productId: string,
    productTitle: string,
    amount: number,
    email?: string
  ) => {
    setIsLoading(true);
    try {
      const userEmail = email || "customer@jobapp.com";
      const callbackUrl = `${window.location.origin}/purchase-success?product=${encodeURIComponent(productTitle)}`;

      const { data, error } = await supabase.functions.invoke("paystack-checkout", {
        body: {
          email: userEmail,
          amount,
          productId,
          productTitle,
          callbackUrl,
        },
      });

      if (error) throw error;

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No authorization URL received from payment gateway");
      }
    } catch (err: unknown) {
      console.error("Paystack checkout error:", err);
      toast({
        title: "Payment Error",
        description: "Unable to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = (product: Product) => {
    if (product.isFree) {
      setPurchasedIds((prev) => new Set(prev).add(product.id));
      setModalOpen(false);
      toast({
        title: "Added to Your Library!",
        description: `"${product.title}" is now in your library.`,
      });
      return;
    }

    setModalOpen(false);
    initiatePaystackCheckout(product.id, product.title, product.memberPrice);
  };

  const handleBundlePurchase = () => {
    initiatePaystackCheckout(
      "career-bundle",
      careerBundle.title,
      careerBundle.bundlePrice
    );
  };

  return (
    <div className="space-y-8">
      {/* Bundle Offer */}
      <Card className="overflow-hidden border-gold/30 bg-gradient-to-r from-gold/5 via-card to-gold/5">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gold" />
              <h3 className="text-lg font-bold text-foreground">
                {careerBundle.title}
              </h3>
              <Badge variant="gold" className="text-[10px]">
                Save ${careerBundle.originalPrice - careerBundle.bundlePrice}
              </Badge>
            </div>
            <p className="max-w-lg text-sm text-muted-foreground">
              {careerBundle.description}
            </p>
            <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
              {careerBundle.includes.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 flex-col items-center gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                ${careerBundle.bundlePrice}
              </span>
              <span className="text-sm text-muted-foreground line-through">
                ${careerBundle.originalPrice}
              </span>
            </div>
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={handleBundlePurchase}
              disabled={isLoading}
            >
              <Sparkles className="mr-1.5 h-4 w-4" />
              {isLoading ? "Processing…" : "Get the Bundle"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={handleQuickView}
            onBuyNow={handlePurchase}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Quick View Modal */}
      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isPurchased={
          selectedProduct ? purchasedIds.has(selectedProduct.id) : false
        }
        onPurchase={handlePurchase}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ProductGallery;
