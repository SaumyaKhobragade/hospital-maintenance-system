"use client";

import Link from "next/link";
import { HeartPulse } from "lucide-react";

const footerLinks = [
  {
    heading: "Platform",
    links: [
      { label: "AI Triage", href: "#" },
      { label: "Voice Intake", href: "#" },
      { label: "Clinical AI", href: "#" },
      { label: "Telemetry", href: "#" },
      { label: "Emergency Alerts", href: "#" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Press", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Security", href: "#" },
      { label: "Compliance", href: "#" },
    ],
  },
  {
    heading: "Contact",
    links: [
      { label: "support@hms.ai", href: "mailto:support@hms.ai" },
      { label: "+1 (555) 010-1010", href: "tel:+15550101010" },
      { label: "GitHub", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                <HeartPulse className="w-4 h-4" />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">
                HMS
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[200px]">
              AI-powered emergency healthcare intelligence platform.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.heading}>
              <h4 className="text-[13px] font-semibold text-slate-200 mb-4 uppercase tracking-wider">
                {group.heading}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-14 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-slate-500">
            © {new Date().getFullYear()} HMS Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "HIPAA"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[13px] text-slate-500 hover:text-white transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
