import BuyButton from "./BuyButton";

// Until separate Gumroad products exist, all three CTAs point to the same SKU.
// Replace each link as products are created.
const GUMROAD_LINKS = {
  report:  "https://skander46.gumroad.com/l/flfjnx",
  monthly: "https://skander46.gumroad.com/l/flfjnx",
  yearly:  "https://skander46.gumroad.com/l/flfjnx",
};

const plans = [
  {
    id: "report" as const,
    name: "Day Pass",
    price: "$9",
    period: "24 hours",
    description: "Test the full terminal for one day.",
    features: [
      "24-hour access from activation",
      "Live terminal + all sources",
      "150 AI calls included",
      "Full prediction layer (8 scores)",
      "Outreach drafts + due-diligence",
      "ROI simulator + reverse lookup",
      "No subscription · no auto-renew",
    ],
    cta: "Buy 24h pass — $9",
    highlight: false,
    note: "One payment · ends after 24h",
  },
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "$19",
    period: "30 days",
    description: "Full terminal + AI for one month.",
    features: [
      "30-day access from activation",
      "Live terminal + all sources",
      "600 AI calls (~20/day)",
      "Full prediction layer (8 scores)",
      "ROI simulator + deep dives",
      "Profile match + AI search",
      "Weekly Friday 08:00 reports",
    ],
    cta: "Start monthly — $19",
    highlight: true,
    note: "Most popular · no auto-renew",
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: "$119",
    period: "365 days",
    description: "Full intelligence stack for a year.",
    features: [
      "365-day access from activation",
      "Everything in Monthly",
      "6,000 AI calls (~16/day)",
      "Project upload priority",
      "Buyer / partner matching",
      "Premium alerts + saved opportunities",
      "Best value — ~48% off monthly",
    ],
    cta: "Get yearly — $119",
    highlight: false,
    note: "Best for serious operators",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">One time. No subscriptions.</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Pay once, get a code, activate. Your license expires automatically — no auto-renew, no surprise charges.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                plan.highlight ? "" : "bg-white/[0.03] border border-white/8 card-hover"
              }`}
              style={
                plan.highlight
                  ? {
                      background: "linear-gradient(160deg, rgba(0,255,136,0.07) 0%, rgba(0,255,136,0.02) 100%)",
                      border: "1px solid rgba(0,255,136,0.3)",
                      boxShadow: "0 0 60px rgba(0,255,136,0.1), inset 0 1px 0 rgba(0,255,136,0.12)",
                    }
                  : undefined
              }
            >
              {plan.highlight && (
                <>
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,136,0.6), transparent)" }}
                  />
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
                    style={{ background: "linear-gradient(135deg, #00ff88, #00cc6a)" }}
                  >
                    Most popular
                  </div>
                </>
              )}

              <div className="mb-6">
                <div className="text-xs text-zinc-500 uppercase tracking-widest mb-2">{plan.name}</div>
                <div className="flex items-end gap-2 mb-3">
                  <span
                    className={`text-5xl font-bold tracking-tight ${plan.highlight ? "text-neon" : "text-white"}`}
                    style={plan.highlight ? { textShadow: "0 0 30px rgba(0,255,136,0.4)" } : undefined}
                  >
                    {plan.price}
                  </span>
                  <span className="text-zinc-500 text-sm mb-1.5">/ {plan.period}</span>
                </div>
                <p className="text-sm text-zinc-400">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-neon mt-0.5 flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <BuyButton
                href={GUMROAD_LINKS[plan.id]}
                label={plan.cta}
                className={plan.highlight ? "text-black font-bold" : "border border-white/10 hover:border-white/25 text-white hover:bg-white/[0.04]"}
                style={
                  plan.highlight
                    ? {
                        background: "linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)",
                        boxShadow: "0 0 25px rgba(0,255,136,0.4)",
                      }
                    : undefined
                }
              />

              <p className="text-center text-xs text-zinc-600 mt-3">{plan.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center space-y-3">
          <p className="text-sm text-zinc-400">
            How it works: pay on Gumroad → get a license code by email → paste it at{" "}
            <a href="/activate" className="text-neon hover:opacity-80">/activate</a> → AI unlocks instantly.
          </p>
          <p className="text-xs text-zinc-600">
            Free tier always includes: terminal browsing, pulse digest, watchlist, reviews stream, niche map, app-of-the-day, and submit project.
          </p>
        </div>

        {/* what's locked */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#0a0a10] border border-[#1a1a26] rounded-2xl p-6">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-neon font-semibold mb-3">Free for everyone</p>
            <ul className="space-y-1.5 text-sm text-zinc-400">
              <li>· Browse live terminal</li>
              <li>· Pulse digest</li>
              <li>· Watchlist (★ pin)</li>
              <li>· Niche heat map</li>
              <li>· Reviews stream</li>
              <li>· App-of-the-day (1 free Claude dive / day)</li>
              <li>· Submit project to marketplace</li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-yellow-400 font-semibold mb-3">🔒 Locked behind license</p>
            <ul className="space-y-1.5 text-sm text-zinc-400">
              <li>· AI prediction (per-opportunity)</li>
              <li>· AI search (natural language)</li>
              <li>· Reverse URL lookup with fresh AI</li>
              <li>· ROI simulator</li>
              <li>· Profile match (AI ranking)</li>
              <li>· Targeted deep dives</li>
              <li>· Outreach drafts + monetization plans</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
