import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Product {
  id: string;
  title: string;
  description: string | null;
  type: "ebook" | "video";
  price_subunit: number;
  currency: string;
  cover_url: string | null;
  active: boolean;
  category?: string;
  compare_at_subunit?: number;
}

export function formatPrice(subunit: number | null | undefined, currency: string = "USD"): string {
  if (subunit === null || subunit === undefined) return "";
  const major = subunit / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(major);
}

export function useAccelerators() {
  const [products, setProducts] = useState<Product[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Load catalog + this user's purchases.
  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: prods }, { data: { user } }] = await Promise.all([
      supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false }),
      supabase.auth.getUser(),
    ]);

    setProducts((prods as Product[]) || []);

    if (user) {
      const { data: purchases } = await supabase
        .from("purchases")
        .select("product_id")
        .eq("user_id", user.id);
      setPurchasedIds(new Set((purchases || []).map((p: { product_id: string }) => p.product_id)));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Start a Paystack checkout for a product, then redirect to Paystack.
  const buy = useCallback(async (productId: string) => {
    setBuyingId(productId);
    try {
      const { data, error } = await supabase.functions.invoke("initialize-paystack-product", {
        body: {
          productId,
          callbackUrl: `${window.location.origin}/payment/callback`,
        },
      });

      if (error) {
        const body = await error.context?.json?.().catch(() => null);
        toast.error(body?.error || "Could not start checkout. Please try again.");
        return;
      }
      if (data?.authorization_url) {
        window.location.href = data.authorization_url; // off to Paystack
      } else {
        toast.error("No checkout URL returned.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setBuyingId(null);
    }
  }, []);

  // Fetch a signed URL for an owned product and open it.
  const download = useCallback(async (productId: string) => {
    setDownloadingId(productId);
    try {
      const { data, error } = await supabase.functions.invoke("get-download-url", {
        body: { productId },
      });

      if (error) {
        const body = await error.context?.json?.().catch(() => null);
        toast.error(body?.error || "Could not open this item.");
        return;
      }
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("No download link returned.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setDownloadingId(null);
    }
  }, []);

  return {
    products,
    purchasedIds,
    loading,
    buyingId,
    downloadingId,
    buy,
    download,
    refetch: load,
  };
}