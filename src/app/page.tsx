import Navbar from "@/components/sections/navbar";
import HeroSection from "@/components/sections/hero";
import ServicesSection from "@/components/sections/services";
import CaseStudies from "@/components/sections/case-studies";
import TestimonialSection from "@/components/sections/testimonials";
import TrustedBy from "@/components/sections/trusted-by";
import PricingSection from "@/components/sections/pricing";
import FAQSection from "@/components/sections/faq";
import Footer from "@/components/sections/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#ffffff]">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <CaseStudies />
      <TestimonialSection />
      <TrustedBy />
      <PricingSection />
      <FAQSection />
      <Footer />
    </main>
  );
}
