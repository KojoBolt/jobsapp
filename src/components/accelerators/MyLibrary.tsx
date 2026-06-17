import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Play, BookOpen, Video, FileText, Library } from "lucide-react";
import { type Product } from "@/hooks/useAccelerators";

function iconFor(product: Product): React.ElementType {
  if (product.type === "video") return Video;
  if (product.category?.toLowerCase().includes("template")) return FileText;
  return BookOpen;
}

interface MyLibraryProps {
  products: Product[];
  purchasedIds: Set<string>;
  loading: boolean;
  downloadingId: string | null;
  onDownload: (productId: string) => void;
}

const MyLibrary = ({ products, purchasedIds, loading, downloadingId, onDownload }: MyLibraryProps) => {
  const purchased = products.filter((p) => purchasedIds.has(p.id));

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl border border-border/50 bg-card" />
        ))}
      </div>
    );
  }

  if (purchased.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Library className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold text-foreground">Your Library is Empty</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Products you purchase will appear here for instant download or streaming.
          Browse the gallery to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {purchased.map((product) => {
        const Icon = iconFor(product);
        const isVideo = product.type === "video";
        const busy = downloadingId === product.id;
        return (
          <Card key={product.id} className="border-border/50 bg-card">
            <CardContent className="flex items-start gap-4 p-5">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                {product.cover_url ? (
                  <img src={product.cover_url} alt={product.title} className="h-12 w-12 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                    <Icon className="h-6 w-6 text-foreground/40" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h4 className="truncate text-sm font-semibold text-foreground">{product.title}</h4>
                {product.category && (
                  <Badge variant="outline" className="text-[10px]">{product.category}</Badge>
                )}
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => onDownload(product.id)}
                  disabled={busy}
                >
                  {isVideo ? <Play className="mr-1.5 h-3.5 w-3.5" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                  {busy ? "Opening…" : isVideo ? "Watch Now" : "Download"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MyLibrary;