import FeaturesSection from "@/components/landing/feature-section";
import Footer from "@/components/landing/footer";
import HeroSection from "@/components/landing/hero-section";
import HowItWorksSection from "@/components/landing/how-it-works";
import LandingNav from "@/components/landing/landing-nav";
import CTASection from "@/components/landing/cta-section";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Landing;
