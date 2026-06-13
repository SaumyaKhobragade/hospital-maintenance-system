"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Users, Target, Building2, Clock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: "top 85%",
      onEnter: () => setStarted(true),
      once: true,
    });
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration * 60);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const metrics = [
  {
    icon: Users,
    label: "Patients Processed",
    value: 284000,
    suffix: "+",
    iconBg: "bg-teal-100/80",
    iconColor: "text-teal-700",
  },
  {
    icon: Target,
    label: "AI Accuracy",
    value: 99.7,
    suffix: "%",
    iconBg: "bg-emerald-100/80",
    iconColor: "text-emerald-700",
    isDecimal: true,
  },
  {
    icon: Building2,
    label: "Hospitals Connected",
    value: 120,
    suffix: "+",
    iconBg: "bg-violet-100/80",
    iconColor: "text-violet-600",
  },
  {
    icon: Clock,
    label: "Avg Response Time",
    value: 1.2,
    suffix: "s",
    prefix: "<",
    iconBg: "bg-amber-100/80",
    iconColor: "text-amber-700",
    isDecimal: true,
  },
];

export default function CinematicMetrics() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { opacity: 0, y: 40, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              end: "top 65%",
              scrub: 0.5,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative py-28 bg-gradient-to-b from-[#faf7f4] via-white to-[#faf7f4]"
    >
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[13px] font-semibold tracking-[0.2em] uppercase text-teal-700/50 mb-3">
            Trusted at Scale
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight">
            Proven in Production
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              ref={(el) => { cardsRef.current[i] = el; }}
              className="opacity-0"
            >
              <div className="relative rounded-2xl border border-stone-200/50 bg-white/80 backdrop-blur-sm p-7 hover:bg-white hover:shadow-lg hover:shadow-stone-200/40 transition-all duration-300 group">
                <div className={`w-11 h-11 rounded-xl ${m.iconBg} flex items-center justify-center mb-5`}>
                  <m.icon className={`w-5 h-5 ${m.iconColor}`} />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight mb-1.5">
                  {m.isDecimal ? (
                    <span>{m.prefix}{m.value}{m.suffix}</span>
                  ) : (
                    <AnimatedCounter
                      target={m.value}
                      suffix={m.suffix}
                      prefix={m.prefix || ""}
                    />
                  )}
                </div>
                <p className="text-sm text-stone-500 font-medium">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
