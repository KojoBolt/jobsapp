import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SocialProofTicker from "@/components/accelerators/SocialProofTicker";
import { ShoppingBag, Library } from "lucide-react";
import ProductGallery from "@/components/accelerators/ProductGallery";
import MyLibrary from "@/components/accelerators/MyLibrary";
import { useAccelerators } from "@/hooks/useAccelerators";
import SocialProofStrip from "@/pages/Socialproofstrip";
// import CareerLadderNavigator from "@/pages/CareerLadderNavigator";

const CareerAccelerators = () => {
  const {
    products,
    purchasedIds,
    loading,
    buyingId,
    downloadingId,
    buy,
    download,
  } = useAccelerators();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Career Accelerators</h1>
          <p className="text-sm text-muted-foreground">
            Premium resources to fast-track your job search and career growth.
          </p>
        </div>
        <div>
          <SocialProofStrip />
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
            <ProductGallery
              products={products}
              purchasedIds={purchasedIds}
              loading={loading}
              buyingId={buyingId}
              onBuy={buy}
            />
          </TabsContent>

          <TabsContent value="library">
            <MyLibrary
              products={products}
              purchasedIds={purchasedIds}
              loading={loading}
              downloadingId={downloadingId}
              onDownload={download}
            />
          </TabsContent>
        </Tabs>
        {/* <div>
          <CareerLadderNavigator />
        </div> */}

        <SocialProofTicker/>
      </div>
    </DashboardLayout>
  );
};

export default CareerAccelerators;