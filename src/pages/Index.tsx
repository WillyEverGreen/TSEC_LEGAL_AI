import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesGridBento from "@/components/FeaturesGridBento";
import TimelineSection from "@/components/TimelineSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-[#09090B] text-white selection:bg-purple-500/30">
      <Header />
      <HeroSection />
      <FeaturesGridBento />
      <TimelineSection />
      <FAQSection />
      <CTASection />
      
      {/* Footer */}
      <footer className="py-12 text-center text-[#f8f8f8]/50 text-sm border-t border-[#f8f8f8]/10 bg-[#09090B]">
        <p>&copy; 2025 Legal Compass AI. Built for the Future of Indian Law.</p>
      </footer>
    </div>
  );
};

export default Index;
