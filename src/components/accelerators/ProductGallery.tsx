import { useState } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { Package } from "lucide-react";
import { type Product } from "@/hooks/useAccelerators";

interface ProductGalleryProps {
  products: Product[];
  purchasedIds: Set<string>;
  loading: boolean;
  buyingId: string | null;
  downloadingId: string | null;
  onBuy: (productId: string) => void;
  onDownload: (productId: string) => void;
}

const ProductGallery = ({
  products,
  purchasedIds,
  loading,
  buyingId,
  downloadingId,
  onBuy,
  onDownload,
}: ProductGalleryProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold text-foreground">No products yet</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Check back soon — new career resources are on the way.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isPurchased={purchasedIds.has(product.id)}
            onQuickView={handleQuickView}
            onBuyNow={(p) => onBuy(p.id)}
            isBuying={buyingId === product.id}
          />
        ))}
      </div>

      <ProductModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
        isPurchased={selectedProduct ? purchasedIds.has(selectedProduct.id) : false}
        onPurchase={(p) => onBuy(p.id)}
        onDownload={onDownload}
        isBuying={selectedProduct ? buyingId === selectedProduct.id : false}
        isDownloading={selectedProduct ? downloadingId === selectedProduct.id : false}
      />
    </div>
  );
};

export default ProductGallery;