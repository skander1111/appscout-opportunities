import BuyButton from "./BuyButton";

const GUMROAD_LINKS = {
  report: "https://skander46.gumroad.com/l/flfjnx",
  monthly: "https://skander46.gumroad.com/l/flfjnx",
  agency: "https://skander46.gumroad.com/l/flfjnx",
};

const plans = [
  {
    id: "report" as const,
    name: "One Report",
    price: "€19",
    period: "one time",
    description: "Perfect for testing the water.",
    features: [
      "10 potential acquisition targets",
      "5 rebuild opportunity profiles",
      "Full analysis per app (score, risk, why)",
      "Developer contact info (email)",
      "Ready-to-send outreach email draft",
      "Due diligence checklist per app",
      "Delivered within 24 hours",
    ],
    cta: "Buy this week's report — €19",
    highlight: false,
    note: "No subscription · one payment",
  },
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "€49",
    period: "per month",
    description: "New report every week. Cancel anytime.",
    features: [
      "Everything in One Report",
      "New report every Monday",
      "~50 opportunities per month",
      "Niche ranking comparison",
      "Priority access to new niches",
      "Email support",
    ],
    cta: "Start monthly plan — €49/mo",
    highlight: true,
    note: "Most popular · cancel anytime",
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: "€199",
    period: "per month",
    description: "For studios and acquisition firms.",
    features: [
      "Everything in Monthly",
      "~300 opportunities per month",
      "Custom niche requests",
      "CSV / JSON data export",
      "Outreach tracking dashboard",
      "Priority support",
    ],
    cta: "Get agency plan — €199/mo",
    highlight: false,
    note: "Best for teams",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-neon text-xs font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple pricing</h2>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Pay once for a single report. Upgrade to monthly when you&apos;re ready.
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
                  <span className="text-zinc-500 text-sm mb-1.5">/{plan.period}</span>
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

        <div className="mt-12 text-center">
          <p className="text-sm text-zinc-500">
            Not sure yet?{" "}
            <a href="#sample" className="text-neon hover:opacity-80 transition-opacity">
              See a sample report card above
            </a>
            . Questions?{" "}
            <a href="mailto:aloui.skander01@gmail.com" className="text-neon hover:opacity-80 transition-opacity">
              Email us
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
