import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import ThreeWays from "@/components/ThreeWays";
import HowItWorks from "@/components/HowItWorks";
import TrustSection from "@/components/TrustSection";
import SampleOpportunity from "@/components/SampleOpportunity";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />
      <Hero />
      <StatsSection />
      <ThreeWays />
      <HowItWorks />
      <TrustSection />
      <SampleOpportunity />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
