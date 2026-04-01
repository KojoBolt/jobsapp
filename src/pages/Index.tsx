// import Navbar from "@/components/landing/Navbar";
// import Hero from "@/components/landing/Hero";
// import ProcessSection from "@/components/landing/ProcessSection";
// import PricingSection from "@/components/landing/PricingSection";
// import FAQSection from "@/components/landing/FAQSection";
// import Footer from "@/components/landing/Footer";

// const Index = () => {
//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
//       <Hero />
//       <ProcessSection />
//       <PricingSection />
//       <FAQSection />
//       <Footer />
//     </div>
//   );
// };

// export default Index;

import Navbar from "@/components/hompage/Navbar";
import Hero from "@/components/hompage/Hero";
import CTA from "@/components/hompage/CTA";
import FAQ from "@/components/hompage/Faq";
import Pricing from "@/components/hompage/Pricing";
import Footer from "@/components/hompage/Footer";
import SoftBackdrop from "@/components/hompage/SoftBackdrop";
import LenisScroll from "@/components/hompage/lenis";
import Features from "@/components/hompage/Features";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SoftBackdrop />
			<LenisScroll />
      <Navbar />
      <Hero />
      <Features/>
      <CTA />
      <FAQ />
      <Pricing />
      <Footer />
      
    </div>
  );
};

export default Index;

