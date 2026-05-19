import WhoWeAre from "../_components/WhoWeAre";
import VisionSection from "../_components/VisionSection";
import HowItWorks from "../_components/HowItWorks";
import SafetyTrust from "../_components/SafetyTrust";

export default function AboutPage() {
  return (
    <>
      <section id="who-we-are" className="scroll-mt-20">
        <WhoWeAre />
      </section>
      <section id="heart" className="scroll-mt-20">
        <VisionSection />
      </section>
      <section id="journey" className="scroll-mt-20">
        <HowItWorks />
      </section>
      <section id="safety" className="scroll-mt-20">
        <SafetyTrust />
      </section>
    </>
  );
}
