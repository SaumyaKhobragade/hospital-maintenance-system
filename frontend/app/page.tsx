"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CinematicNavbar from "../components/landing/CinematicNavbar";
import ScrollRevealHero from "../components/landing/ScrollRevealHero";
import FloatingPanels from "../components/landing/FloatingPanels";
import CinematicMetrics from "../components/landing/CinematicMetrics";
import CinematicFeatures from "../components/landing/CinematicFeatures";
import CinematicWorkflow from "../components/landing/CinematicWorkflow";
import DashboardReveal from "../components/landing/DashboardReveal";
import CinematicCTA from "../components/landing/CinematicCTA";
import CinematicFooter from "../components/landing/CinematicFooter";

export default function LandingPage() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    /* refresh ScrollTrigger after images/fonts load */
    const handleLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("load", handleLoad);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#faf7f4] overflow-x-hidden">
      <CinematicNavbar />
      <ScrollRevealHero />
      <FloatingPanels />
      <CinematicMetrics />
      <CinematicFeatures />
      <CinematicWorkflow />
      <DashboardReveal />
      <CinematicCTA />
      <CinematicFooter />
    </div>
  );
}
