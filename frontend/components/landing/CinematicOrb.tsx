"use client";

import { useRef, useEffect, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ---------- tiny canvas particle layer ---------- */
function useParticles(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    interface Particle {
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      alpha: number;
      pulse: number;
    }

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.4 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      const t = performance.now() * 0.001;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W();
        if (p.x > W()) p.x = 0;
        if (p.y < 0) p.y = H();
        if (p.y > H()) p.y = 0;

        const a = p.alpha * (0.6 + 0.4 * Math.sin(t * 0.8 + p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(115,160,140,${a})`;
        ctx.fill();
      }

      /* connection lines between nearby particles */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(115,160,140,${0.07 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef]);
}

export default function CinematicOrb({ sectionRef: externalSectionRef }: { sectionRef?: React.RefObject<HTMLDivElement | null> }) {
  const localSectionRef = useRef<HTMLDivElement>(null);
  const sectionRef = externalSectionRef || localSectionRef;
  const orbRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useParticles(canvasRef);

  useEffect(() => {
    const ctx = gsap.context(() => {
      /* pin the opening scene for 100vh of scroll */
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top top",
        end: "+=100%",
        pin: true,
        pinSpacing: true,
      });

      /* orb scale-down + fade */
      gsap.to(orbRef.current, {
        scale: 0.3,
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=100%",
          scrub: 1.2,
        },
      });

      /* rings expand and fade */
      gsap.to(ringsRef.current, {
        scale: 2.5,
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=80%",
          scrub: 1,
        },
      });

      /* particle canvas fades */
      gsap.to(canvasRef.current, {
        opacity: 0,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "10% top",
          end: "+=70%",
          scrub: 1,
        },
      });

      /* tagline emerges then fades */
      gsap.fromTo(
        contentRef.current,
        { opacity: 1, y: 0 },
        {
          opacity: 0,
          y: -60,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=60%",
            scrub: 1,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-[#faf7f4]"
    >
      {/* warm ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-teal-600/[0.04] blur-[180px]" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-emerald-500/[0.04] blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-amber-400/[0.03] blur-[100px]" />
      </div>

      {/* particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.5 }}
      />

      {/* orb composite */}
      <div
        ref={orbRef}
        className="relative z-10 flex items-center justify-center"
        style={{ willChange: "transform, opacity" }}
      >
        {/* rotating rings */}
        <div ref={ringsRef} className="absolute">
          {/* outer ring */}
          <div
            className="w-[420px] h-[420px] md:w-[520px] md:h-[520px] rounded-full border border-teal-700/10 animate-[spin_30s_linear_infinite]"
          >
            {/* orbit dots */}
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <div
                key={deg}
                className="absolute w-2 h-2 rounded-full bg-teal-600/30"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${deg}deg) translateY(-50%) translateX(${260}px)`,
                }}
              />
            ))}
          </div>
          {/* middle ring */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[400px] md:h-[400px] rounded-full border border-emerald-600/[0.07] animate-[spin_22s_linear_infinite_reverse]"
          />
          {/* inner ring */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] md:w-[280px] md:h-[280px] rounded-full border border-stone-400/[0.08] animate-[spin_16s_linear_infinite]"
          />
        </div>

        {/* glowing core sphere */}
        <div className="relative w-[180px] h-[180px] md:w-[240px] md:h-[240px]">
          {/* outer glow */}
          <div className="absolute -inset-16 rounded-full bg-teal-500/[0.06] blur-[60px] animate-pulse" />
          {/* mid glow */}
          <div className="absolute -inset-8 rounded-full bg-emerald-400/[0.08] blur-[40px]" />
          {/* sphere surface */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-500/20 via-emerald-400/15 to-stone-400/20 backdrop-blur-sm border border-stone-300/20 shadow-[0_0_80px_rgba(20,120,100,0.08)]">
            {/* inner highlight */}
            <div className="absolute top-[15%] left-[20%] w-[45%] h-[35%] rounded-full bg-white/20 blur-[12px]" />
          </div>
          {/* center pulse */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full bg-teal-400/20 blur-md animate-ping" style={{ animationDuration: "3s" }} />
          {/* heartbeat icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-700/40">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
        </div>
      </div>

      {/* text overlay */}
      <div
        ref={contentRef}
        className="absolute bottom-[14%] left-0 right-0 text-center z-20 px-6"
      >
        <p className="text-[13px] md:text-sm font-medium tracking-[0.25em] uppercase text-teal-700/40 mb-3">
          Healthcare Intelligence Network
        </p>
        <p className="text-stone-500/50 text-sm md:text-base max-w-md mx-auto leading-relaxed font-light">
          Scroll to enter the platform
        </p>
        {/* animated scroll indicator */}
        <div className="mt-8 flex justify-center">
          <div className="w-6 h-10 rounded-full border border-stone-400/20 flex items-start justify-center p-1.5">
            <div className="w-1 h-2.5 rounded-full bg-stone-500/30 animate-bounce" style={{ animationDuration: "2s" }} />
          </div>
        </div>
      </div>
    </section>
  );
}
