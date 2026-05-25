import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════
   GEAR COMPONENT
   ═══════════════════════════════════════════════════════ */
function Gear({
  size = 50,
  teeth = 8,
  fill = "#38bdf8",
  opacity = 0.3,
}: {
  size?: number;
  teeth?: number;
  fill?: string;
  opacity?: number;
}) {
  const cx = size / 2,
    cy = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: teeth }).map((_, i) => (
        <rect
          key={i}
          x={cx - 2.5}
          y={1}
          width={5}
          height={size * 0.18}
          rx={1.5}
          fill={fill}
          opacity={opacity}
          transform={`rotate(${(i * 360) / teeth} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={size * 0.28} fill={fill} opacity={opacity} />
      <circle cx={cx} cy={cy} r={size * 0.1} fill="#0f172a" opacity={0.5} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   DUCK CARRYING BOX — FACES RIGHT
   ═══════════════════════════════════════════════════════ */
function DuckCarrying({
  boxFill = "#3b82f6",
  boxTop = "#60a5fa",
  boxSide = "#2563eb",
}: {
  boxFill?: string;
  boxTop?: string;
  boxSide?: string;
}) {
  return (
    <svg width="130" height="112" viewBox="0 0 130 112" fill="none">
      {/* Smoke puffs — left (behind) */}
      <circle
        cx="12" cy="56" r="4" fill="#94a3b8"
        style={{ animation: "smokePuff 0.8s 0s infinite ease-out", "--sx": "6px" } as React.CSSProperties}
      />
      <circle
        cx="6" cy="50" r="3" fill="#94a3b8"
        style={{ animation: "smokePuff 0.8s 0.3s infinite ease-out", "--sx": "-4px" } as React.CSSProperties}
      />
      <circle
        cx="16" cy="64" r="2.5" fill="#94a3b8"
        style={{ animation: "smokePuff 0.8s 0.55s infinite ease-out", "--sx": "8px" } as React.CSSProperties}
      />

      {/* Motion lines */}
      <line x1="4" y1="44" x2="20" y2="44" stroke="#38bdf8" strokeWidth="1.8" opacity="0.25"
        style={{ animation: "motionLine 0.35s infinite" }} />
      <line x1="2" y1="54" x2="15" y2="54" stroke="#38bdf8" strokeWidth="1.8" opacity="0.2"
        style={{ animation: "motionLine 0.35s 0.08s infinite" }} />
      <line x1="6" y1="64" x2="17" y2="64" stroke="#38bdf8" strokeWidth="1.8" opacity="0.15"
        style={{ animation: "motionLine 0.35s 0.16s infinite" }} />

      {/* Left leg */}
      <g style={{ transformOrigin: "36px 90px", animation: "legRun 0.2s infinite ease-in-out" }}>
        <rect x="33" y="88" width="5" height="13" rx="2" fill="#fb923c" />
        <path d="M30 99 L28 103 L33 101 L32 105 L37 102 L39 105 L38 101 L42 103 L40 99Z" fill="#fb923c" />
      </g>
      {/* Right leg */}
      <g style={{ transformOrigin: "50px 90px", animation: "legRun 0.2s 0.1s infinite ease-in-out" }}>
        <rect x="47" y="88" width="5" height="13" rx="2" fill="#f97316" />
        <path d="M44 99 L42 103 L47 101 L46 105 L51 102 L53 105 L52 101 L56 103 L54 99Z" fill="#f97316" />
      </g>

      {/* Tail (left) */}
      <path d="M20 56 Q10 46 14 54 Q6 48 16 62 Q8 56 18 66" fill="#f0f0f0" stroke="#e0e0e0" strokeWidth="0.5" />

      {/* Body */}
      <ellipse cx="44" cy="67" rx="26" ry="22" fill="white" />
      <ellipse cx="44" cy="67" rx="26" ry="22" fill="url(#bG)" />

      {/* === BOX in front (right) === */}
      <g style={{ animation: "boxBob 0.45s infinite ease-in-out" }}>
        <rect x="60" y="52" width="28" height="22" rx="2" fill={boxFill} opacity="0.88" />
        <path d="M60 52 L66 44 L94 44 L88 52 Z" fill={boxTop} opacity="0.88" />
        <path d="M88 52 L94 44 L94 66 L88 74 Z" fill={boxSide} opacity="0.6" />
        <line x1="74" y1="52" x2="74" y2="74" stroke="rgba(255,255,255,0.13)" strokeWidth="2" />
        <line x1="60" y1="63" x2="88" y2="63" stroke="rgba(255,255,255,0.13)" strokeWidth="2" />
        {/* Arrow icon on box */}
        <path d="M68 58 L78 58 M75 55 L78 58 L75 61" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </g>

      {/* Arms/flippers reaching to box */}
      <path d="M54 58 Q60 52 64 56 L62 64 Q56 66 52 62 Z" fill="white" stroke="#e5e7eb" strokeWidth="0.6" />
      <path d="M52 70 Q58 76 64 72 L62 64 Q56 62 52 66 Z" fill="white" stroke="#e5e7eb" strokeWidth="0.6" />

      {/* Neck */}
      <ellipse cx="52" cy="48" rx="12" ry="14" fill="white" />

      {/* Head */}
      <circle cx="58" cy="32" r="15" fill="white" />
      <circle cx="58" cy="32" r="15" fill="url(#hG)" />

      {/* Eye (right side = front) */}
      <circle cx="64" cy="29" r="3.8" fill="#1e293b" />
      <circle cx="65.5" cy="27.5" r="1.4" fill="white" />
      {/* Determined eyebrow */}
      <path d="M61 24.5 L67 26" stroke="#64748b" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* Sweat */}
      <circle cx="46" cy="20" r="2" fill="#93c5fd" style={{ animation: "sweatDrop 0.9s infinite ease-out" }} />

      {/* Blush */}
      <ellipse cx="66" cy="36" rx="4" ry="2" fill="#fca5a5" opacity="0.3" />

      {/* Beak (pointing right) */}
      <path d="M71 31 L84 34 L71 38 Z" fill="#fb923c" />
      <path d="M71 31 L84 34 L71 34 Z" fill="#f97316" />

      {/* Hard hat */}
      <ellipse cx="58" cy="20" rx="17" ry="5.5" fill="#fbbf24" />
      <path d="M43 20 Q43 11 58 9 Q73 11 73 20" fill="#fbbf24" />
      <rect x="55" y="7" width="6" height="4" rx="2" fill="#f59e0b" />
      <path d="M49 16 Q54 12.5 61 15" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" fill="none" strokeLinecap="round" />

      <defs>
        <radialGradient id="bG" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="hG" cx="60%" cy="35%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.1" />
        </radialGradient>
      </defs>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   CONVEYOR BELT
   ═══════════════════════════════════════════════════════ */
function ConveyorBelt() {
  const beltBoxes = [
    { delay: 0, color: "#3b82f6", top: "#60a5fa", side: "#2563eb" },
    { delay: 1.4, color: "#f59e0b", top: "#fbbf24", side: "#d97706" },
    { delay: 2.8, color: "#22c55e", top: "#4ade80", side: "#16a34a" },
    { delay: 4.2, color: "#8b5cf6", top: "#a78bfa", side: "#7c3aed" },
    { delay: 5.6, color: "#06b6d4", top: "#22d3ee", side: "#0891b2" },
  ];

  const rollerCount = 24;

  return (
    <div className="absolute pointer-events-none" style={{ bottom: "28%", left: "6%", right: "6%" }}>
      {/* Label */}
      <div className="absolute text-center w-full" style={{ top: -18, fontSize: 9, color: "#334155", letterSpacing: 3, textTransform: "uppercase" }}>
        Conveyor System Active
      </div>

      {/* Belt surface */}
      <div
        style={{
          width: "100%",
          height: 14,
          borderRadius: 4,
          border: "1px solid rgba(56,189,248,0.08)",
          background:
            "repeating-linear-gradient(90deg, #1e293b 0px, #1e293b 18px, #2a3548 18px, #2a3548 20px)",
          animation: "beltScroll 0.5s linear infinite",
        }}
      />

      {/* Belt edge glow */}
      <div
        style={{
          width: "100%",
          height: 2,
          background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.1), rgba(56,189,248,0.15), rgba(56,189,248,0.1), transparent)",
          animation: "glowPulse 2.5s infinite ease-in-out",
        }}
      />

      {/* Rollers */}
      <div className="flex justify-between px-1 mt-1">
        {Array.from({ length: rollerCount }).map((_, i) => (
          <div key={i} style={{ animation: "rollerSpin 0.5s linear infinite" }}>
            <svg width="9" height="9" viewBox="0 0 9 9">
              <circle cx="4.5" cy="4.5" r="3.5" fill="#334155" stroke="#475569" strokeWidth="0.6" />
              <line x1="1.5" y1="4.5" x2="7.5" y2="4.5" stroke="#475569" strokeWidth="0.5" />
              <line x1="4.5" y1="1.5" x2="4.5" y2="7.5" stroke="#475569" strokeWidth="0.5" />
            </svg>
          </div>
        ))}
      </div>

      {/* Boxes sliding on belt */}
      {beltBoxes.map((box, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: -14,
            animation: `boxSlideR 7s ${box.delay}s linear infinite`,
          }}
        >
          <svg width="22" height="18" viewBox="0 0 22 18">
            <rect x="0" y="4" width="18" height="14" rx="1.5" fill={box.color} opacity="0.75" />
            <path d="M0 4 L4 0 L22 0 L18 4 Z" fill={box.top} opacity="0.75" />
            <path d="M18 4 L22 0 L22 14 L18 18 Z" fill={box.side} opacity="0.5" />
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   WAREHOUSE SHELF
   ═══════════════════════════════════════════════════════ */
function WarehouseShelf({ side }: { side: "left" | "right" }) {
  const shelves = [0, 65, 130, 195, 260];
  return (
    <div
      className="absolute pointer-events-none hidden md:block"
      style={{
        [side]: "1.5%",
        bottom: "8%",
        opacity: 0.06,
      }}
    >
      <svg width="90" height="330" viewBox="0 0 90 330">
        {/* Vertical posts */}
        <rect x="5" y="0" width="3" height="330" fill="#38bdf8" />
        <rect x="42" y="0" width="3" height="330" fill="#38bdf8" />
        <rect x="82" y="0" width="3" height="330" fill="#38bdf8" />
        {/* Shelf levels + boxes */}
        {shelves.map((y, i) => (
          <g key={i}>
            <rect x="3" y={y} width="84" height="3" fill="#38bdf8" />
            {i % 2 === 0 && (
              <rect x="10" y={y - 16} width="18" height="14" rx="1" fill="#38bdf8" opacity="0.7" />
            )}
            {i % 2 === 1 && (
              <rect x="48" y={y - 13} width="24" height="11" rx="1" fill="#38bdf8" opacity="0.5" />
            )}
            {i === 2 && (
              <rect x="25" y={y - 18} width="14" height="16" rx="1" fill="#38bdf8" opacity="0.4" />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   WAREHOUSE BACKGROUND ELEMENTS
   ═══════════════════════════════════════════════════════ */
function WarehouseBackground() {
  return (
    <>
      {/* Roof truss */}
      <div className="absolute pointer-events-none" style={{ top: 0, left: 0, right: 0, height: 44 }}>
        <div style={{ width: "100%", height: 3, background: "rgba(56,189,248,0.05)" }} />
        {[12, 28, 44, 60, 76, 92].map((pct) => (
          <div key={pct} className="absolute" style={{ top: 3, left: `${pct}%`, width: 1.5, height: 32, background: "rgba(56,189,248,0.035)" }} />
        ))}
        <div className="absolute" style={{ top: 18, left: 0, right: 0, height: 1, background: "rgba(56,189,248,0.025)" }} />
        {/* Diagonal braces */}
        {[12, 44, 76].map((pct) => (
          <div key={pct} className="absolute" style={{
            top: 3, left: `${pct}%`, width: 80, height: 1,
            background: "rgba(56,189,248,0.02)",
            transform: "rotate(22deg)", transformOrigin: "left center",
          }} />
        ))}
      </div>

      {/* Overhead lights */}
      {[20, 50, 80].map((left) => (
        <div key={left} className="absolute pointer-events-none" style={{ top: "5%", left: `${left}%`, transform: "translateX(-50%)" }}>
          {/* Fixture */}
          <div style={{ width: 44, height: 5, margin: "0 auto", background: "linear-gradient(to bottom, #334155, #1e293b)", borderRadius: "0 0 3px 3px" }} />
          {/* Bulb */}
          <div
            style={{
              width: 10, height: 3, margin: "0 auto",
              background: "#fbbf24", opacity: 0.5, borderRadius: 2,
              boxShadow: "0 2px 12px rgba(251,191,36,0.25)",
              animation: "lightPulse 3s infinite ease-in-out",
            }}
          />
          {/* Beam */}
          <div style={{
            width: 140, height: 120, margin: "-1px auto 0",
            background: "linear-gradient(to bottom, rgba(251,191,36,0.025), transparent)",
            clipPath: "polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)",
          }} />
        </div>
      ))}

      {/* Status LEDs */}
      <div className="absolute flex gap-3 items-center" style={{ top: 10, right: 50, opacity: 0.35 }}>
        <div className="flex items-center gap-1">
          <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "indicatorBlink 2s infinite" }} />
          <span style={{ fontSize: 8, color: "#22c55e", letterSpacing: 1 }}>ONLINE</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#f59e0b", boxShadow: "0 0 6px #f59e0b", animation: "indicatorBlink 2s 0.7s infinite" }} />
          <span style={{ fontSize: 8, color: "#f59e0b", letterSpacing: 1 }}>MAINT</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: "#38bdf8", boxShadow: "0 0 6px #38bdf8", animation: "indicatorBlink 2s 1.4s infinite" }} />
          <span style={{ fontSize: 8, color: "#38bdf8", letterSpacing: 1 }}>WMS</span>
        </div>
      </div>

      {/* Barcode — bottom left */}
      <div className="absolute pointer-events-none" style={{ bottom: 12, left: 16, opacity: 0.04 }}>
        <svg width="70" height="24" viewBox="0 0 70 24">
          {[0, 5, 9, 14, 17, 22, 26, 29, 33, 38, 41, 45, 49, 53, 56, 60, 63].map((x, i) => (
            <rect key={i} x={x} y="0" width={i % 3 === 0 ? 3 : 2} height="24" fill="#38bdf8" />
          ))}
        </svg>
      </div>

      {/* WMS watermark */}
      <div className="absolute pointer-events-none select-none" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.015, fontSize: "clamp(80px, 15vw, 200px)", fontWeight: 900, color: "#38bdf8", letterSpacing: 20, whiteSpace: "nowrap" }}>
        WMS
      </div>

      {/* Forklift */}
      <div className="absolute pointer-events-none hidden md:block" style={{ bottom: "3.5%", animation: "forkliftDrive 20s 3s linear infinite" }}>
        <svg width="80" height="36" viewBox="0 0 80 36" style={{ opacity: 0.07 }}>
          <rect x="22" y="8" width="32" height="18" rx="3" fill="#38bdf8" />
          <rect x="36" y="1" width="16" height="18" rx="2" fill="#38bdf8" />
          <rect x="0" y="20" width="24" height="2.5" fill="#38bdf8" />
          <rect x="0" y="14" width="2.5" height="11" fill="#38bdf8" />
          <rect x="20" y="3" width="2.5" height="22" fill="#38bdf8" />
          <circle cx="30" cy="30" r="4.5" fill="#38bdf8" />
          <circle cx="54" cy="30" r="4.5" fill="#38bdf8" />
          {/* Small box on fork */}
          <rect x="4" y="10" width="12" height="9" rx="1" fill="#38bdf8" opacity="0.6" />
        </svg>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   BACKGROUND GEARS (large, slow)
   ═══════════════════════════════════════════════════════ */
function BackgroundGears() {
  return (
    <>
      {/* Top-left large gear */}
      <div className="absolute pointer-events-none" style={{ top: "-5%", left: "-3%", animation: "spinGear 25s linear infinite" }}>
        <Gear size={180} teeth={14} fill="#38bdf8" opacity={0.06} />
      </div>
      {/* Top-right large gear */}
      <div className="absolute pointer-events-none" style={{ top: "-8%", right: "-5%", animation: "spinGearRev 30s linear infinite" }}>
        <Gear size={200} teeth={16} fill="#0ea5e9" opacity={0.05} />
      </div>
      {/* Bottom-left gear */}
      <div className="absolute pointer-events-none" style={{ bottom: "-8%", left: "-4%", animation: "spinGearRev 28s linear infinite" }}>
        <Gear size={160} teeth={12} fill="#06b6d4" opacity={0.05} />
      </div>
      {/* Bottom-right gear */}
      <div className="absolute pointer-events-none" style={{ bottom: "-6%", right: "-3%", animation: "spinGear 22s linear infinite" }}>
        <Gear size={140} teeth={11} fill="#38bdf8" opacity={0.06} />
      </div>
      {/* Center-left medium gear */}
      <div className="absolute pointer-events-none" style={{ top: "35%", left: "-2%", animation: "spinGear 18s linear infinite" }}>
        <Gear size={100} teeth={10} fill="#0ea5e9" opacity={0.04} />
      </div>
      {/* Center-right medium gear */}
      <div className="absolute pointer-events-none" style={{ top: "30%", right: "-1%", animation: "spinGearRev 20s linear infinite" }}>
        <Gear size={90} teeth={9} fill="#06b6d4" opacity={0.04} />
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   PARTICLES
   ═══════════════════════════════════════════════════════ */
function Particles() {
  const data = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    dur: 4 + Math.random() * 6,
    size: 1.5 + Math.random() * 3,
    drift: -50 + Math.random() * 100,
    color: ["#38bdf8", "#0ea5e9", "#06b6d4", "#22d3ee", "#fbbf24", "#a5b4fc"][
      Math.floor(Math.random() * 6)
    ],
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {data.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            bottom: "-8px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            animation: `floatUp ${p.dur}s ${p.delay}s infinite ease-out`,
            ["--drift" as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SPARKLES
   ═══════════════════════════════════════════════════════ */
function Sparkles() {
  const data = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    delay: Math.random() * 4,
    size: 3 + Math.random() * 4,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {data.map((s) => (
        <div
          key={s.id}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            animation: `sparkle ${1.5 + Math.random() * 2.5}s ${s.delay}s infinite ease-in-out`,
          }}
        >
          <svg width={s.size} height={s.size} viewBox="0 0 12 12">
            <path d="M6 0 L7 4.5 L12 6 L7 7.5 L6 12 L5 7.5 L0 6 L5 4.5 Z" fill="#38bdf8" opacity="0.55" />
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   FLOATING TOOLS
   ═══════════════════════════════════════════════════════ */
function FloatingTools() {
  const tools = [
    { icon: "🔧", x: 5, y: 18, delay: 0, anim: "floatA", dur: 4.5 },
    { icon: "⚙️", x: 92, y: 14, delay: 0.7, anim: "floatB", dur: 5.2 },
    { icon: "🛠️", x: 88, y: 75, delay: 1.4, anim: "floatC", dur: 4.8 },
    { icon: "📦", x: 8, y: 78, delay: 1, anim: "floatB", dur: 4.1 },
    { icon: "🔩", x: 90, y: 44, delay: 1.8, anim: "floatA", dur: 4.6 },
    { icon: "🪛", x: 4, y: 52, delay: 2.2, anim: "floatC", dur: 5.5 },
    { icon: "🏗️", x: 15, y: 8, delay: 0.3, anim: "floatA", dur: 5 },
    { icon: "📋", x: 82, y: 88, delay: 1.6, anim: "floatB", dur: 4.3 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {tools.map((t, i) => (
        <span
          key={i}
          className="absolute text-lg md:text-2xl select-none"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            animation: `${t.anim} ${t.dur}s ${t.delay}s infinite ease-in-out`,
            filter: "drop-shadow(0 0 4px rgba(56,189,248,0.2))",
            opacity: 0.35,
          }}
        >
          {t.icon}
        </span>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DOTS & PROGRESS
   ═══════════════════════════════════════════════════════ */
function PulsingDots() {
  return (
    <div className="flex items-center justify-center gap-2.5 mt-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: 7,
            height: 7,
            backgroundColor: "#38bdf8",
            boxShadow: "0 0 8px rgba(56,189,248,0.5)",
            animation: `pulseDot 1.4s ${i * 0.2}s infinite ease-in-out`,
          }}
        />
      ))}
    </div>
  );
}

function ProgressBar() {
  return (
    <div
      className="w-52 md:w-72 h-1.5 rounded-full overflow-hidden mt-3"
      style={{ backgroundColor: "rgba(56,189,248,0.1)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: "38%",
          background: "linear-gradient(90deg, #0284c7, #38bdf8, #7dd3fc, #38bdf8, #0284c7)",
          boxShadow: "0 0 12px rgba(56,189,248,0.3)",
          animation: "progressSweep 2.8s infinite ease-in-out",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DATA STREAM (tech feel)
   ═══════════════════════════════════════════════════════ */
function DataStreams() {
  const streams = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left: 15 + Math.random() * 70,
    delay: Math.random() * 4,
    dur: 2 + Math.random() * 2,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {streams.map((s) => (
        <div
          key={s.id}
          className="absolute text-xs font-mono"
          style={{
            left: `${s.left}%`,
            top: `${20 + Math.random() * 50}%`,
            color: "#38bdf8",
            opacity: 0.04,
            animation: `dataStream ${s.dur}s ${s.delay}s infinite ease-out`,
          }}
        >
          {["0x4F2A", "WMS.OK", "SYNC", "LOAD", "TCP/IP", "HTTP/2"][s.id]}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════ */
export default function App() {
  const [mounted, setMounted] = useState(false);
  const [dots, setDots] = useState("");

  useEffect(() => {
    setMounted(true);
    const iv = setInterval(() => setDots((p) => (p.length >= 3 ? "" : p + ".")), 500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center w-full h-screen overflow-hidden select-none"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #0f2942 0%, #0c1d33 30%, #070e1a 60%, #030508 100%)",
      }}
    >
      {/* ── Background layers ── */}
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.018,
          backgroundImage: `
            linear-gradient(rgba(56,189,248,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56,189,248,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Ambient glows */}
      <div className="absolute pointer-events-none" style={{
        width: 700, height: 500, top: "10%", left: "50%", transform: "translateX(-50%)",
        background: "radial-gradient(ellipse, rgba(14,165,233,0.04) 0%, transparent 65%)",
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 300, height: 300, bottom: "5%", right: "15%",
        background: "radial-gradient(circle, rgba(251,191,36,0.025) 0%, transparent 70%)",
      }} />
      <div className="absolute pointer-events-none" style={{
        width: 250, height: 250, bottom: "10%", left: "10%",
        background: "radial-gradient(circle, rgba(56,189,248,0.02) 0%, transparent 70%)",
      }} />

      {/* Background gears — LARGE & SLOW */}
      <BackgroundGears />

      {/* Warehouse background */}
      <WarehouseBackground />

      {/* Warehouse shelves */}
      <WarehouseShelf side="left" />
      <WarehouseShelf side="right" />

      {/* Effects */}
      <Particles />
      <Sparkles />
      <FloatingTools />
      <DataStreams />

      {/* Conveyor belt */}
      <ConveyorBelt />

      {/* ══════ MAIN CONTENT ══════ */}
      <div
        className="relative flex flex-col items-center z-10"
        style={{
          animation: mounted ? "fadeInUp 1s ease-out forwards" : "none",
          opacity: 0,
        }}
      >
        {/* Title area */}
        <div className="text-center mb-6 md:mb-10">
          <h1
            className="text-2xl md:text-4xl font-bold tracking-tight"
            style={{
              color: "#e2e8f0",
              animation: "textGlow 3.5s infinite ease-in-out",
            }}
          >
            Sistema em manutenção
          </h1>
          <p
            className="text-sm md:text-lg mt-2 font-light"
            style={{
              color: "#94a3b8",
              animation: "subtitleFade 2.5s infinite ease-in-out",
            }}
          >
            Aguarde{dots}
          </p>
        </div>

        {/* ── Duck running area ── */}
        <div
          className="relative flex items-center justify-center"
          style={{ width: 580, maxWidth: "95vw", height: 120 }}
        >
          {/* Running track glow */}
          <div
            className="absolute"
            style={{
              width: "90%",
              height: 2,
              bottom: 12,
              background:
                "linear-gradient(90deg, transparent, rgba(56,189,248,0.08), rgba(56,189,248,0.15), rgba(56,189,248,0.08), transparent)",
              animation: "glowPulse 2.5s infinite ease-in-out",
            }}
          />

          {/* Track dots */}
          <div className="absolute flex justify-between" style={{ width: "82%", bottom: 14, left: "9%" }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{ width: 2.5, height: 2.5, backgroundColor: "rgba(56,189,248,0.1)" }}
              />
            ))}
          </div>

          {/* DUCK 1 — going right (blue box) */}
          <div
            className="absolute"
            style={{
              bottom: 16,
              animation: "carryRight 3.5s linear infinite",
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.4))",
            }}
          >
            <div style={{ animation: "bodyBounce 0.28s infinite ease-in-out" }}>
              <DuckCarrying boxFill="#3b82f6" boxTop="#60a5fa" boxSide="#2563eb" />
            </div>
          </div>

          {/* DUCK 2 — staggered (amber box) */}
          <div
            className="absolute"
            style={{
              bottom: 16,
              animation: "carryRight 3.5s -1.75s linear infinite",
              filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.4))",
              transform: "scale(0.85)",
              opacity: 0.8,
            }}
          >
            <div style={{ animation: "bodyBounce 0.28s 0.14s infinite ease-in-out" }}>
              <DuckCarrying boxFill="#f59e0b" boxTop="#fbbf24" boxSide="#d97706" />
            </div>
          </div>

          {/* Spark trail */}
          <div className="absolute" style={{ bottom: 35, left: "50%", width: 160, marginLeft: -80 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 2,
                  height: 2,
                  backgroundColor: "#38bdf8",
                  boxShadow: "0 0 4px #38bdf8",
                  left: `${12 + i * 18}%`,
                  bottom: Math.random() * 20,
                  animation: `motionLine ${0.3 + Math.random() * 0.2}s ${i * 0.06}s infinite ease-out`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex flex-col items-center mt-4">
          <ProgressBar />
          <PulsingDots />
        </div>

        {/* Footer */}
        <div className="mt-8 md:mt-10 text-center">
          <p className="text-xs font-light" style={{ color: "#475569" }}>
            Centro de distribuição em reorganização
          </p>
          <p className="text-xs font-light mt-1" style={{ color: "#334155" }}>
            Voltaremos em breve &bull; Obrigado pela paciência 🦆📦
          </p>
        </div>
      </div>

      {/* ── Decorative edge lines ── */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.15), transparent)" }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.2), transparent)" }}
      />

      {/* Corner gears (decorative) */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-20">
        <div style={{ animation: "spinGear 5s linear infinite" }}>
          <Gear size={18} teeth={6} fill="#38bdf8" opacity={0.4} />
        </div>
        <div style={{ animation: "spinGearRev 6s linear infinite" }}>
          <Gear size={14} teeth={5} fill="#22d3ee" opacity={0.3} />
        </div>
      </div>
      <div className="absolute bottom-3 left-3 flex gap-2 opacity-20">
        <div style={{ animation: "spinGearRev 6s linear infinite" }}>
          <Gear size={16} teeth={5} fill="#06b6d4" opacity={0.35} />
        </div>
        <div style={{ animation: "spinGear 5s linear infinite" }}>
          <Gear size={20} teeth={7} fill="#38bdf8" opacity={0.3} />
        </div>
      </div>
    </div>
  );
}
