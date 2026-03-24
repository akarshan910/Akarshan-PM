import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import "../../src/styles/portfolio.css";

const CASES = [
  {
    id: 1,
    theme: "red",
    vol: "VOL.01",
    volJp: "",
    co: "SugarFit \u00b7 GLP-1",
    title: "GLP-1 RENEWAL STRATEGY",
    desc: "VOC analysis of 4,819 notes revealing an 80% GLP awareness gap among eligible patients",
    impact: "80% gap found",
    tags: ["analytics", "crm"],
    kpis: [
      { v: "80%", l: "Awareness gap identified" },
      { v: "4.8K", l: "Notes analysed" },
      { v: "3\u00d7", l: "Doctor counselling uplift target" },
    ],
    content: {
      problem:
        "GLP-1 medication is clinically indicated for patients with BMI >= 23, yet the majority of eligible patients were never informed about the program. The team had no systematic data on <strong>why</strong> this gap existed \u2014 whether it was a doctor behaviour issue, a CRM gap, or a patient awareness problem.",
      approach:
        "I ran a full VOC analysis across 4,819 consultation notes from Jan-Feb 2026. Using keyword matching (GLP, Ozempic, Wegovy, Mounjaro, weight loss) and intent classification \u2014 doctor recommended vs incidental mention vs patient-initiated \u2014 I built the complete picture of where the breakdown was happening.",
      solution: [
        "Built an interactive React/Recharts VOC dashboard for clinical leadership",
        "Redesigned the doctor counselling protocol with a structured GLP trigger checklist",
        "Created 5 WhatsApp CRM templates for renewal campaign targeting eligible patients",
        "Shipped SQL monitoring queries to track protocol adoption weekly",
        "Presented findings in a stakeholder deck leading to a pilot counselling program",
      ],
      impact: {
        text: "The analysis revealed <strong>80.7% of eligible patients had zero GLP conversation</strong> \u2014 a doctor-side protocol gap, not patient-side. The redesigned protocol is now in pilot with an initial cohort of doctors.",
        items: [
          { v: "80%", l: "Coverage gap found", c: "#E8273A" },
          {
            v: "0",
            l: "Patient-initiated asks (pre-intervention)",
            c: "#E8273A",
          },
          {
            v: "50%",
            l: "Drug mentions with active counselling",
            c: "#F0C040",
          },
          { v: "5+", l: "CRM templates shipped", c: "#00D4FF" },
        ],
      },
      tags: [
        "SQL \u00b7 Trino",
        "React",
        "Recharts",
        "VOC Analysis",
        "CRM",
        "Clinical Ops",
        "WhatsApp API",
      ],
    },
  },
  {
    id: 2,
    theme: "cyan",
    vol: "VOL.02",
    volJp: "",
    co: "SugarFit \u00b7 CGM",
    title: "CGM PHOTO GATE",
    desc: "0\u21921 feature that cut device crash rate by 40% and lifted compliance to 85%+",
    impact: "\u221240% crashes",
    tags: ["analytics", "feature"],
    kpis: [
      { v: "40%", l: "CGM crash rate reduction" },
      { v: "85%+", l: "Compliance rate post-launch" },
      { v: "2.7K", l: "CS tickets analysed" },
    ],
    content: {
      problem:
        "CGM sensor replacements were being approved without photographic evidence of malfunction. Users could claim replacements without genuine need, driving replacement rates and inventory costs up. The CS team was drowning in ambiguous tickets with no way to adjudicate quickly.",
      approach:
        "I started with a CS ticket deep-dive \u2014 pulled and classified 2,772 tickets across TAT, CSAT, misfiling rates, and resolution patterns. This established the baseline cost before a single line of code was written. Then mapped the full user journey for replacement requests and identified the exact friction point.",
      solution: [
        "Designed mandatory photo upload gate before CGM replacement requests could be submitted",
        "Worked with engineering on the verification pipeline \u2014 image validation, storage, CS review queue",
        "Built multi-tab React/Recharts leadership dashboard: funnel compliance, crash trends, time-to-upload, ticket attribution",
        "Ran phased rollout \u2014 soft gate first (warning), then hard gate (blocking) \u2014 to avoid a support spike",
        "Created CS team playbook for photo review and escalation decisions",
      ],
      impact: {
        text: "The photo gate eliminated fraudulent replacement requests at source. <strong>Crash rate dropped 40% in the first 8 weeks.</strong> CS ticket volume attributable to the flow dropped significantly, and CSAT on the category improved.",
        items: [
          { v: "40%", l: "Crash rate reduction", c: "#00D4FF" },
          { v: "85%+", l: "Photo compliance", c: "#00D4FF" },
          {
            v: "2.7K",
            l: "Tickets baseline-studied",
            c: "#F0C040",
          },
          {
            v: "\u2191CSAT",
            l: "CS satisfaction improved",
            c: "#4ade80",
          },
        ],
      },
      tags: [
        "React",
        "Recharts",
        "0\u21921 Feature",
        "Analytics",
        "CS Ops",
        "SQL",
        "Dashboard Design",
      ],
    },
  },
  {
    id: 3,
    theme: "gold",
    vol: "VOL.03",
    volJp: "",
    co: "SugarFit \u00b7 LINX",
    title: "3D BODY SCAN JOURNEY",
    desc: "React + Three.js mobile onboarding prototype with clay-rendered body models",
    impact: "v1 shipped",
    tags: ["feature", "prototype"],
    kpis: [
      { v: "3D", l: "Clay body model rendering" },
      { v: "v1", l: "Prototype shipped to stakeholders" },
      { v: "60fps", l: "Smooth on mid-range Android" },
    ],
    content: {
      problem:
        "The CGM LINX partner program needed premium onboarding without a native app. The web-based flow felt generic and did not convey the body composition insights the product promised. Users were dropping off at the onboarding stage.",
      approach:
        "Prototyped multiple directions in Figma \u2014 static illustration, 2D silhouette, and 3D interactive. The 3D route was clearly right for the body scan narrative. Built a working prototype in React using Three.js with a clay-rendered body model that could be rotated and annotated with health data overlays.",
      solution: [
        "Built full 3D body scan journey in React + Three.js \u2014 no native app required",
        "Clay-style shaded body model with real-time rotation using OrbitControls",
        "Health data overlay layer \u2014 BMI zone, body fat region highlights, CGM sensor placement guide",
        "Smooth animation transitions between onboarding steps \u2014 felt like a premium health app",
        "Lightweight enough to run in mobile browser without lag on mid-range Android devices",
      ],
      impact: {
        text: "The prototype was presented to the LINX partner team and stakeholders. It <strong>unblocked the partner conversation</strong> and gave engineering a concrete spec to work from rather than wireframes alone.",
        items: [
          {
            v: "3D",
            l: "Three.js rendering in browser",
            c: "#F0C040",
          },
          {
            v: "60fps",
            l: "Smooth on mid-range Android",
            c: "#F0C040",
          },
          {
            v: "v1",
            l: "Prototype to partner demo",
            c: "#4ade80",
          },
          {
            v: "0",
            l: "Native app installs required",
            c: "#00D4FF",
          },
        ],
      },
      tags: [
        "Three.js",
        "React",
        "Mobile UX",
        "Prototyping",
        "3D Rendering",
        "Figma",
        "Animation",
      ],
    },
  },
  {
    id: 4,
    theme: "purple",
    vol: "VOL.04",
    volJp: "",
    co: "SugarFit \u00b7 Diagnostics",
    title: "WHATSAPP BOOKING FUNNEL",
    desc: "Meta-compliant WhatsApp utility templates driving diagnostics bookings for GLP cohort",
    impact: "5+ live templates",
    tags: ["crm", "feature"],
    kpis: [
      { v: "5+", l: "Templates live in production" },
      { v: "Meta", l: "Compliance framework (Kaleyra)" },
      { v: "GLP", l: "Full patient cohort covered" },
    ],
    content: {
      problem:
        "GLP-eligible patients were missing critical diagnostic tests \u2014 not because they did not want them, but because the booking touchpoint was buried deep in the app. Drop-off between consultation recommendation and actual test booking was high and invisible.",
      approach:
        "Mapped the full patient journey from diagnostic recommendation to lab booking to result upload. Found 3 specific drop-off points where a timed WhatsApp message could dramatically improve conversion. Designed the message architecture to comply with Meta utility template framework (non-promotional, transactional, opt-in) via Kaleyra.",
      solution: [
        "Designed 5 Meta-approved WhatsApp utility message templates across the booking journey",
        "Template 1: Post-consultation diagnostic reminder (triggered 4hrs after consult)",
        "Template 2: Booking confirmation with lab details and prep instructions",
        "Template 3: 24hr pre-test reminder with fasting guidelines where applicable",
        "Template 4: Result upload nudge once test due date passed",
        "Template 5: Renewal prompt linking diagnostic results to GLP eligibility score",
        "Set up Kaleyra flows and tested end-to-end across user segments",
      ],
      impact: {
        text: "Templates went live covering the full GLP cohort. <strong>WhatsApp became the primary high-conversion touchpoint</strong>, replacing a low-response email + in-app notification combination.",
        items: [
          {
            v: "5+",
            l: "Templates in production",
            c: "#C084FC",
          },
          {
            v: "Meta",
            l: "Full compliance \u2014 utility class",
            c: "#C084FC",
          },
          {
            v: "\u2191",
            l: "Test booking conversion rate",
            c: "#4ade80",
          },
          {
            v: "4hrs",
            l: "Post-consult trigger window",
            c: "#F0C040",
          },
        ],
      },
      tags: [
        "WhatsApp Business API",
        "Kaleyra",
        "Meta Compliance",
        "CRM",
        "Funnel Design",
        "GLP Program",
      ],
    },
  },
  {
    id: 5,
    theme: "teal",
    vol: "VOL.05",
    volJp: "",
    co: "SugarFit \u00b7 CS Ops",
    title: "CS TICKET IMPACT STUDY",
    desc: "Deep analysis of 2,772 support tickets to quantify CGM photo gate support cost",
    impact: "2.7K tickets",
    tags: ["analytics"],
    kpis: [
      { v: "2.7K", l: "Tickets classified and analysed" },
      { v: "TAT", l: "Average resolution time mapped" },
      { v: "CSAT", l: "Full distribution charted" },
    ],
    content: {
      problem:
        "Before shipping the CGM photo gate, we needed to prove the support cost of the current replacement request flow. Leadership wanted hard numbers: How many tickets? What is the resolution time? What is the misfiling rate? Without this baseline, the photo gate would be a nice-to-have, not a business case.",
      approach:
        "Pulled 2,772 CS tickets from the CGM replacement category over a 6-month window using SQL against the support data warehouse. Classified each ticket by: resolution outcome, TAT (business hours), CSAT score, misfiling rate, and escalation rate.",
      solution: [
        "SQL query pipeline to extract, clean, and classify 2,772 tickets from the support warehouse",
        "Custom TAT calculation logic (business hours vs wall clock, first response vs resolution)",
        "CSAT distribution analysis \u2014 binned by ticket type and resolution path",
        "Misfiling rate analysis \u2014 percentage of tickets opened in the wrong category",
        "Ticket cost model \u2014 estimated CS-minutes per ticket type \u00d7 salary cost \u2192 total team-hours burned",
        "One-pager and chart pack for leadership to anchor the photo gate business case",
      ],
      impact: {
        text: "The study gave the feature team a rigorous business case. <strong>The analysis justified the engineering investment</strong> and became the post-launch measurement baseline \u2014 we knew what success looked like before shipping.",
        items: [
          { v: "2.7K", l: "Tickets analysed", c: "#2DD4BF" },
          {
            v: "6mo",
            l: "Historical window covered",
            c: "#2DD4BF",
          },
          {
            v: "\u20b9Xk",
            l: "CS cost quantified (confidential)",
            c: "#F0C040",
          },
          {
            v: "1",
            l: "Business case \u2192 feature greenlit",
            c: "#4ade80",
          },
        ],
      },
      tags: [
        "SQL \u00b7 Trino",
        "Data Analysis",
        "CS Operations",
        "TAT Analysis",
        "CSAT",
        "Business Case",
        "Metrics",
      ],
    },
  },
];

