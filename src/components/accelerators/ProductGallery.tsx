import { useState } from "react";
import ProductCard from "./ProductCard";
import ProductModal from "./ProductModal";
import { Package } from "lucide-react";
import { type Product } from "@/hooks/useAccelerators";
import { T } from "@/admin/ui/system";

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`h-[300px] animate-pulse rounded-2xl border ${T.hairline}
                        bg-[#F7F7F5] dark:bg-white/[0.03]`}
          />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={`rounded-2xl border ${T.hairline} bg-white px-6 py-14 text-center dark:bg-[#1A1A19]`}>
        <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-[#F4F4F2] text-[#9A9995] dark:bg-white/5">
          <Package size={18} />
        </span>
        <p className={`text-[14px] font-bold ${T.ink}`}>No products yet</p>
        <p className={`mt-1 text-[12px] ${T.muted}`}>
          Check back soon — new career resources are on the way.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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