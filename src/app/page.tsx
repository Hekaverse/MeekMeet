import Navbar from "./components/Navbar";
import HeroSection from "./components/HeroSection";
import WhoWeAre from "./components/WhoWeAre";
import VisionSection from "./components/VisionSection";
import HowItWorks from "./components/HowItWorks";
import NewMoonSection from "./components/NewMoonSection";
import FeaturesSection from "./components/FeaturesSection";
import SafetyTrust from "./components/SafetyTrust";
import LeaderCTA from "./components/LeaderCTA";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <WhoWeAre />
        <VisionSection />
        <HowItWorks />
        <NewMoonSection />
        <FeaturesSection />
        <SafetyTrust />
        <LeaderCTA />
      </main>
      <Footer />
    </>
  );
}