function accentColor(t: string) {
  const m: Record<string, string> = {
    red: "#E8273A",
    cyan: "#00D4FF",
    gold: "#F0C040",
    purple: "#C084FC",
    teal: "#2DD4BF",
  };
  return m[t] || "#E8273A";
}

function speedSVG(c: string) {
  return `<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice"><g stroke="${c}" stroke-width="0.5" fill="none" opacity="0.7"><line x1="200" y1="150" x2="-50" y2="10"/><line x1="200" y1="150" x2="-50" y2="60"/><line x1="200" y1="150" x2="-50" y2="110"/><line x1="200" y1="150" x2="-50" y2="170"/><line x1="200" y1="150" x2="-50" y2="230"/><line x1="200" y1="150" x2="-50" y2="290"/><line x1="200" y1="150" x2="50" y2="-20"/><line x1="200" y1="150" x2="120" y2="-20"/><line x1="200" y1="150" x2="50" y2="320"/><line x1="200" y1="150" x2="120" y2="320"/></g></svg>`;
}

function buildBookHTML(c: (typeof CASES)[0]) {
  const ac = accentColor(c.theme);
  return `<div class="mbook" data-theme="${c.theme}" data-id="${c.id}"><div class="mbook-body"><div class="mbook-spine"><div class="mspine-txt">${c.co}</div></div><div class="mbook-speed">${speedSVG(ac)}</div><div class="mbook-cover-bg"></div><div class="mbook-pattern"></div><div class="mbook-num">${String(c.id).padStart(2, "0")}</div><div class="mbook-overlay"></div><div class="mbook-cover"><div class="mvol"><span>${c.vol}</span><span class="mvol-jp">${c.volJp}</span></div><div class="mbook-bottom"><div class="mbook-co">${c.co}</div><div class="mbook-title">${c.title}</div><div class="mbook-desc">${c.desc}</div><div class="mimpact" style="color:${ac};border-color:${ac}">&#9650; ${c.impact}</div></div></div><div class="mbook-hover-panel"><div class="mhp-co" style="color:${ac}">${c.co}</div><div class="mhp-title">${c.title}</div><div class="mhp-desc">${c.desc}</div><div class="mhp-impact" style="color:${ac}"><span class="mhp-impact-val">${c.impact.split(" ")[0]}</span><span class="mhp-impact-lbl">${c.impact.split(" ").slice(1).join(" ")}</span></div><button class="mhp-cta">Read Case Study &#8599;</button></div></div></div>`;
}

