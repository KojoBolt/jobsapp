import CountUp from "react-countup";

const STATS = [
  {
    label: "Students Helped",
    endValue: 5000,
    prefix: "",
    suffix: "",
    growth: "↑ 18.2% this month",
    glowColor: "bg-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    barColor: "bg-blue-500/20",
    bars: [30, 45, 25, 60, 40, 80, 65],
    // Briefcase / send icon
    svgPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    ),
  },
  {
    label: "Interviews",
    endValue: 1240,
    prefix: "",
    suffix: "",
    growth: "↑ 12% this month",
    glowColor: "bg-violet-500/20",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    barColor: "bg-violet-500/20",
    bars: [20, 50, 35, 55, 45, 70, 60],
    // Calendar / interview icon
    svgPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    ),
  },
  {
    label: "Career Products",
    endValue: 40,
    prefix: "",
    suffix: "+",
    growth: "",
    glowColor: "bg-cyan-500/20",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    barColor: "bg-cyan-500/20",
    bars: [15, 30, 20, 45, 35, 55, 50],
    // Bot / CPU icon
    svgPath: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 3a1 1 0 011-1h4a1 1 0 011 1v1H9V3z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6M9 16h4"
        />
      </>
    ),
  },
  {
    label: "Price Range",
    endValue: 5,
    prefix: "$",
    suffix: " - $490",
    growth: "",
    glowColor: "bg-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    barColor: "bg-emerald-500/20",
    bars: [25, 40, 55, 45, 65, 75, 90],
    // Dollar / trending icon
    svgPath: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
  },
];

const SocialProofStrip = () => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111827] p-6"
        >
          {/* Background Glow */}
          <div
            className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl ${stat.glowColor}`}
          />

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-zinc-400">{stat.label}</p>
              <h3 className="mt-2 text-4xl font-bold text-white">
                {stat.prefix}
                <CountUp
                  start={0}
                  end={stat.endValue}
                  duration={2.5}
                  separator=","
                  suffix={stat.suffix}
                />
              </h3>
              <div className="mt-3 inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-400">
                {stat.growth}
              </div>
            </div>

            {/* Icon */}
            <div className={`rounded-2xl p-3 ${stat.iconBg}`}>
              <svg
                className={`h-6 w-6 ${stat.iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {stat.svgPath}
              </svg>
            </div>
          </div>

          {/* Bottom Bar Chart Visual */}
          <div className="mt-8 flex items-end gap-2">
            {stat.bars.map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-full ${stat.barColor}`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SocialProofStrip;