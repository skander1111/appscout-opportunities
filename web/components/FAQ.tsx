"use client";
import { useState } from "react";

const faqs = [
  {
    q: "What exactly does AppScout find?",
    a: "Five types of opportunity: (1) abandoned mobile apps with 500k+ installs and a reachable indie developer, (2) public Reddit seller posts from people trying to sell their apps, (3) abandoned GitHub projects with real user traction, (4) startup and tech signals from Hacker News and Product Hunt, and (5) market trends worth watching. Each is classified as Acquire, Rebuild, or Partner.",
  },
  {
    q: "What do Acquire, Rebuild, and Partner mean?",
    a: "Acquire means the app has been abandoned — buy it before it lists on Flippa. Rebuild means the demand is real but the execution is broken — build a better version and capture the existing audience. Partner means the developer is still active but overwhelmed — reach out before they give up or list elsewhere.",
  },
  {
    q: "Are the developer emails real?",
    a: "Yes — 100% of qualified opportunities have a verified developer email pulled directly from the App Store or Play Store listing. We never guess or generate contacts. If an app has no public contact, it doesn't appear in the results.",
  },
  {
    q: "Can I contact the developers myself?",
    a: "Yes. Every opportunity card includes a one-click outreach email draft — personalized to the specific app. You copy it, paste it into Gmail, and send. We never contact developers on your behalf.",
  },
  {
    q: "What's the difference between the live dashboard and the weekly report?",
    a: "The live dashboard shows all 54 qualified opportunities updating in real time — you can filter by niche, sort by score, and copy outreach emails instantly. The weekly report is a frozen, human-reviewed snapshot published every Friday at 08:00 — curated to the top 10–15 picks with full analysis. The dashboard is for exploring. The report is for acting.",
  },
  {
    q: "What niches do you scan?",
    a: "Currently: PDF tools, unit converters, habit trackers, timer apps, calculator apps, weather apps, wallpaper apps, meditation apps, ringtone apps, barcode scanners, flashcard apps, calorie counters, dictionary apps, prayer time apps, and more. New niches are added weekly based on subscriber requests.",
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
