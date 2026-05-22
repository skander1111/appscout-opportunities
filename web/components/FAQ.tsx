"use client";
import { useState } from "react";

const faqs = [
  {
    q: "How do you find these apps?",
    a: "We scan the App Store and Google Play using public APIs — app details, installs, ratings, last update date, and developer contact. Our engine scores each app using an abandonment model: days since update, install count, owner type (solo indie vs. big company), and review sentiment.",
  },
  {
    q: "Are the developer emails real?",
    a: "Yes — they come directly from App Store and Play Store developer profiles. We don't guess or generate emails. If an app lists no public contact, we flag it as 'low reachability' in the report.",
  },
  {
    q: "Can I contact the developers myself?",
    a: "Yes, and we recommend it. The report includes a ready-to-use outreach email draft per app. You send it from your own account. We never contact developers on your behalf without your explicit approval.",
  },
  {
    q: "What if an app I'm interested in is already sold?",
    a: "The report reflects data from the current week. We can't guarantee the developer hasn't sold elsewhere, which is why we recommend moving fast on the top opportunities. We flag portfolio-owned apps where possible.",
  },
  {
    q: "Is there a free version?",
    a: "The sample opportunity above shows what the report looks like. Contact details, full complaint analysis, and outreach drafts are locked behind the paid report.",
  },
  {
    q: "What niches do you scan?",
    a: "Currently: PDF tools, unit converters, habit trackers, expense trackers, timer apps, compass utilities, dictionary apps, quiz games, ringtone apps, wallpaper apps, calorie counters, meditation apps, prayer time apps, and more. We add new niches based on subscriber requests.",
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