const LinkedInSVG = () => (
  <svg viewBox="0 0 24 24">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const testimonials = [
  {
    name: "Shreyasi Ghosh",
    initials: "SG",
    role: "Product Designer \u00b7 Glance AI for TV",
    color: "#E8273A",
    grad: "linear-gradient(135deg,#8B0000,#E8273A)",
    text: "Working with Akarshan has been incredibly motivating. He has this rare ability to combine sharp analytical thinking with a deep understanding of what makes a great product experience. Whether we\u2019re fine-tuning the smallest details or tackling complex challenges, he always brings precision and purpose to the table. What I admire most is his perseverance, no matter how tricky a problem is, he never backs down.",
    tag: "Design",
  },
  {
    name: "Vishal Gopal",
    initials: "VG",
    role: "Product at Glance",
    color: "#00D4FF",
    grad: "linear-gradient(135deg,#0A3060,#00D4FF)",
    text: "Akarshan is an extremely passionate Product person. Once he sets his mind on a feature, he hardly shies away from utilising all resources and tools at his disposal \u2014 to ensure he delivers what is expected of him. The striking thing about working with him is his Conviction. The conviction that arises out of a detailed and thorough thought process. A great asset to work with.",
    tag: "Product",
  },
  {
    name: "Pallav Srivastava",
    initials: "PS",
    role: "SDE 4 (Android) \u00b7 Glance (InMobi) \u00b7 Ex-Blackbuck, Yatra",
    color: "#F0C040",
    grad: "linear-gradient(135deg,#2A3A10,#F0C040)",
    text: "Akarshan is one of the sharpest product minds I have had the pleasure of working with. I collaborated closely with him on multiple features across different products, and his depth of thinking always stood out. His ability to break down complex problems, ask the right questions, and approach every decision with a data-driven mindset made a huge impact on our work.",
    tag: "Engineering",
  },
  {
    name: "Rajesh Mainali",
    initials: "RM",
    role: "SDE III at Glance \u00b7 InMobi",
    color: "#4ade80",
    grad: "linear-gradient(135deg,#0A2A14,#4ade80)",
    text: "I\u2019ve worked with Akarshan for about 3 years on TV projects. As a product manager, he thinks creatively and truly understands the user\u2019s perspective. He\u2019s been very helpful in explaining product workflows, which has made my implementation work much easier. He\u2019s always flexible when facing challenges and finds practical solutions to meet our needs.",
    tag: "Engineering",
  },
  {
    name: "Anmol Loonia",
    initials: "AL",
    role: "Design Leader \u00b7 Consumer AI @ Glance \u00b7 Ex Deloitte, Myntra",
    color: "#c084fc",
    grad: "linear-gradient(135deg,#2A0A3A,#c084fc)",
    text: "Akarshan was my PM on multiple projects through the TV Integration with a leading OEM. He brought a lot of user first approaches to the table, which led to deep business as well as user impact. His ability to get everyone on the same page and turn the wheel is what really worked for the product. He is the perfect team player.",
    tag: "Design",
  },
  {
    name: "Pranshu Singh",
    initials: "PS2",
    role: "Product Manager \u00b7 Birla Institute of Technology",
    color: "#fb923c",
    grad: "linear-gradient(135deg,#3A1A0A,#fb923c)",
    text: "I had the pleasure of working closely with Akarshan during my time at Glance(InMobi Group), and I can wholeheartedly recommend him as an exceptional Product Manager and a teamplayer. He consistently demonstrated a deep understanding of product strategy, market dynamics, and customer needs. Akarshan\u2019s commitment to excellence and his ability to drive results make him a valuable asset to any product management team.",
    tag: "Product",
  },
  {
    name: "Joseph Werede",
    initials: "JW",
    role: "Global Cultural Curator \u00b7 Design culture-led experiences",
    color: "#38bdf8",
    grad: "linear-gradient(135deg,#0A2040,#38bdf8)",
    text: "Akarshan was a great asset to the team at Uber. His analytical skills and go getter attitude always made him a reliable person who gets things done in the most efficient manner. He is very pleasant and easy to work with and I believe that his next team will be very lucky to have him.",
    tag: "Leadership",
  },
];

function TestimonialCard({
  t,
}: {
  t: (typeof testimonials)[0];
}) {
  return (
    <div className="tc">
      <div
        className="tc-bar"
        style={{
          background: `linear-gradient(to right,${t.color},${t.color}4d)`,
        }}
      />
      <div className="tc-head">
        <div
          className="tc-avatar"
          style={{ background: t.grad }}
        >
          {t.initials.slice(0, 2)}
        </div>
        <div className="tc-info">
          <div className="tc-name">{t.name}</div>
          <div className="tc-role">{t.role}</div>
        </div>
        <a
          className="tc-li"
          href="https://linkedin.com"
          target="_blank"
          rel="noreferrer"
        >
          <LinkedInSVG />
        </a>
      </div>
      <div className="tc-body">
        <span className="tc-open-q" style={{ color: t.color }}>
          &ldquo;
        </span>
        <div className="tc-text">{t.text}</div>
        <div
          className="tc-tag"
          style={{
            color: t.color,
            borderColor: `${t.color}40`,
            background: `${t.color}12`,
          }}
        >
          {t.tag}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCase, setModalCase] = useState<
    (typeof CASES)[0] | null
  >(null);
  const [filter, setFilter] = useState("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback((id: number) => {
    const c = CASES.find((x) => x.id === id);
    if (c) {
      setModalCase(c);
      setModalOpen(true);
      document.body.style.overflow = "hidden";
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    document.body.style.overflow = "";
  }, []);

  // Render books
  useEffect(() => {
    const list =
      filter === "all"
        ? CASES
        : CASES.filter((c) => c.tags.includes(filter));
    const html = list.map(buildBookHTML).join("");
    if (gridRef.current) gridRef.current.innerHTML = html;
    if (carouselRef.current)
      carouselRef.current.innerHTML = html;
    // attach click handlers
    document.querySelectorAll(".mbook").forEach((el) => {
      el.addEventListener("click", (e) => {
        const id = parseInt(
          (el as HTMLElement).dataset.id || "0",
        );
        openModal(id);
      });
    });
  }, [filter, openModal]);

  // Custom cursor + magnetic buttons
  useEffect(() => {
    const dot = document.getElementById("dot");
    const ring = document.getElementById("ring");
    const rtxt = document.getElementById("ring-txt");
    let mx = 0,
      my = 0,
      rx = 0,
      ry = 0;
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (dot) {
        dot.style.left = mx + "px";
        dot.style.top = my + "px";
      }
    };
    document.addEventListener("mousemove", onMove);
    let rafId = 0;
    function loop() {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      if (ring) {
        ring.style.left = rx + "px";
        ring.style.top = ry + "px";
      }
      rafId = requestAnimationFrame(loop);
    }
    loop();

    // Cursor state helpers
    function setC(m: string, t = "") {
      document.body.classList.remove("cv", "cl");
      if (m) document.body.classList.add(m);
      if (rtxt) rtxt.textContent = t;
    }

    // Light/dark bg detection for cursor contrast
    function checkBg() {
      const el = document.elementFromPoint(mx, my);
      let node = el as HTMLElement | null;
      let light = false;
      while (node) {
        const bg = getComputedStyle(node).backgroundColor;
        if (
          bg &&
          bg !== "rgba(0, 0, 0, 0)" &&
          bg !== "transparent"
        ) {
          const parts = bg.replace(/[^0-9,]/g, "").split(",");
          if (parts.length >= 3) {
            const lum =
              +parts[0] * 0.299 +
              +parts[1] * 0.587 +
              +parts[2] * 0.114;
            light = lum > 160;
          }
          break;
        }
        node = node.parentElement;
      }
      document.body.classList.toggle("on-light", light);
    }
    const bgInterval = setInterval(checkBg, 200);

    // Hover states for links/buttons
    const links = document.querySelectorAll(
      "a:not(.proj),button",
    );
    const linkEnter = () => setC("cl");
    const linkLeave = () => setC("");
    links.forEach((e) => {
      e.addEventListener("mouseenter", linkEnter);
      e.addEventListener("mouseleave", linkLeave);
    });

    // Book hover → view cursor
    const bookEnter = () => setC("cv", "VIEW");
    const bookLeave = () => setC("");

    // Magnetic button effect
    const magneticBtns = document.querySelectorAll(
      ".c-btn-p,.c-btn-g,.btn-red,.btn-ghost",
    );
    const magneticMoveHandlers: Array<
      [Element, (e: MouseEvent) => void]
    > = [];
    magneticBtns.forEach((b) => {
      const handler = (e: MouseEvent) => {
        const r = (b as HTMLElement).getBoundingClientRect();
        (b as HTMLElement).style.transform =
          `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px,${(e.clientY - r.top - r.height / 2) * 0.22}px)`;
      };
      const leaveHandler = () => {
        (b as HTMLElement).style.transform = "";
      };
      b.addEventListener("mousemove", handler as any);
      b.addEventListener("mouseleave", leaveHandler);
      magneticMoveHandlers.push([b, handler]);
    });

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
      clearInterval(bgInterval);
      links.forEach((e) => {
        e.removeEventListener("mouseenter", linkEnter);
        e.removeEventListener("mouseleave", linkLeave);
      });
      magneticBtns.forEach((b) => {
        const found = magneticMoveHandlers.find(
          ([el]) => el === b,
        );
        if (found)
          b.removeEventListener("mousemove", found[1] as any);
      });
    };
  }, []);

  // Scroll reveal + skill bars + footer typewriter + nav pill + parallax
  useEffect(() => {
    const revealEls = document.querySelectorAll(
      ".rv,.rv-clip,.rv-scale,.rv-left,.rv-pop,.exp-item",
    );
    function updateReveal() {
      const vh = window.innerHeight;
      revealEls.forEach((el) => {
        if ((el as HTMLElement).closest(".hero")) return;
        const r = el.getBoundingClientRect();
        if (r.top < vh - 50 && r.bottom > 60) {
          el.classList.add("vis");
        } else {
          el.classList.remove("vis");
        }
      });
    }

    // Skill bars
    const skObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target
              .querySelectorAll(".sk-fill")
              .forEach((b, i) => {
                const el = b as HTMLElement;
                const style = el.getAttribute("style") || "";
                const m = style.match(/--p:([^;]+)/);
                const pct = m ? m[1].trim() : "0%";
                el.style.transition = "none";
                el.style.width = "0%";
                setTimeout(
                  () => {
                    el.style.transition =
                      "width 1.8s cubic-bezier(.22,1,.36,1)";
                    el.style.width = pct;
                  },
                  i * 60 + 80,
                );
              });
          } else {
            entry.target
              .querySelectorAll(".sk-fill")
              .forEach((b) => {
                (b as HTMLElement).style.transition = "none";
                (b as HTMLElement).style.width = "0%";
              });
          }
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(".sk-col")
      .forEach((col) => skObserver.observe(col));

    // Nav pill
    const navPill = document.getElementById("nav-pill");
    const navEl = document.getElementById("nav");
    function updatePill(animate?: boolean) {
      const active = document.querySelector(
        ".nl.on",
      ) as HTMLElement;
      if (!active || !navPill || !navEl) return;
      if (!animate) navPill.style.transition = "none";
      const navR = navEl.getBoundingClientRect();
      const linkR = active.getBoundingClientRect();
      navPill.style.left = linkR.left - navR.left + "px";
      navPill.style.width = linkR.width + "px";
      if (!animate)
        requestAnimationFrame(() => {
          navPill.style.transition = "";
        });
    }
    document.querySelectorAll(".nl").forEach((link) => {
      link.addEventListener("click", () => {
        document
          .querySelectorAll(".nl")
          .forEach((l) => l.classList.remove("on"));
        link.classList.add("on");
        updatePill(true);
      });
    });
    setTimeout(() => updatePill(false), 60);
    window.addEventListener("resize", () => updatePill(false));

    // Nav active on scroll - check which section is behind the navbar
    const sectionIds = [
      "hero",
      "about",
      "skills",
      "exp",
      "work",
      "testi",
      "offduty",
      "contact",
    ];
    const darkBgSections = ["hero", "about", "exp", "testi"];
    const updateNavSection = () => {
      const nav = document.getElementById("nav");
      if (!nav) return;
      const navBottom = nav.getBoundingClientRect().bottom + 10;
      let currentId = "hero";
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= navBottom) currentId = id;
        }
      }
      nav.classList.toggle(
        "on-light-bg",
        !darkBgSections.includes(currentId),
      );
      const nls = document.querySelectorAll(".nl");
      const nc = document.querySelector(".n-contact");
      if (currentId === "contact" || currentId === "hero") {
        nls.forEach((l) => l.classList.remove("on"));
        if (currentId === "contact")
          nc?.classList.add("active");
        else nc?.classList.remove("active");
        if (navPill) navPill.style.opacity = "0";
      } else {
        nls.forEach((l) =>
          l.classList.toggle(
            "on",
            l.getAttribute("href") === "#" + currentId,
          ),
        );
        updatePill(true);
        if (navPill) navPill.style.opacity = "1";
        nc?.classList.remove("active");
      }
    };
    window.addEventListener("scroll", updateNavSection, {
      passive: true,
    });
    updateNavSection();

    // Scroll handler
    let scrollTimer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(updateReveal, 120);
    };
    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    // IO for reveal
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(
              () => entry.target.classList.add("vis"),
              80,
            );
          } else {
            entry.target.classList.remove("vis");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    revealEls.forEach((el) => {
      if (!(el as HTMLElement).closest(".hero")) io.observe(el);
    });

    // Hero parallax
    const onScrollParallax = () => {
      const y = window.scrollY;
      const el = document.querySelector(
        ".hero-name-block",
      ) as HTMLElement;
      if (el && y < window.innerHeight) {
        el.style.transform = `translateY(${y * 0.12}px)`;
        el.style.opacity = String(
          1 - y / (window.innerHeight * 0.7),
        );
      }
    };
    window.addEventListener("scroll", onScrollParallax, {
      passive: true,
    });

    // Footer typewriter
    const ftEl = document.getElementById("footer-type");
    if (ftEl) {
      const text = "VIBE CODED WITH \u2665 IN BENGALURU";
      let i = 0,
        started = false,
        iv: ReturnType<typeof setInterval> | null = null;
      const ftObs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !started) {
              started = true;
              i = 0;
              ftEl.textContent = "";
              ftEl.classList.remove("done");
              iv = setInterval(() => {
                ftEl.textContent = text.slice(0, i);
                i++;
                if (i > text.length) {
                  clearInterval(iv!);
                  iv = null;
                  ftEl.classList.add("done");
                }
              }, 45);
            } else if (!entry.isIntersecting) {
              started = false;
              if (iv) {
                clearInterval(iv);
                iv = null;
              }
              ftEl.textContent = "";
              ftEl.classList.remove("done");
            }
          });
        },
        { threshold: 0.5 },
      );
      ftObs.observe(ftEl);
    }

    setTimeout(updateReveal, 50);

    // Escape to close modal
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")
        document
          .getElementById("modal")
          ?.classList.contains("open") && setModalOpen(false);
    };
    document.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScrollParallax);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeModal]);

  const ac = modalCase
    ? accentColor(modalCase.theme)
    : "#E8273A";

  return (
    <div
      className="portfolio-root"
      ref={rootRef}
      style={{ minHeight: "100vh", cursor: "none" }}
    >
      {/* CUSTOM CURSOR */}
      <div id="dot">
        <div id="ring-txt" />
      </div>
      <div id="ring" />

      {/* NAV */}
      <nav id="nav">
        <div id="nav-pill" />
        <div className="n-links">
          {[
            ["#about", "About"],
            ["#skills", "Skills"],
            ["#exp", "Exp"],
            ["#work", "Work"],
            ["#testi", "Testimonial"],
          ].map(([h, l], i) => (
            <a
              key={h}
              className={`nl${i === 0 ? " on" : ""}`}
              href={h}
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector(h)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              {l}
            </a>
          ))}
        </div>
        <div className="n-sep" />
        <a
          className="n-contact"
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            document
              .querySelector("#contact")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Let's Talk &rarr;
        </a>
      </nav>

      {/* HERO */}
      <section id="home" className="hero">
        <div className="speed-lines">
          <svg
            viewBox="0 0 1440 900"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <radialGradient id="sg" cx="60%" cy="50%">
                <stop
                  offset="0%"
                  stopColor="#E8273A"
                  stopOpacity=".7"
                />
                <stop
                  offset="100%"
                  stopColor="#E8273A"
                  stopOpacity="0"
                />
              </radialGradient>
            </defs>
            <g stroke="url(#sg)" strokeWidth="0.6" fill="none">
              {[
                20, 60, 100, 140, 200, 260, 320, 380, 440, 500,
                560, 620, 700, 780, 860,
              ].map((y) => (
                <line
                  key={y}
                  x1="864"
                  y1="450"
                  x2="-200"
                  y2={y}
                />
              ))}
              {[
                [-50, 200],
                [-50, 400],
                [-50, 600],
              ].map(([y, x]) => (
                <line
                  key={`${x}${y}`}
                  x1="864"
                  y1="450"
                  x2={x}
                  y2={y}
                />
              ))}
              <line x1="864" y1="450" x2="1600" y2="100" />
              <line x1="864" y1="450" x2="1600" y2="200" />
              <line x1="864" y1="450" x2="1600" y2="700" />
              <line x1="864" y1="450" x2="1600" y2="800" />
              <line x1="864" y1="450" x2="100" y2="950" />
              <line x1="864" y1="450" x2="300" y2="950" />
              <line x1="864" y1="450" x2="500" y2="950" />
              <line x1="864" y1="450" x2="700" y2="950" />
            </g>
          </svg>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hs-val">
              30<em>Cr+</em>
            </div>
            <div className="hs-lbl">Annual Revenue Driven</div>
          </div>
          <div className="hero-stat">
            <div className="hs-val">
              8<em>yr</em>
            </div>
            <div className="hs-lbl">Product Experience</div>
          </div>
          <div className="hero-stat">
            <div className="hs-val">
              300<em>M+</em>
            </div>
            <div className="hs-lbl">Users Served</div>
          </div>
          <div className="hero-stat">
            <div className="hs-val">5</div>
            <div className="hs-lbl">Companies Built At</div>
          </div>
        </div>

        <div className="hero-inner">
          <div className="hero-otw">
            <div className="otw-pill">
              <div className="otw-dot" />
              Open to work
            </div>
            <span className="otw-role">
              Seeking Senior / Lead PM Roles
            </span>
          </div>
          <div className="hero-name-block">
            <div className="hero-name-en">
              <span>AKAR</span>
              <span className="red">SHAN</span>
              <br />
              <span className="stroke">KUMAR</span>
            </div>
          </div>
          <div className="hero-title-row">
            <span
              className="hero-title-main"
              style={{ color: "var(--red)" }}
            >
              Senior Product Manager
            </span>
            <span className="hero-sep" />
            <span
              className="hero-title-main"
              style={{ color: "rgba(240,238,248,.35)" }}
            >
              Bengaluru, India
            </span>
          </div>
          <p className="hero-tagline">
            Product Manager with{" "}
            <strong>8 years experience</strong> driving{" "}
            <strong>30 Cr+ in annual revenue</strong> across
            consumer, health-tech, and D2C platforms. Proven
            track record in 0&rarr;1 and 1&rarr;100 product
            journeys across personalization, user experience,
            growth, and operations.
          </p>
          <div className="hero-btns">
            <a
              className="btn-red"
              href="https://drive.google.com/file/d/1yAEh4CRz0KLLDPQs4FtfIUPB4fBWnLWq/view?usp=sharing"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Resume
            </a>
            <a
              className="btn-ghost"
              href="#work"
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector("#work")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View My Work
            </a>
          </div>
        </div>

        <div
          className="ticker"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
          }}
        >
          <div className="ticker-track">
            {[0, 1].map((i) => (
              <div className="ti" key={i}>
                HEALTH TECH<span className="dot">&diams;</span>
                D2C<span className="dot">&diams;</span>CONSUMER
                TECH<span className="dot">&diams;</span>SQL
                <span className="dot">&diams;</span>A/B TESTING
                <span className="dot">&diams;</span>MIXPANEL
                <span className="dot">&diams;</span>AMPLITUDE
                <span className="dot">&diams;</span>GDPR &amp;
                COMPLIANCE<span className="dot">&diams;</span>
                FIGMA<span className="dot">&diams;</span>
                0&rarr;1 PRODUCTS
                <span className="dot">&diams;</span>GROWTH OPS
                <span className="dot">&diams;</span>
                PERSONALIZATION
                <span className="dot">&diams;</span>RETENTION
                <span className="dot">&diams;</span>CRM STRATEGY
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <div className="about-wrap s-dark2" id="about">
        <div className="about-top">
          <div className="about-left-panel">
            <div
              className="eyebrow rv"
              style={{ color: "var(--red)" }}
            >
              — About
            </div>
            <div
              className="about-heading rv-clip rv-d1"
              style={{ color: "var(--white)" }}
            >
              BUILDING
              <br />
              PRODUCTS
              <br />
              THAT
              <br />
              <span className="red">MATTER.</span>
            </div>
          </div>
          <div className="about-right-panel rv rv-d2">
            <div className="about-body">
              <p>
                I'm a PM at <strong>SugarFit</strong> &mdash;
                leading product &amp; analytics for Type 2
                diabetes, GLP, and Active Foods D2C. Before
                this, I spent 3 years at{" "}
                <strong>Glance (InMobi Group)</strong> owning
                Content Experience &amp; Serving for GlanceTV,
                driving the NFL launch on Google NAB, and
                leading GDPR readiness for EU launch.
              </p>
              <p>
                From <strong>Razorpay</strong> to{" "}
                <strong>Vedantu</strong> to{" "}
                <strong>Wipro</strong> &mdash; I've driven
                cross-functional impact across payments, edtech,
                and global operations.
              </p>
              <p>
                My unfair advantage:{" "}
                <strong>
                  8 years across consumer, health-tech, and D2C
                </strong>{" "}
                with a proven track record of driving 30 Cr+ in
                annual revenue, shipping 0&rarr;1 products, and
                scaling 1&rarr;100.
              </p>
            </div>
            <div className="currently-box">
              <div className="clbl">
                <div className="cpulse" />
                Currently building
              </div>
              <div className="ctxt">
                <strong>
                  GLP, Active Foods D2C &amp; Product Analytics
                </strong>{" "}
                at SugarFit.
              </div>
              <div className="csub">
                Scaling AOV by 7% via upsell/cross-sell,
                reducing RTO by 25%, and improving NPS from
                35&rarr;52.
              </div>
            </div>
          </div>
        </div>
        <div className="kpi-band rv">
          <div className="kpi-cell rv-scale">
            <div className="kn rv-pop">
              30<em>Cr+</em>
            </div>
            <div className="kl">
              Annual revenue driven across products
            </div>
          </div>
          <div className="kpi-cell rv-scale">
            <div className="kn rv-pop">
              $1.4<em>M</em>
            </div>
            <div className="kl">
              ARR generated via 110M lockscreen impressions
            </div>
          </div>
          <div className="kpi-cell rv-scale">
            <div className="kn rv-pop">
              12<em>M</em>
            </div>
            <div className="kl">
              Impressions on nationwide brand campaigns
            </div>
          </div>
          <div className="kpi-cell rv-scale">
            <div className="kn rv-pop">
              8<em>yr</em>
            </div>
            <div className="kl">
              Cross-functional product experience
            </div>
          </div>
        </div>
      </div>

      {/* SKILLS */}
      <div className="s-light" id="skills">
        <div className="skills-wrap">
          <div className="eyebrow rv">— Skills</div>
          <div className="s-title rv-clip rv-d1">
            WHAT I <em>BRING</em>
          </div>
          <div className="skills-cols">
            <div className="sk-col rv-scale rv-d1">
              <div className="sk-head">
                <div>
                  <div className="sk-title">Product</div>
                  <div className="sk-sub">
                    Strategy &amp; execution
                  </div>
                </div>
              </div>
              <div className="sk-tags">
                {[
                  "User & Market Research",
                  "Feature Prioritisation",
                  "Road-mapping",
                  "Stakeholder Management",
                  "A/B Testing",
                  "Experimentation",
                  "Data-driven Development",
                ].map((n) => (
                  <span className="sk-tag" key={n}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="sk-col rv-scale rv-d2">
              <div className="sk-head">
                <div>
                  <div className="sk-title">Data</div>
                  <div className="sk-sub">
                    My unfair advantage
                  </div>
                </div>
              </div>
              <div className="sk-tags">
                {[
                  "SQL",
                  "Web (Clickstream) Analytics",
                  "Product & Data Analytics",
                  "Visualization & Story Telling",
                  "ETL",
                ].map((n) => (
                  <span className="sk-tag" key={n}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="sk-col rv-scale rv-d3">
              <div className="sk-head">
                <div>
                  <div className="sk-title">Design</div>
                  <div className="sk-sub">
                    Pixel-perfect craft
                  </div>
                </div>
              </div>
              <div className="sk-tags">
                {[
                  "FigmaMake",
                  "Prototyping",
                  "Wireframing",
                  "Napkin.ai",
                ].map((n) => (
                  <span className="sk-tag" key={n}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
            <div className="sk-col rv-scale rv-d4">
              <div className="sk-head">
                <div>
                  <div className="sk-title">Tools</div>
                  <div className="sk-sub">The full stack</div>
                </div>
              </div>
              <div className="sk-tags">
                {[
                  "Excel",
                  "Lovable",
                  "Mixpanel",
                  "Metabase",
                  "Tableau",
                  "Optimizely",
                  "Redash",
                  "Superset",
                  "Figma",
                  "JIRA",
                  "Amplitude",
                  "Airflow",
                ].map((n) => (
                  <span className="sk-tag" key={n}>
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPERIENCE */}
      <div className="s-dark2" id="exp">
        <div className="exp-wrap">
          <div className="eyebrow light-eye rv">
            — Experience
          </div>
          <div className="s-title light rv-clip rv-d1">
            WHERE I'VE <em>BUILT</em>
          </div>
          <div className="exp-list">
            <div className="exp-item">
              <div className="exp-l">
                <div className="exp-period">
                  May 2025 — Present
                </div>
                <div className="exp-co">SugarFit</div>
                <div className="exp-loc">📍 Bengaluru</div>
              </div>
              <div className="exp-r">
                <div className="exp-role">
                  Senior Product Manager
                </div>
                <ul className="exp-pts">
                  <li>
                    Leading product &amp; analytics for Type 2
                    diabetes, GLP, and Active Foods D2C as
                    primary SPOC for investors
                  </li>
                  <li>
                    Scaled Active Foods D2C to 40L/month,
                    improving AOV by 7% through
                    upsell/cross-sell, reducing RTO by 25%
                  </li>
                  <li>
                    Improved NPS from 35→52, reducing crash
                    replacement from 20% to 6% (saving 3.2Cr
                    YoY)
                  </li>
                  <li>
                    Launched &amp; scaled GLP-1 app to 50L MRR
                    with 35% renewal rate, owning end-to-end app
                    experience
                  </li>
                  <li>
                    Revamped T2D renewals using VOC insights,
                    driving 20% improvement and 17–20L MoM
                    revenue uplift
                  </li>
                </ul>
              </div>
            </div>
            <div className="exp-item">
              <div className="exp-l">
                <div className="exp-period">
                  May 2022 — May 2025
                </div>
                <div className="exp-co">
                  Glance (InMobi Group)
                </div>
                <div className="exp-loc">📍 Bengaluru</div>
              </div>
              <div className="exp-r">
                <div className="exp-role">Product Manager</div>
                <ul className="exp-pts">
                  <li>
                    Owned Content Experience &amp; Serving for
                    GlanceTV, partnering with DS, Engg, Design
                    &amp; Content
                  </li>
                  <li>
                    Led market research &amp; cross-functional
                    execution to launch the NFL experience for
                    Google NAB
                  </li>
                  <li>
                    Drove GDPR readiness for EU launch — CMP
                    integration, privacy disclosures, DSR
                    workflows on 2.5M Airtel Xstream devices
                  </li>
                  <li>
                    Generated $1.4M ARR by unlocking 110M
                    lockscreen impressions via Tracfone Telco
                    Partner, serving 5M users
                  </li>
                  <li>
                    Launched GlanceTV's first nationwide brand
                    campaign (Lakme, Women's Day) — 12M
                    impressions, 470K reach, 64% higher ad
                    recall
                  </li>
                </ul>
              </div>
            </div>
            <div className="exp-item">
              <div className="exp-l">
                <div className="exp-period">
                  Jul 2021 — Sep 2021
                </div>
                <div className="exp-co">Razorpay</div>
                <div className="exp-loc">📍 Bengaluru</div>
              </div>
              <div className="exp-r">
                <div className="exp-role">
                  Senior Product Analyst
                </div>
                <ul className="exp-pts">
                  <li>
                    Drove +30% sign-ups and +23% MTU via
                    homepage signup funnel &amp; activation
                    process redesign
                  </li>
                  <li>
                    Awarded "Ace in the Race" for outstanding
                    execution in data instrumentation &amp;
                    dashboards for GST, OCR &amp; merchant
                    verification
                  </li>
                </ul>
              </div>
            </div>
            <div className="exp-item">
              <div className="exp-l">
                <div className="exp-period">
                  Jan 2021 — Jul 2021
                </div>
                <div className="exp-co">
                  Vedantu Innovations
                </div>
                <div className="exp-loc">📍 Bengaluru</div>
              </div>
              <div className="exp-r">
                <div className="exp-role">
                  Senior Product Analyst
                </div>
                <ul className="exp-pts">
                  <li>
                    Drove +800 daily inbound leads by
                    experimenting &amp; optimising the "Book
                    Online Demo" funnel across web and mobile
                  </li>
                  <li>
                    Improved Micro-Concept video retention by
                    +17% &amp; revenue by 7L MoM; +4.3% MoM
                    revenue via demo feedback analysis
                  </li>
                </ul>
              </div>
            </div>
            <div className="exp-item">
              <div className="exp-l">
                <div className="exp-period">
                  Aug 2017 — Jan 2021
                </div>
                <div className="exp-co">Wipro Analytics</div>
                <div className="exp-loc">📍 Bengaluru</div>
              </div>
              <div className="exp-r">
                <div className="exp-role">Senior Analyst</div>
                <ul className="exp-pts">
                  <li>
                    Led cross-functional data initiatives
                    supporting Uber GSS operations across 64
                    languages with Product, Ops &amp; Marketing
                  </li>
                  <li>
                    Saved $XXXK by optimizing Uber Eats'
                    language portfolio via cost-per-language
                    analysis and Localisation vendor SLA
                  </li>
                  <li>
                    Clients at Wipro included Lloyds Banking
                    Group &amp; CapitalOne
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WORK */}
      <div className="s-light" id="work">
        <div className="work-wrap">
          <div className="work-header">
            <div className="eyebrow rv">— Case Studies</div>
            <div className="s-title rv-clip rv-d1">
              THE <em>VOLUMES</em>
            </div>
            <div className="filter-row rv rv-d2">
              {[
                ["all", "All Volumes"],
                ["analytics", "Analytics"],
                ["feature", "Feature Design"],
                ["crm", "CRM & Funnels"],
                ["prototype", "Prototyping"],
              ].map(([f, label]) => (
                <button
                  key={f}
                  className={`ftab${filter === f ? " on" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="swipe-hint">
              <span className="swipe-icon">&rarr;</span>
              &nbsp;Swipe to browse
            </div>
          </div>
          <div className="book-grid rv rv-d3" ref={gridRef} />
          <div className="book-carousel" ref={carouselRef} />
        </div>
      </div>

      {/* MODAL */}
      <div id="modal" className={modalOpen ? "open" : ""}>
        <div id="modal-backdrop" onClick={closeModal} />
        <div id="modal-sheet">
          <div className="modal-handle" />
          <div className="modal-head">
            <div>
              {modalCase && (
                <div
                  className="modal-vol-badge"
                  style={{
                    background: ac,
                    color:
                      modalCase.theme === "cyan" ||
                      modalCase.theme === "gold" ||
                      modalCase.theme === "teal"
                        ? "#000"
                        : "#fff",
                  }}
                >
                  {modalCase.vol} &middot; {modalCase.co}
                </div>
              )}
              {modalCase && (
                <div className="modal-title">
                  {modalCase.title}
                </div>
              )}
            </div>
            <button
              className="modal-close"
              onClick={closeModal}
            >
              &times;
            </button>
          </div>
          {modalCase && (
            <>
              <div className="modal-kpi-row">
                {modalCase.kpis.map((k, i) => (
                  <div className="mkpi" key={i}>
                    <div className="mkv" style={{ color: ac }}>
                      {k.v}
                    </div>
                    <div className="mkl">{k.l}</div>
                  </div>
                ))}
              </div>
              <div className="modal-body">
                <div
                  className="modal-tags"
                  style={{ marginBottom: 24 }}
                >
                  {modalCase.content.tags.map((t) => (
                    <span className="chip" key={t}>
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mchapter">
                  <div className="ch-label">
                    <span
                      className="ch-n"
                      style={{ color: ac }}
                    >
                      01
                    </span>
                    <span className="ch-t">The Problem</span>
                  </div>
                  <div
                    className="ch-body"
                    dangerouslySetInnerHTML={{
                      __html: `<p>${modalCase.content.problem}</p>`,
                    }}
                  />
                </div>
                <div className="mchapter">
                  <div className="ch-label">
                    <span
                      className="ch-n"
                      style={{ color: ac }}
                    >
                      02
                    </span>
                    <span className="ch-t">The Approach</span>
                  </div>
                  <div
                    className="ch-body"
                    dangerouslySetInnerHTML={{
                      __html: `<p>${modalCase.content.approach}</p>`,
                    }}
                  />
                </div>
                <div className="mchapter">
                  <div className="ch-label">
                    <span
                      className="ch-n"
                      style={{ color: ac }}
                    >
                      03
                    </span>
                    <span className="ch-t">The Solution</span>
                  </div>
                  <ul className="ch-list">
                    {modalCase.content.solution.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="mchapter">
                  <div className="ch-label">
                    <span
                      className="ch-n"
                      style={{ color: ac }}
                    >
                      04
                    </span>
                    <span className="ch-t">The Impact</span>
                  </div>
                  <div className="impact-blk">
                    <div className="ib-lbl">Impact Summary</div>
                    <div
                      className="ch-body"
                      dangerouslySetInnerHTML={{
                        __html: `<p>${modalCase.content.impact.text}</p>`,
                      }}
                    />
                    <div className="impact-items">
                      {modalCase.content.impact.items.map(
                        (it, i) => (
                          <div className="iitem" key={i}>
                            <div
                              className="iiv"
                              style={{ color: it.c }}
                            >
                              {it.v}
                            </div>
                            <div className="iil">{it.l}</div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <div className="s-void" id="testi">
        <div className="testi-wrap">
          <div className="testi-heading">
            <div className="eyebrow light-eye rv">
              — Testimonials
            </div>
            <div className="s-title light rv-clip rv-d1">
              WHAT TEAMMATES <em>SAY</em>
            </div>
          </div>
          <div className="testi-ticker-outer rv rv-d2">
            <div className="testi-ticker-track">
              {[...testimonials, ...testimonials].map(
                (t, i) => (
                  <TestimonialCard key={i} t={t} />
                ),
              )}
            </div>
          </div>
          <div className="testi-hint rv rv-d3">
            Hover to pause
          </div>
        </div>
      </div>

      {/* HOBBIES */}
      <div className="s-light" id="offduty">
        <div className="hobbies-wrap">
          <div className="eyebrow rv">— Hobbies</div>
          <div
            className="s-title rv-clip rv-d1"
            style={{ color: "var(--void)" }}
          >
            WHEN I'M <em>NOT</em>
            <br />
            SHIPPING
          </div>
          <div className="hobbies-grid">
            {/* Anime */}
            <div
              className="hobby-card rv-scale rv-d1"
              style={
                {
                  "--hc-color": "#E8273A",
                } as React.CSSProperties
              }
            >
              <div
                className="hc-accent"
                style={{
                  background:
                    "linear-gradient(to right,#E8273A,rgba(232,39,58,.3))",
                }}
              />
              <div className="hc-visual">
                <div className="hc-pattern" />
                <div
                  className="hc-glow"
                  style={{ background: "#E8273A" }}
                />
                <div className="hc-num">01</div>
                <div className="hc-svg-wrap">
                  <svg
                    width="160"
                    height="140"
                    viewBox="-80 -70 160 140"
                    className="anim-kunai"
                  >
                    <g className="spark">
                      <circle
                        cx="0"
                        cy="0"
                        r="4"
                        fill="rgba(255,220,60,.95)"
                      />
                      <line
                        x1="-14"
                        y1="-14"
                        x2="14"
                        y2="14"
                        stroke="rgba(232,39,58,.8)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="14"
                        y1="-14"
                        x2="-14"
                        y2="14"
                        stroke="rgba(232,39,58,.8)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="0"
                        y1="-18"
                        x2="0"
                        y2="18"
                        stroke="rgba(255,220,60,.7)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="-18"
                        y1="0"
                        x2="18"
                        y2="0"
                        stroke="rgba(255,220,60,.7)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </g>
                    <g className="spark2">
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill="none"
                        stroke="rgba(232,39,58,.3)"
                        strokeWidth="1.5"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="20"
                        fill="none"
                        stroke="rgba(232,39,58,.15)"
                        strokeWidth="1"
                      />
                    </g>
                    <g className="k1">
                      <polygon
                        points="0,-40 -4,-10 0,2 4,-10"
                        fill="rgba(190,195,215,.92)"
                        stroke="rgba(160,165,185,.6)"
                        strokeWidth=".5"
                      />
                      <line
                        x1="0"
                        y1="-38"
                        x2="0"
                        y2="0"
                        stroke="rgba(220,225,240,.6)"
                        strokeWidth=".8"
                      />
                      <rect
                        x="-5"
                        y="2"
                        width="10"
                        height="3"
                        rx="1"
                        fill="rgba(140,130,110,.85)"
                      />
                      <rect
                        x="-3"
                        y="5"
                        width="6"
                        height="18"
                        rx="1"
                        fill="rgba(100,80,55,.9)"
                      />
                      <circle
                        cx="0"
                        cy="26"
                        r="7"
                        fill="none"
                        stroke="rgba(160,155,130,.85)"
                        strokeWidth="2.5"
                      />
                    </g>
                    <g className="k2">
                      <polygon
                        points="0,-40 -4,-10 0,2 4,-10"
                        fill="rgba(190,195,215,.92)"
                        stroke="rgba(160,165,185,.6)"
                        strokeWidth=".5"
                      />
                      <line
                        x1="0"
                        y1="-38"
                        x2="0"
                        y2="0"
                        stroke="rgba(220,225,240,.6)"
                        strokeWidth=".8"
                      />
                      <rect
                        x="-5"
                        y="2"
                        width="10"
                        height="3"
                        rx="1"
                        fill="rgba(140,130,110,.85)"
                      />
                      <rect
                        x="-3"
                        y="5"
                        width="6"
                        height="18"
                        rx="1"
                        fill="rgba(100,80,55,.9)"
                      />
                      <circle
                        cx="0"
                        cy="26"
                        r="7"
                        fill="none"
                        stroke="rgba(160,155,130,.85)"
                        strokeWidth="2.5"
                      />
                    </g>
                  </svg>
                </div>
              </div>
              <div className="hc-content">
                <div
                  className="hc-label"
                  style={{ color: "#E8273A" }}
                >
                  Passion
                </div>
                <div className="hc-title">Anime</div>
                <div className="hc-desc">
                  Big fan of layered storytelling — the kind
                  where every detail from episode 1 pays off in
                  the finale. AoT, Vinland Saga, FMA, and JJK
                  are my benchmarks for what great narrative
                  looks like.
                </div>
                <div
                  className="hc-tag"
                  style={{
                    color: "#E8273A",
                    borderColor: "#E8273A30",
                    background: "#E8273A0d",
                  }}
                >
                  Currently watching
                </div>
              </div>
            </div>
            {/* Sketching */}
            <div
              className="hobby-card rv-scale rv-d2"
              style={
                {
                  "--hc-color": "#F0C040",
                } as React.CSSProperties
              }
            >
              <div
                className="hc-accent"
                style={{
                  background:
                    "linear-gradient(to right,#F0C040,rgba(240,192,64,.3))",
                }}
              />
              <div className="hc-visual">
                <div className="hc-pattern" />
                <div
                  className="hc-glow"
                  style={{ background: "#F0C040" }}
                />
                <div className="hc-num">02</div>
                <div className="hc-svg-wrap">
                  <svg
                    width="160"
                    height="120"
                    viewBox="-80 -55 160 110"
                    className="anim-sketch"
                  >
                    <rect
                      x="-66"
                      y="-44"
                      width="132"
                      height="88"
                      rx="4"
                      fill="rgba(255,255,240,.05)"
                      stroke="rgba(240,192,64,.08)"
                      strokeWidth="1"
                    />
                    <path
                      className="line1"
                      d="M-54,-14 L-20,-18 L10,-12 L38,-16 L62,-10"
                      fill="none"
                      stroke="rgba(240,192,64,.82)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      className="line2"
                      d="M-54,4 L-18,8 L12,2 L40,6 L62,10"
                      fill="none"
                      stroke="rgba(240,192,64,.65)"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <g
                      className="pencil-g"
                      style={{
                        transform:
                          "translate(-54px,-24px) rotate(-30deg)",
                      }}
                    >
                      <rect
                        x="-3.5"
                        y="-28"
                        width="7"
                        height="7"
                        rx="1.5"
                        fill="rgba(220,80,80,.9)"
                      />
                      <rect
                        x="-3.5"
                        y="-17"
                        width="7"
                        height="30"
                        rx="1.5"
                        fill="rgba(240,192,64,.95)"
                      />
                      <polygon
                        points="-3.5,13 3.5,13 0,22"
                        fill="rgba(200,170,120,.85)"
                      />
                      <polygon
                        points="-1.2,20 1.2,20 0,24"
                        fill="rgba(60,55,65,.9)"
                      />
                    </g>
                  </svg>
                </div>
              </div>
              <div className="hc-content">
                <div
                  className="hc-label"
                  style={{ color: "#F0C040" }}
                >
                  Creative
                </div>
                <div className="hc-title">Sketching</div>
                <div className="hc-desc">
                  I sketch to think — on notebooks, sticky
                  notes, whatever's nearby. It's how I get ideas
                  out of my head before they disappear. Mostly
                  rough wireframes and random diagrams.
                </div>
                <div
                  className="hc-tag"
                  style={{
                    color: "#F0C040",
                    borderColor: "#F0C04030",
                    background: "#F0C0400d",
                  }}
                >
                  Product flows
                </div>
              </div>
            </div>
            {/* Table Tennis */}
            <div
              className="hobby-card rv-scale rv-d3"
              style={
                {
                  "--hc-color": "#00D4FF",
                } as React.CSSProperties
              }
            >
              <div
                className="hc-accent"
                style={{
                  background:
                    "linear-gradient(to right,#00D4FF,rgba(0,212,255,.3))",
                }}
              />
              <div className="hc-visual">
                <div className="hc-pattern" />
                <div
                  className="hc-glow"
                  style={{ background: "#00D4FF" }}
                />
                <div className="hc-num">03</div>
                <div className="hc-svg-wrap">
                  <svg
                    width="160"
                    height="110"
                    viewBox="-80 -55 160 110"
                    className="anim-tt"
                  >
                    <g
                      className="paddle-l"
                      style={{
                        transform:
                          "translate(-52px,0) rotate(-20deg)",
                      }}
                    >
                      <ellipse
                        cx="0"
                        cy="0"
                        rx="18"
                        ry="20"
                        fill="rgba(0,180,220,.8)"
                        stroke="rgba(0,212,255,.5)"
                        strokeWidth="1"
                      />
                      <rect
                        x="-3"
                        y="20"
                        width="6"
                        height="18"
                        rx="3"
                        fill="rgba(120,80,40,.9)"
                      />
                    </g>
                    <g
                      className="paddle-r"
                      style={{
                        transform:
                          "translate(52px,0) rotate(20deg)",
                      }}
                    >
                      <ellipse
                        cx="0"
                        cy="0"
                        rx="18"
                        ry="20"
                        fill="rgba(220,60,60,.8)"
                        stroke="rgba(255,100,80,.5)"
                        strokeWidth="1"
                      />
                      <rect
                        x="-3"
                        y="20"
                        width="6"
                        height="18"
                        rx="3"
                        fill="rgba(120,80,40,.9)"
                      />
                    </g>
                    <g
                      className="ball-g"
                      style={{
                        transform: "translate(-34px,2px)",
                      }}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="8"
                        fill="rgba(240,240,240,.92)"
                        stroke="rgba(200,200,200,.4)"
                        strokeWidth=".5"
                      />
                    </g>
                    <line
                      x1="0"
                      y1="-36"
                      x2="0"
                      y2="36"
                      stroke="rgba(240,238,248,.2)"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />
                  </svg>
                </div>
              </div>
              <div className="hc-content">
                <div
                  className="hc-label"
                  style={{ color: "#00D4FF" }}
                >
                  Sport
                </div>
                <div className="hc-title">Table Tennis</div>
                <div className="hc-desc">
                  Been playing TT for years — it's the one sport
                  where I genuinely enjoy losing because it
                  means I'm playing someone better. Best stress
                  relief I've found so far.
                </div>
                <div
                  className="hc-tag"
                  style={{
                    color: "#00D4FF",
                    borderColor: "#00D4FF30",
                    background: "#00D4FF0d",
                  }}
                >
                  Competitive player
                </div>
              </div>
            </div>
            {/* Cooking */}
            <div
              className="hobby-card rv-scale rv-d4"
              style={
                {
                  "--hc-color": "#FF8C42",
                } as React.CSSProperties
              }
            >
              <div
                className="hc-accent"
                style={{
                  background:
                    "linear-gradient(to right,#FF8C42,rgba(255,140,66,.3))",
                }}
              />
              <div className="hc-visual">
                <div className="hc-pattern" />
                <div
                  className="hc-glow"
                  style={{ background: "#FF8C42" }}
                />
                <div className="hc-num">04</div>
                <div className="hc-svg-wrap">
                  <svg
                    width="160"
                    height="130"
                    viewBox="-80 -65 160 130"
                    className="anim-cook"
                  >
                    <g className="pan-g">
                      <ellipse
                        cx="0"
                        cy="16"
                        rx="42"
                        ry="12"
                        fill="rgba(100,100,110,.9)"
                      />
                      <rect
                        x="42"
                        y="10"
                        width="28"
                        height="8"
                        rx="4"
                        fill="rgba(80,70,60,.9)"
                      />
                    </g>
                    <g className="egg-g">
                      <ellipse
                        cx="0"
                        cy="8"
                        rx="24"
                        ry="12"
                        fill="rgba(255,255,245,.85)"
                      />
                      <circle
                        cx="0"
                        cy="6"
                        r="9"
                        fill="rgba(255,210,60,.85)"
                      />
                    </g>
                    <circle
                      className="sz1"
                      cx="-18"
                      cy="20"
                      r="2.5"
                      fill="rgba(255,140,66,.55)"
                    />
                    <circle
                      className="sz2"
                      cx="4"
                      cy="24"
                      r="2"
                      fill="rgba(255,140,66,.5)"
                    />
                    <circle
                      className="sz3"
                      cx="20"
                      cy="19"
                      r="3"
                      fill="rgba(255,140,66,.45)"
                    />
                  </svg>
                </div>
              </div>
              <div className="hc-content">
                <div
                  className="hc-label"
                  style={{ color: "#FF8C42" }}
                >
                  At home
                </div>
                <div className="hc-title">Cooking</div>
                <div className="hc-desc">
                  I cook mostly Indian and continental. Weekends
                  I'll try something new — sometimes it's great,
                  sometimes it's a disaster. The kitchen is the
                  one place I'm happy either way.
                </div>
                <div
                  className="hc-tag"
                  style={{
                    color: "#FF8C42",
                    borderColor: "#FF8C4230",
                    background: "#FF8C420d",
                  }}
                >
                  Weekend chef
                </div>
              </div>
            </div>
            {/* Travel */}
            <div
              className="hobby-card rv-scale rv-d5"
              style={
                {
                  "--hc-color": "#4ade80",
                } as React.CSSProperties
              }
            >
              <div
                className="hc-accent"
                style={{
                  background:
                    "linear-gradient(to right,#4ade80,rgba(74,222,128,.3))",
                }}
              />
              <div className="hc-visual">
                <div className="hc-pattern" />
                <div
                  className="hc-glow"
                  style={{ background: "#4ade80" }}
                />
                <div className="hc-num">05</div>
                <div className="hc-svg-wrap">
                  <svg
                    width="180"
                    height="120"
                    viewBox="-90 -60 180 120"
                    className="anim-travel"
                  >
                    <rect
                      x="-72"
                      y="-46"
                      width="144"
                      height="92"
                      rx="8"
                      fill="rgba(74,222,128,.06)"
                      stroke="rgba(74,222,128,.2)"
                      strokeWidth="1"
                    />
                    <path
                      className="route"
                      d="M-56,8 C-28,-34 28,-34 56,8"
                      fill="none"
                      stroke="rgba(74,222,128,.5)"
                      strokeWidth="2"
                      strokeDasharray="6 5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="-56"
                      cy="8"
                      r="6"
                      fill="rgba(74,222,128,.7)"
                    />
                    <text
                      x="-56"
                      y="12"
                      textAnchor="middle"
                      fill="white"
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      A
                    </text>
                    <circle
                      cx="56"
                      cy="8"
                      r="6"
                      fill="rgba(74,222,128,.7)"
                    />
                    <text
                      x="56"
                      y="12"
                      textAnchor="middle"
                      fill="white"
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      B
                    </text>
                    <circle
                      className="traveldot"
                      r="5"
                      fill="#4ade80"
                      style={
                        {
                          offsetPath:
                            "path('M-56,8 C-28,-34 28,-34 56,8')",
                        } as any
                      }
                    />
                  </svg>
                </div>
              </div>
              <div className="hc-content">
                <div
                  className="hc-label"
                  style={{ color: "#4ade80" }}
                >
                  Explorer
                </div>
                <div className="hc-title">Travel</div>
                <div className="hc-desc">
                  Love the feeling of landing somewhere new and
                  figuring it out. No rigid itineraries — just a
                  list of things worth seeing and room for
                  whatever happens in between.
                </div>
                <div
                  className="hc-tag"
                  style={{
                    color: "#4ade80",
                    borderColor: "#4ade8030",
                    background: "#4ade800d",
                  }}
                >
                  Always planning next
                </div>
              </div>
            </div>
            {/* Photography */}
            <div
              className="hobby-card rv-scale rv-d6"
              style={
                {
                  "--hc-color": "#C084FC",
                } as React.CSSProperties
              }
            >
              <div
                className="hc-accent"
                style={{
                  background:
                    "linear-gradient(to right,#C084FC,rgba(192,132,252,.3))",
                }}
              />
              <div className="hc-visual">
                <div className="hc-pattern" />
                <div
                  className="hc-glow"
                  style={{ background: "#C084FC" }}
                />
                <div className="hc-num">06</div>
                <div className="hc-svg-wrap">
                  <svg
                    width="140"
                    height="120"
                    viewBox="-70 -60 140 120"
                    className="anim-photo"
                  >
                    <rect
                      x="-44"
                      y="-32"
                      width="88"
                      height="64"
                      rx="8"
                      fill="rgba(40,35,50,.85)"
                      stroke="rgba(192,132,252,.3)"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="-12"
                      y="-40"
                      width="24"
                      height="10"
                      rx="4"
                      fill="rgba(50,45,60,.9)"
                      stroke="rgba(192,132,252,.2)"
                      strokeWidth="1"
                    />
                    <g className="lens-g">
                      <circle
                        cx="6"
                        cy="10"
                        r="28"
                        fill="rgba(30,25,40,.9)"
                        stroke="rgba(192,132,252,.35)"
                        strokeWidth="2"
                      />
                      <circle
                        cx="6"
                        cy="10"
                        r="22"
                        fill="rgba(20,15,30,.95)"
                        stroke="rgba(192,132,252,.2)"
                        strokeWidth="1"
                      />
                      <circle
                        cx="6"
                        cy="10"
                        r="14"
                        fill="rgba(10,5,20,.95)"
                        stroke="rgba(192,132,252,.15)"
                        strokeWidth="1"
                      />
                    </g>
                    <rect
                      className="shutter-blade"
                      x="-22"
                      y="8"
                      width="44"
                      height="6"
                      rx="2"
                      fill="rgba(192,132,252,.65)"
                      style={{ transformOrigin: "6px 11px" }}
                    />
                    <circle
                      className="flash-ring"
                      cx="6"
                      cy="10"
                      r="0"
                      fill="none"
                      stroke="rgba(192,132,252,.6)"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="28"
                      cy="-25"
                      r="6"
                      fill="rgba(80,75,90,.9)"
                      stroke="rgba(192,132,252,.25)"
                      strokeWidth="1"
                    />
                    <circle
                      cx="28"
                      cy="-25"
                      r="3.5"
                      fill="rgba(192,132,252,.35)"
                    />
                  </svg>
                </div>
              </div>
              <div className="hc-content">
                <div
                  className="hc-label"
                  style={{ color: "#C084FC" }}
                >
                  Visual
                </div>
                <div className="hc-title">Photography</div>
                <div className="hc-desc">
                  Street and travel photography on my phone
                  mostly. Chasing light, interesting faces, and
                  scenes that tell a story without a caption.
                </div>
                <div
                  className="hc-tag"
                  style={{
                    color: "#C084FC",
                    borderColor: "#C084FC30",
                    background: "#C084FC0d",
                  }}
                >
                  Street & travel
                </div>
              </div>
            </div>
          </div>

          {/* Anime Picks */}
          <div className="anime-picks rv rv-d2">
            <div className="ap-label">
              Currently watching / all-time favourites
            </div>
            <div className="ap-scroll">
              {[
                ["Attack on Titan", "Action \u00b7 Strategy"],
                ["Demon Slayer", "Action \u00b7 Visual Art"],
                ["Death Note", "Psychological \u00b7 Thriller"],
                [
                  "Fullmetal Alchemist",
                  "Adventure \u00b7 Deep",
                ],
                ["Jujutsu Kaisen", "Action \u00b7 Current"],
                ["One Punch Man", "Comedy \u00b7 Power"],
                ["Vinland Saga", "Historical \u00b7 Epic"],
                ["Haikyuu!!", "Sports \u00b7 Motivation"],
              ].map(([t, g]) => (
                <div className="ap-item" key={t}>
                  <div className="ap-title">{t}</div>
                  <div className="ap-genre">{g}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT */}
      <div className="contact-wrap s-void" id="contact">
        <div className="c-speed">
          <svg
            viewBox="0 0 1440 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <g
              stroke="rgba(232,39,58,.6)"
              strokeWidth=".5"
              fill="none"
            >
              {[0, 100, 200, 300, 400, 500, 600].map((y) => (
                <line
                  key={`l${y}`}
                  x1="720"
                  y1="300"
                  x2="-200"
                  y2={y}
                />
              ))}
              {[0, 200, 400, 600].map((y) => (
                <line
                  key={`r${y}`}
                  x1="720"
                  y1="300"
                  x2="1640"
                  y2={y}
                />
              ))}
            </g>
          </svg>
        </div>
        <div className="c-chapter rv">
          — Thanks for stopping by —
        </div>
        <div className="c-big rv rv-d1">
          LET'S <em className="red">BUILD</em>
          <br />
          <span className="stroke">SOMETHING</span>
          <br />
          <em className="red">IMPACTFUL</em>
        </div>
        <p className="c-sub rv rv-d2">
          Open to <strong>senior PM roles</strong> in health
          tech, consumer, or fintech. Data fluency, clinical
          context, ability to ship — fast.
        </p>
        <div
          className="rv rv-d3"
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <a
            className="c-btn-p"
            href="https://linkedin.com/in/akarshan910"
            target="_blank"
            rel="noreferrer"
            style={{
              minWidth: 320,
              justifyContent: "center",
              padding: "18px 48px",
              fontSize: 14,
              letterSpacing: ".2em",
            }}
          >
            CONNECT ON LINKEDIN.
          </a>
        </div>
        <div
          className="c-links rv rv-d4"
          style={{ justifyContent: "center", gap: 16 }}
        >
          <a
            className="c-btn-g"
            href="https://drive.google.com/file/d/1yAEh4CRz0KLLDPQs4FtfIUPB4fBWnLWq/view?usp=sharing"
            target="_blank"
            rel="noreferrer"
            style={{
              minWidth: 240,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "16px 44px",
              background: "rgba(240,238,248,.04)",
              borderRadius: 4,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download CV
          </a>
          <a
            className="c-btn-g"
            href="mailto:akarshan910@gmail.com"
            style={{
              minWidth: 240,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 44px",
              background: "rgba(240,238,248,.04)",
              borderRadius: 4,
            }}
          >
            Email me &rarr;
          </a>
        </div>
      </div>

      <footer className="portfolio-footer">
        <div
          id="footer-type"
          ref={footerRef}
          style={{
            fontFamily: "'Bebas Neue',sans-serif",
            fontSize: 13,
            letterSpacing: ".2em",
            color: "#E8273A",
            textTransform: "uppercase",
            minHeight: "1.5em",
          }}
        />
      </footer>
    </div>
  );
}