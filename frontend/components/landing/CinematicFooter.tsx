"use client";

import { HeartPulse } from "lucide-react";

const footerLinks = [
  {
    heading: "Platform",
    links: ["AI Triage", "Voice Intake", "Clinical AI", "Telemetry", "Alerts"],
  },
  {
    heading: "Company",
    links: ["About", "Careers", "Press", "Blog"],
  },
  {
    heading: "Resources",
    links: ["Documentation", "API Reference", "Security", "Compliance"],
  },
  {
    heading: "Contact",
    links: ["support@hms.ai", "+1 (555) 010-1010", "GitHub"],
  },
];

export default function CinematicFooter() {
  return (
    <footer className="bg-[#faf7f4] border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-[15px] font-bold text-stone-800 tracking-tight">HMS</span>
            </div>
            <p className="text-sm text-stone-500 leading-relaxed max-w-[200px]">
              AI-powered emergency healthcare intelligence platform.
            </p>
          </div>

          {footerLinks.map((g) => (
            <div key={g.heading}>
              <h4 className="text-[12px] font-semibold text-stone-500 mb-4 uppercase tracking-wider">
                {g.heading}
              </h4>
              <ul className="space-y-2.5">
                {g.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-stone-500 hover:text-stone-800 transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-stone-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-stone-500">
            © {new Date().getFullYear()} HMS Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "HIPAA"].map((item) => (
              <a key={item} href="#" className="text-[13px] text-stone-500 hover:text-stone-800 transition-colors">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
