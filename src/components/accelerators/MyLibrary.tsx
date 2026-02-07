import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Play, BookOpen, FileText, Video, Library } from "lucide-react";
import type { Product } from "@/data/products";
import { products } from "@/data/products";

const categoryIcons: Record<string, React.ElementType> = {
  "E-Book": BookOpen,
  "Video Series": Video,
  "Video Masterclass": Video,
  "PDF Bundle": FileText,
  "Template Kit": FileText,
};

interface MyLibraryProps {
  purchasedIds: Set<string>;
}

const MyLibrary = ({ purchasedIds }: MyLibraryProps) => {
  const purchased = products.filter((p) => purchasedIds.has(p.id));

  if (purchased.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Library className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h3 className="text-lg font-semibold text-foreground">
          Your Library is Empty
        </h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Products you purchase will appear here for instant download or
          streaming. Browse the gallery to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {purchased.map((product) => {
        const Icon = categoryIcons[product.category] || FileText;
        return (
          <Card
            key={product.id}
            className="border-border/50 bg-card"
          >
            <CardContent className="flex items-start gap-4 p-5">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${product.imageGradient}`}
              >
                <Icon className="h-6 w-6 text-foreground/40" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h4 className="truncate text-sm font-semibold text-foreground">
                  {product.title}
                </h4>
                <Badge variant="outline" className="text-[10px]">
                  {product.category}
                </Badge>
                <div>
                  {product.deliveryType === "video" ? (
                    <Button variant="default" size="sm" className="w-full">
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Watch Now
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" className="w-full">
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MyLibrary;
