"use client";
import { useState } from "react";

const faqs = [
  {
    q: "What exactly does AppScout find?",
    a: "Seven types of opportunity: (1) abandoned mobile apps with reachable indie developers, (2) rebuild targets with proven demand but broken execution, (3) GitHub projects with real user traction but no maintainer, (4) public seller leads from Reddit and forums, (5) startup signals from Hacker News and Product Hunt, (6) partner / co-founder requests from active builders, (7) projects users submit through the marketplace. Every one is AI-scored and tagged with an action: acquire, rebuild, buy, partner, or watch.",
  },
  {
    q: "What's the AI prediction layer?",
    a: "Each opportunity is scored on 8 axes by Claude — opportunity, demand, money potential, build difficulty, acquisition difficulty, legal risk, competition risk, plus a recommended action and outreach draft. Free users see the headline score; Monthly unlocks basic AI; Yearly unlocks the full layer including outreach drafts, due-diligence checklists, and profile-based matching.",
  },
  {
    q: "What's the difference between the three plans?",
    a: "One Report ($9) — this Friday's frozen report, one-time. Monthly ($19) — the live terminal, every weekly report, full contact details, basic AI. Yearly ($119) — everything plus the full AI prediction layer, profile match, project upload priority, and premium alerts. Yearly is ~48% cheaper than 12 months of Monthly.",
  },
  {
    q: "Are the developer contacts real?",
    a: "Yes. All contacts are pulled directly from public App Store / Play Store listings, GitHub profiles, or the original public source. We never guess or generate contacts. If we can't find one, the opportunity is flagged with low reachability.",
  },
  {
    q: "Can I submit my own project?",
    a: "Yes — that's the marketplace. Submit your app, idea, MVP, or unfinished project and tell AppScout whether you want a buyer, partner, builder, investor, or just feedback. Yearly members get priority review and buyer matching.",
  },
  {
    q: "What's the difference between the live terminal and the weekly report?",
    a: "The terminal updates continuously across all sources — you filter, sort, copy outreach, and act on signals in real time. The Friday 08:00 report is a frozen, human-reviewed snapshot with the week's top picks across all seven categories. Terminal is for exploring. Report is for acting.",
  },
  {
    q: "How is this not just news?",
    a: "Because every signal answers one question: can someone buy, rebuild, partner, sell, or make money from this? News and trend articles that don't lead to a deal don't make it into AppScout. We track opportunities, not headlines.",
  },
];

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 py-5">
      <button
        className="flex w-full items-start justify-between text-left gap-4"
        onClick={() => setOpen(!open)}
      >
        <span className="text-sm font-medium text-white">{q}</span>
        <span className="text-zinc-400 flex-shrink-0 mt-0.5">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function FAQSection() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">Questions</h2>
        {faqs.map((faq) => (
          <FAQ key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>
    </section>
  );
}
