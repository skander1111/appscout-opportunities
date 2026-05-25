import Nav from "@/components/Nav";
import TerminalHero from "@/components/TerminalHero";
import SocialProofBar from "@/components/SocialProofBar";
import OperatorJourney from "@/components/OperatorJourney";
import PredictionLayerSection from "@/components/PredictionLayerSection";
import CaseStudyShowcase from "@/components/CaseStudyShowcase";
import ToolsGrid from "@/components/ToolsGrid";
import ComparisonTable from "@/components/ComparisonTable";
import SubmitProjectTeaser from "@/components/SubmitProjectTeaser";
import WeeklyReportSection from "@/components/WeeklyReportSection";
import SourcesSection from "@/components/SourcesSection";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050508] text-white">
      <Nav />
      <TerminalHero />
      <SocialProofBar />
      <OperatorJourney />
      <PredictionLayerSection />
      <CaseStudyShowcase />
      <ToolsGrid />
      <ComparisonTable />
      <SubmitProjectTeaser />
      <WeeklyReportSection />
      <SourcesSection />
      <Pricing />
      <FAQ />
      <FinalCta />
      <Footer />
    </main>
  );
}
