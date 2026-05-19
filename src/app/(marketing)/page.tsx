import HeroSection from "./_components/HeroSection";
import FeaturesSection from "./_components/FeaturesSection";
import NewMoonSection from "./_components/NewMoonSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <section id="new-moon">
        <NewMoonSection />
      </section>
    </>
  );
}
