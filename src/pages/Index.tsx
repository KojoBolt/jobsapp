import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import ProcessSection from "@/components/landing/ProcessSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ProcessSection />
      <PricingSection />
      <Footer />
    </div>
  );
};

export default Index;
