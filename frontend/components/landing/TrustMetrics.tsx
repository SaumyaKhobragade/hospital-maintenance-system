"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Users, Target, Building2, Clock } from "lucide-react";

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
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (!isInView) return;
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
  }, [isInView, target, duration]);

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
    color: "from-blue-500 to-blue-600",
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-600",
  },
  {
    icon: Target,
    label: "AI Accuracy",
    value: 99.7,
    suffix: "%",
    color: "from-emerald-500 to-emerald-600",
    bgColor: "bg-emerald-500/10",
    iconColor: "text-emerald-600",
    isDecimal: true,
  },
  {
    icon: Building2,
    label: "Hospitals Connected",
    value: 120,
    suffix: "+",
    color: "from-violet-500 to-violet-600",
    bgColor: "bg-violet-500/10",
    iconColor: "text-violet-600",
  },
  {
    icon: Clock,
    label: "Avg Response Time",
    value: 1.2,
    suffix: "s",
    prefix: "<",
    color: "from-amber-500 to-amber-600",
    bgColor: "bg-amber-500/10",
    iconColor: "text-amber-600",
    isDecimal: true,
  },
];

export default function TrustMetrics() {
  return (
    <section className="relative py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">
            Trusted at Scale
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
            Proven in Production
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div className="relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                {/* Gradient accent line */}
                <div
                  className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${metric.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className={`w-11 h-11 rounded-xl ${metric.bgColor} flex items-center justify-center mb-5`}>
                  <metric.icon className={`w-5 h-5 ${metric.iconColor}`} />
                </div>

                <div className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-1.5">
                  {metric.isDecimal ? (
                    <span>
                      {metric.prefix}
                      {metric.value}
                      {metric.suffix}
                    </span>
                  ) : (
                    <AnimatedCounter
                      target={metric.value}
                      suffix={metric.suffix}
                      prefix={metric.prefix || ""}
                    />
                  )}
                </div>

                <p className="text-sm text-slate-500 font-medium">{metric.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
