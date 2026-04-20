import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import TrustBar from '../components/TrustBar';
import FeaturesSection from '../components/FeaturesSection';
import HowItWorks from '../components/HowItWorks';
import CTABanner from '../components/CTABanner';
import Footer from '../components/Footer';

const Landing = () => {
  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <HeroSection />
        <TrustBar />
        <FeaturesSection />
        <HowItWorks />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
