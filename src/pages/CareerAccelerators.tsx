import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Library } from "lucide-react";
import ProductGallery from "@/components/accelerators/ProductGallery";
import MyLibrary from "@/components/accelerators/MyLibrary";

const CareerAccelerators = () => {
  // In a real app this would come from Supabase; mock for now
  const [purchasedIds] = useState<Set<string>>(new Set());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Career Accelerators
          </h1>
          <p className="text-sm text-muted-foreground">
            Premium resources to fast-track your job search and career growth.
          </p>
        </div>

        <Tabs defaultValue="gallery">
          <TabsList>
            <TabsTrigger value="gallery" className="gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              Product Gallery
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5">
              <Library className="h-3.5 w-3.5" />
              My Library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery">
            <ProductGallery />
          </TabsContent>

          <TabsContent value="library">
            <MyLibrary purchasedIds={purchasedIds} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CareerAccelerators;
