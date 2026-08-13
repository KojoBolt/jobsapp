import Navbar from "@/components/hompage/Navbar";
import Hero from "@/components/hompage/Hero";
import CTA from "@/components/hompage/CTA";
import FAQ from "@/components/hompage/Faq";
import Pricing from "@/components/hompage/Pricing";
import Footer from "@/components/hompage/Footer";
import SoftBackdrop from "@/components/hompage/SoftBackdrop";
import LenisScroll from "@/components/hompage/lenis";
import Features from "@/components/hompage/Features";
import Testimonials from "@/components/hompage/Testimonials";
import MatchPreview from "@/components/hompage/MatchPreview";
import Toolkit from "@/components/hompage/Toolkit";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SoftBackdrop />
			<LenisScroll />
      <Navbar />
      <Hero />
      <Features/>
      <MatchPreview />
      <Toolkit />
      <Testimonials />
      <CTA />
      <FAQ />
      <Pricing />
      <Footer />
      
    </div>
  );
};

export default Index;

