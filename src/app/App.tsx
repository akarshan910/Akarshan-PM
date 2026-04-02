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
    co: "Sri Mandir",
    title: "PUJA ENGAGEMENT PLATFORM",
    desc: "WhatsApp-native puja booking with AI recommendations and spiritual calendar to increase repeat devotion",
    impact: "+30% monthly orders",
    tags: ["crm", "personalization", "monetization", "engagement", "prototype"],
    kpis: [
      { v: "30%", l: "Monthly orders per user uplift target" },
      { v: "12%", l: "WhatsApp conversion rate goal" },
      { v: "5", l: "Regional languages in Phase 1" },
    ],
    content: {
      opportunity:
        "<strong>The Opportunity:</strong> Sri Mandir attracts a uniquely diverse base of devotees across age, tech-fluency, and geography. Yet the platform experiences high single-session churn and low repeat rates. Users treat puja booking as a transactional one-off rather than a spiritual practice. The gap is not in the puja quality (priests and rituals are authentic) — it's in how users discover, trust, and stay connected to the platform.",
      userChallenges: {
        millennialsNRIs:
          "<strong>Tech-Savvy Millennials & NRIs:</strong> Desire spirituality without friction. They browse curated puja recommendations tied to their life events (birthdays, anniversaries, housewarming) and expect personalized reminders for auspicious dates. Currently, they must manually search through 100+ pujas with no context.",
        elderlyUsers:
          "<strong>Non-Digital Elderly Users (55+):</strong> Trust WhatsApp implicitly (use daily for family) but distrust app-based payments. They need simple, templated booking flows on WhatsApp with clear confirmation. They wish to gift pujas to family without forcing them to install another app.",
        firstTimeUsers:
          "<strong>First-Time / Skeptical Users:</strong> Uncertainty about authenticity. They want proof — video evidence of the ritual being performed, clarity on Gotra usage, and zero hidden charges. Social proof ('1,247 devotees booked this puja this month') builds confidence.",
      },
      whyNow:
        "<strong>Why This Matters:</strong> Spirituality is aspirational and habit-forming. Users who experience one personalized, well-executed puja are 3× more likely to return for milestone moments (Diwali, anniversaries, Ekadashi). This unlocks a subscription economy (monthly spiritual packages) and a word-of-mouth channel (gifting to family). WhatsApp is the distribution layer — already trusted, already installed, already the primary communication channel for Indian users.",
      strategicDvisions: [
        {
          name: "Friction Elimination",
          detail:
            "WhatsApp as the primary booking channel. Full booking + confirmation + prasad tracking flow, zero app installs required.",
        },
        {
          name: "Discovery & Personalisation",
          detail:
            "Recommendation engine powered by past bookings, personal dates, Gotra, and auspicious calendar. 'For You' carousel becomes the default entry point for returning users.",
        },
        {
          name: "Trust Through Transparency",
          detail:
            "Short-form video feed (Reels-style) showing actual puja performances. Real-time ritual confirmation sent to users post-completion. Gotra verification modal ensures ceremonial accuracy.",
        },
        {
          name: "Habit Formation",
          detail:
            "Spiritual Calendar with push + WhatsApp reminders for personal milestones and festival dates. Streaks and milestones celebrate consistency.",
        },
        {
          name: "Accessibility",
          detail:
            "Phased rollout of 5 regional languages (Hindi, Tamil, Telugu, Kannada, Bengali). Each language includes culturally relevant puja variants and priest profiles.",
        },
      ],
      keyFeatures: [
        {
          title: "WhatsApp Booking Gateway",
          desc: "Users tap a menu in WhatsApp → browse top 5 pujas → select package → pay via deep-link → confirmation + tracking on WhatsApp. TAT from tap to confirmation: 60 seconds.",
        },
        {
          title: "AI Recommendations",
          desc: "Cold-start (new users): location + trending pujas. Warm (returning users): past bookings + saved pujas + personal dates + Gotra. Refreshes 24-hourly.",
        },
        {
          title: "Video Feed",
          desc: "Dedicated tab showing 30-second clips of actual puja performances, chadhavs, and aartis. Tap 'Book This Puja' to jump directly to booking.",
        },
        {
          title: "Spiritual Calendar",
          desc: "Personal dates (birthdays, anniversaries) + Hindu festival calendar (Ekadashi, Navratri, Diwali). Reminders 7 days and 1 day before. Curated puja suggestions for each date.",
        },
        {
          title: "Profile Sync",
          desc: "Simple modal on first visit: Gotra, birthday, anniversary, marital status. Each field explains its purpose. Editable anytime. Data powers all personalization.",
        },
      ],
      userJourneys: [
        {
          persona: "First-Time User (Millennial)",
          flow: "Opens app → sees trending pujas + video feed → watches 2 videos → builds trust → WhatsApp prompt 'Book on WhatsApp' → books Ganesh Puja in 60 seconds → receives confirmation on WhatsApp.",
        },
        {
          persona: "Returning Devotee (Elderly via WhatsApp)",
          flow: "Receives WhatsApp reminder '7 days until your birthday — recommended pujas inside' → taps link → Puja booking menu → selects Saraswati Puja → shares confirmation with family WhatsApp group.",
        },
        {
          persona: "NRI User (Diaspora)",
          flow: "Logs in, sees 'For You' carousel → 'Grih Pravesh Pujas for your housewarming' → adds to cart → WhatsApp reminder before ceremony → video proof of ritual sent post-completion → forwards to parents.",
        },
        {
          persona: "Festival Season User",
          flow: "Gets Diwali calendar notification → 'Popular Diwali Pujas in your city' → browses trending recommendations → books 3 pujas → tracks all via WhatsApp over 5 days.",
        },
      ],
      metrics: [
        {
          category: "Adoption & Day 1 Success",
          items: [
            "First-time booking completion rate: 35% (baseline) → 42% (target)",
            "WhatsApp opt-in rate within 7 days: 45%",
            "Profile data collection: Gotra filled by 38% of new users",
          ],
        },
        {
          category: "Engagement & Repeat",
          items: [
            "Monthly orders per active user: 1.2x (baseline) → 1.6x (target) +30%",
            "WhatsApp booking conversion: 12% of reached users book within 7 days",
            "Puja section bounce rate: 60% → 42% (-18pp)",
          ],
        },
        {
          category: "Expansion & Accessibility",
          items: [
            "Vernacular user bookings: 8% (baseline) → 15% (9-month target)",
            "Video feed session depth: ≥4 videos per session",
            "Calendar reminder CTR: ≥25%",
          ],
        },
      ],
      tags: [
        "WhatsApp Business API",
        "Recommendation Engine",
        "Spiritual Calendar",
        "Video Feed",
        "Vernacular Localization",
        "Trust Design",
        "Habit Formation",
        "Monetization",
        "Engagement",
      ],
      prototypeLink: "/sri_mandir_prototype.html",
    },
  },
  {
    id: 2,
    theme: "cyan",
    vol: "VOL.02",
    volJp: "",
    co: "Word Trip · Playsimple",
    title: "WORD GAMES MONETISATION STRATEGY",
    desc: "Streamlined onboarding + IAP optimization + retention mechanics to unlock #3 app store ranking and 1.35x MAU growth",
    impact: "+1.35× MAU in 12mo",
    tags: [ "monetization", "retention", "mobile", "games", "engagement"],
    kpis: [
      { v: "50%", l: "Day 1 retention target (vs 35% baseline)" },
      { v: "3.5%", l: "IAP conversion (2.5% → 3.5%)" },
      { v: "8.8M", l: "MAU target (6.5M → 8.8M)" },
    ],
    content: {
      competitiveGap: {
        overview:
          "<strong>The Problem:</strong> Word Trip is #5 by revenue (~$500K/mo) with 6.5M MAU. Word Escapes generates 4.4× more revenue (+$2M/mo) with only 1.7M incremental users. This is not a user acquisition problem — it's a monetization and retention crisis.",
        benchmark: {
          wordTrip: { mau: "6.5M", revenue: "$500K/mo", conversion: "~2.5%", rank: "#62 App Store" },
          wordEscapes: {
            mau: "8.2M",
            revenue: "$2.2M/mo",
            conversion: "~4%",
            rank: "#6 App Store",
          },
          wordsFriends: {
            mau: "13.8M",
            revenue: "$2.7M/mo",
            conversion: "~4.5%",
            rank: "#51 App Store",
          },
        },
        insight:
          "The gap is 1pp conversion rate (2.5% vs 3.5%+). On 6.5M MAU, a 1pp swing = +$65K/mo immediate revenue. Better retention enables reinvestment into UA.",
      },
      rootCauseAnalysis: [
        {
          cause: "High Pre-Gameplay Friction",
          evidence:
            "5+ modal pop-ups before first puzzle. Competitors: ≤2 clicks. Each additional click raises drop-off by ~20% (GameAnalytics). Users install 3 games simultaneously and play the one with fastest time-to-gameplay.",
          impact: "Day 0 → Day 1 drop-off = 65% (vs 50% industry benchmark)",
        },
        {
          cause: "Single Game Format",
          evidence:
            "Only one word puzzle mode available initially. Players exhaust novelty loop in 10–15 minutes. No incentive to return Day 2.",
          impact: "Session length = 15 min avg (vs 22–45 min top performers). Early churn accelerates.",
        },
        {
          cause: "Suboptimal IAP Hierarchy",
          evidence:
            "Best-value bundle placed 3rd. Urgency mechanics absent (no countdown timers, no flash sales). Purchase restore missing — reinstalls = lost purchases = low confidence to spend.",
          impact: "Conversion 2.5% vs 3.5%+ benchmark. Top spenders churn after 1 bad reinstall experience.",
        },
        {
          cause: "No Retention Infrastructure",
          evidence:
            "No leaderboards, daily streaks, seasonal events, or PvP. Top competitors all have these. Users see no reason to return.",
          impact: "D7 retention 18% (vs 25%+ benchmark). No habit loop.",
        },
      ],
      strategicInitiatives: [
        {
          title: "Streamline Onboarding",
          ricePriority: "RICE 18 (#1)",
          timing: "Q1 (Weeks 1–3)",
          approach:
            "Reduce click-to-gameplay to ≤2. Tutorial puzzle → optional account creation (post-game) → direct to Level 1. Defer all permission requests to contextually relevant moments (Day 3, after 5 puzzles). Result: 15-second cold-start.",
        },
        {
          title: "Optimize IAP",
          ricePriority: "RICE 6.8 (#2)",
          timing: "Q1 (Weeks 3–6)",
          approach:
            "Restructure bundle hierarchy: most popular first, best-value highlighted. Add 24-hour countdown timers on session 1 & 4. Implement purchase restore. Test personalised first-purchase offers. Target: 3.5% conversion within 3 months.",
        },
        {
          title: "Unlock Multiple Game Formats",
          ricePriority: "RICE 4.0 (#3)",
          timing: "Q2 (Weeks 7–12)",
          approach:
            "Daily Challenge with rotating formats (Word Wheel, Crossword, Anagram Sprint). Secondary Word Puzzle unlocked from Level 1, not gated. Independent progress tracking per format prevents format-switching fatigue.",
        },
        {
          title: "Retention Layers",
          ricePriority: "RICE 3.4 (#4)",
          timing: "Q2 (Weeks 13–18)",
          approach:
            "Global + Friends leaderboard (weekly resets, rank always visible). 7-day login streak with Day 7 premium reward (hints, ad-free hour, bonus miles). Win-back push for 7+ day lapsed users. Seasonal events framework for Holi, Diwali, Christmas.",
        },
      ],
      roadmap: [
        {
          quarter: "Q1",
          months: "Months 1–3",
          deliverables:
            "Onboarding cleanup (≤2 clicks) · IAP revamp (hierarchy, timers, restore) · Ad frequency cap (sessions 1–3)",
          kpiTarget:
            "Day 1 retention ≥48% | IAP conv. ≥3.1% | Session length ≥18 min",
        },
        {
          quarter: "Q2",
          months: "Months 4–6",
          deliverables:
            "Daily Challenge · Word Puzzle secondary format (Level 1+) · Global + Friends leaderboard · 7-day streak system",
          kpiTarget:
            "Day 7 retention ≥22% | Session length ≥22 min | DAU/MAU ≥23%",
        },
        {
          quarter: "Q3",
          months: "Months 7–9",
          deliverables:
            "Seasonal events · Personalized IAP bundles · Market research for localization · Win-back campaign",
          kpiTarget:
            "Day 28 retention ≥18% | MAU ≥7.5M | ARPU ≥$0.68",
        },
        {
          quarter: "Q4",
          months: "Months 10–12",
          deliverables:
            "PvP word battles · 2 localized markets (6M+ population each) · Travel Companions social system",
          kpiTarget:
            "MAU ≥8.8M | App Store rank ≤#30 | ARPU ≥$0.75 | Revenue ≥$800K/mo",
        },
      ],
      successFramework: {
        retentionMetrics: [
          "Day 1 Retention: 35% (baseline) → 48% target (+13pp) — first 24h experience is critical",
          "Day 7 Retention: ~18% → 25% (+7pp) — habit formation checkpoint",
          "Day 28 Retention: ~12% → 18% (+6pp) — LTV signal, subscription-readiness indicator",
          "Session Length: 15 min avg → 22 min (+7 min) — multiple formats and engagement depth",
        ],
        monetizationMetrics: [
          "IAP Conversion: 2.5% → 3.5% within 3 months of Q1 launch (+1pp = +$65K/mo at baseline MAU)",
          "Average Session Value: Current ~$0.08 → $0.12 (estimated post-IAP revamp)",
          "ARPU: $0.60 → $0.75 in 12 months (+25%)",
          "Revenue: $500K/mo → $800K/mo by Month 12 (+60%)",
        ],
        growthMetrics: [
          "MAU: 6.5M → 8.8M in 12 months (+1.35× organic growth + UA)",
          "App Store Ranking: #62 → #30 within 12 months (retention improves ranking algorithms)",
          "Play Store Ranking: #23 → #15 (retention + review lift)",
          "DAU/MAU: 18% → 25%+ (better habit formation = stickier cohorts)",
        ],
      },
      tags: [
        "Mobile Games",
        "Monetization Strategy",
        "Retention Design",
        "IAP Optimization",
        "Leaderboards",
        "Seasonal Events",
        "Competitive Analysis",
        "Engagement",
      ],
      prototypeLink: "/word_trip_prototype.html",
    },
  },
  {
    id: 3,
    theme: "blue",
    vol: "VOL.03",
    volJp: "",
    co: "Arcana · Workspace",
    title: "ARCANA WORKSPACE",
    desc: "Bloomberg-style modular launchpad for institutional investors — grid-based workspaces with configurable widgets for real-time market monitoring",
    impact: "0→1 shipped",
    tags: ["0→1", "b2b", "prototype", "workflows", "fintech"],
    kpis: [
      { v: "7", l: "Priority widgets designed" },
      { v: "V1", l: "Full PRD → prototype shipped" },
      { v: "∞", l: "Workspace configurations possible" },
    ],
    content: {
      problemStatement: {
        overview:
          "Institutional investors, analysts & researchers operate in a high frequency, high cognitive load environment. Their daily workflow involves simultaneously monitoring live prices, charts, news, alerts, and global market context while switching context across multiple asset classes.",
        challenges: [
          {
            title: "Fragmented Information",
            desc: "Prices, charts, news, alerts, and market hours live in separate views. Users must mentally stitch insights together by exploring each view.",
          },
          {
            title: "High Context Switching Cost",
            desc: "Switching between workflows (e.g., market open vs research) requires re-navigation. Analysts lose time reconstructing views multiple times a day.",
          },
          {
            title: "One-Size-Fits-All Interfaces",
            desc: "Different users track different assets, regions, and time horizons. Yet interfaces offer no personalisation.",
          },
          {
            title: "Poor State Persistence",
            desc: "Users expect layouts, filters, and configurations to persist across sessions. Rework to analyse the same thing wastes time.",
          },
        ],
      },
      whyItMatters:
        "<strong>Product stickiness multiplier:</strong> Custom dashboards directly correlate with higher retention and daily engagement, by becoming their first preference for daily monitoring. Market precedent: Bloomberg Launchpad is one of the most heavily used terminal features because it solves this exact problem through customizable, persistent widgets & workspaces.",
      productVision:
        "Build Arcana Workspace, a modular, Bloomberg-style Launchpad that allows users to create, save, and switch between personalised workspaces composed of configurable widgets — optimised for real-time monitoring, clarity, and execution with speed, leading to repeat daily usage.",
      v1Goals: [
        "Enable users to build custom workspaces using modular widgets from scratch or premade templates",
        "Templates are workspace formats with pre-configured widgets (NEWS, Portfolio, Research) for distinct use cases with must-have global settings (e.g., Index/Stock selector for Portfolio)",
        "Support adding, resizing, configuring, and saving widget layouts",
        "Allow multiple tabs/pages per workspace with add, delete, reorder, rename, and share capabilities",
        "Preserve widget-level intelligence (e.g., Nvidia selected in both price monitor & performance chart)",
      ],
      marketResearch: {
        userBehavior:
          "A Bloomberg Launchpad user typically: (1) combines price monitors + charts + news feeds to correlate headlines with price reactions, (2) uses alerts to catch significant moves without continuous hovering, (3) saves workflows by theme (commodity tracking, earnings day, global markets).",
        daySegmentation:
          "This mirrors how users segment their day: morning pre-open scan, live session monitoring, post-close analysis.",
        widgetPriority: [
          {
            widget: "Equity Price Monitor",
            rationale: "Most basic, most used — priority 1 for every workflow",
          },
          {
            widget: "Index Tracker",
            rationale: "Global indices (S&P, Nifty). Macro sentiment gauge — widely used by analysts",
          },
          {
            widget: "Commodity Prices",
            rationale: "Critical for cross-asset views (similar to Bloomberg's commodities widget)",
          },
          {
            widget: "Real-Time Chart",
            rationale: "Visual confirmation of trends & patterns — core to workflows",
          },
          {
            widget: "Live News Feed",
            rationale: "Provides context to price movements — heavily used",
          },
          {
            widget: "Alerts",
            rationale: "Simple price threshold alerts. Helps catch key events without always watching",
          },
          {
            widget: "Timezone / Market Hours",
            rationale: "Supports a global view across regions",
          },
        ],
        layerStrategy:
          "V1 = Signal intake + context + workflow persistence. V2 = Outcome measurement (performance, deep analytics, risk, attribution, order execution integration).",
      },
      coreCapabilities: [
        {
          title: "Workspace (Grid-Based Canvas)",
          features: [
            "Grid-based canvas (like Metabase) customizable by creating views",
            "Preset templates for core use cases (Portfolio Analysis, Single Stock Analysis) with pre-specified widgets",
            "Global settings applied during creation (e.g., stock selection powers all widgets)",
            "Workspaces can be copied, renamed, shared, and managed from settings",
            "Workspaces appear as tabs, switchable instantly",
          ],
        },
        {
          title: "Widgets",
          features: [
            "Modular, atomic blocks with multiple responsive UIs across grid sizes (Apple widget paradigm)",
            "Configurable, resizable, repositionable, removable",
            "Widgets retain their capabilities (e.g., Summary widget retains % AUM & % Gross selection)",
            "Export widget data in Excel format",
            "No overlapping; automatic grid placement",
          ],
        },
        {
          title: "Pages",
          features: [
            "Each workspace supports multiple pages representing sub-contexts (Portfolio: Price, Valuation, Macro)",
            "Pages visible side-by-side, selectable with tab navigation",
            "Add, delete, reorder, rename, share, and customize from settings",
            "Independent widget configurations per page",
          ],
        },
        {
          title: "Group Components (V1 Foundation)",
          features: [
            "V1: Global settings during template creation for workspace-wide securities",
            "V2 (Full Manager): Users can create groups of components that auto-update when security changes",
            "Enables cross-widget context linking",
          ],
        },
      ],
      userJourneys: [
        {
          journey: "First-Time User Experience",
          steps: [
            "Opens Arcana Workspace → clicks Create New",
            "Selects one of three options: (1) Auto-optimized view for screen resolution, (2) Sample view template, (3) Blank canvas",
            "Sees Launchpad toolbar with search bar for components/templates",
            "Adds first widget (e.g., Equity Price Monitor) or selects a template",
            "Configures widget parameters (columns, filters, indicators) and adjusts position/size",
            "Saves the workspace",
            "Exit State: Saved workspace with ≥1 page and ≥1 widget",
          ],
        },
        {
          journey: "Adding & Configuring a Widget",
          steps: [
            "Clicks search bar → opens Component/Template Browser",
            "Searches or browses popular components/templates",
            "Selects component; it appears on canvas in default state",
            "Configures columns, filters, indicators, and optional rename",
            "Saves the widget and workspace",
          ],
        },
        {
          journey: "Building a Multi-Page Workspace",
          steps: [
            "Clicks +New Page → creates Page 2 inside same workspace",
            "Adds different widgets (e.g., Asia markets) or templates",
            "Options to copy, rename, rearrange, delete, share, customize the page",
            "Saves page and workspace",
            "Exit State: One workspace, multiple task-specific pages",
          ],
        },
        {
          journey: "Returning User Daily Flow",
          steps: [
            "Logs in → last-used workspace auto-opens (or default)",
            "Scans monitors, switches page/workspace",
            "Makes minor edits",
            "Auto-save or manual save persists state",
          ],
        },
        {
          journey: "Power User — Pre-market Open",
          steps: [
            "Opens pre-market workspace template (heatmap, price monitor, watchlist)",
            "Configures filters for Asia/EM/US open",
            "Sets alert thresholds for earnings or large moves",
            "Pins relevant charts and quick-exec links for live trading",
            "Shares snapshot with desk or downstream execution team",
          ],
        },
        {
          journey: "Research-to-Execution",
          steps: [
            "Researcher builds workspace with valuation & news widgets",
            "Publishes workspace as a template or shares with trader",
            "Trader imports workspace, attaches execution blocks, and routes orders",
            "Trade executed; P&L widget reflects result and persists as a template",
          ],
        },
        {
          journey: "Collaborative Review",
          steps: [
            "Analyst assembles a story workspace for earnings day",
            "Shares workspace link with team for synchronous review",
            "Comments and annotations are added to widgets",
            "Final workspace is saved as a shared template for future events",
          ],
        },
        {
          journey: "Admin / Enterprise Onboarding",
          steps: [
            "Admin provisions seats & default templates via settings",
            "Rolls out organisation templates and governance policies",
            "Monitors adoption metrics and distributes training materials",
          ],
        },
      ],
      stateHandling: {
        workspaceStates: [
          "Empty (no widgets)",
          "Draft (unsaved changes) → Discard or Save options",
          "Saved → persists to backend",
          "Selected / Unselected",
        ],
        pageStates: [
          "Empty → Save to commit",
          "Draft (unsaved changes) → Delete or Save",
          "Saved with widget states",
        ],
        widgetStates: [
          "Unconfigured → Configured → Linked (V2)",
          "Deleted state",
          "Position & Size layout tracking",
          "Parameter selection persistence",
        ],
        saveRules: [
          "Draft state persists locally",
          "Explicit save commits to backend",
          "Deleting active workspace → redirect to next/default",
          "Version handling of workspace changes",
        ],
      },
      infoArchitecture: [
        {
          toolbar: "Toolbar 1: Workspace Switching & Creation",
          elements: [
            "Search Bar → add widgets & templates to active page",
            "Workspace Tabs → click to switch workspaces instantly",
            "Create New (rightmost) → create additional workspaces",
            "Workspace tabs draggable to reorder",
          ],
        },
        {
          toolbar: "Toolbar 2: Workspace Actions & Controls",
          elements: [
            "Workspace Name (clickable to rename)",
            "Global Settings Indicator (shows active grouping if template-based)",
            "Save a Copy (duplicate workspace)",
            "Share (share with users)",
            "Customise / Save (toggle Edit Mode)",
          ],
          editModeCapabilities: [
            "Widgets can be resized, rearranged, removed",
            "Workspace & Pages can be renamed & deleted",
            "All destructive actions gated behind Edit Mode",
            "Save button exits Edit Mode & persists configuration",
          ],
        },
        {
          toolbar: "Toolbar 3: Pages (Tabs Within Workspace)",
          elements: [
            "Page Tabs (all pages visible side-by-side)",
            "Create Page button (add new page with sequential naming: Page 2, Page 3)",
            "Right-click page tab for rename/delete options",
            "Draggable tabs to reorder pages",
          ],
        },
        {
          canvas: "Canvas Area (Widget Surface)",
          behavior: [
            "Located below Toolbar 3",
            "Displays all widgets for selected page",
            "In Edit Mode: widgets draggable, droppable, resizable, removable",
            "Widgets do not overlap; automatic grid placement",
            "If full or min-size constraint violated: user informed widget cannot be added",
          ],
        },
      ],
      successMetrics: {
        adoptionActivation: [
          {
            metric: "Workspace Creation Rate",
            definition: "% of active users who create ≥1 workspace within 7 days",
            why: "Indicates initial value discovery",
            target: "8–12% within 30 days",
          },
          {
            metric: "Activation Rate",
            definition: "% of users who create a workspace, add ≥3 widgets, and save it",
            why: "Confirms meaningful usage, not just exploration",
            target: "5–9%",
          },
          {
            metric: "Template Usage Rate",
            definition: "% of users using a template vs blank canvas",
            why: "Validates usefulness of pre-built templates",
            target: "~40% of creators",
          },
        ],
        engagementHabitFormation: [
          {
            metric: "Workspace DAU Ratio",
            definition: "Workspace DAU ÷ Total DAU",
            why: "Indicates daily stickiness",
            target: "20–30% for heavy workflows",
          },
          {
            metric: "Default Workspace Launch Rate",
            definition: "% of sessions where Workspace opens by default",
            why: "Signals habit formation",
            target: "≥35% for power users",
          },
          {
            metric: "Day-over-Day Retention",
            definition: "D1, D2, D3 … D30 retention for Workspace users",
            why: "Validates long-term stickiness",
            target: "D7 ≥ 22%, D30 ≥ 12%",
          },
          {
            metric: "Avg. Widgets per Workspace",
            definition: "Average number of widgets added per workspace",
            why: "Indicates richness of user setup",
            target: "3–6 widgets",
          },
          {
            metric: "Page Switching Rate",
            definition: "% of users switching pages within a session",
            why: "Validates page-level value and multi-context usage",
            target: "≥18%",
          },
        ],
        monetizationMetrics: [
          {
            metric: "Paid Workspace Conversion",
            definition: "% of organisations converting to paid workspace seats or premium templates",
            why: "Direct revenue signal for enterprise productisation",
            target: "0.5–1% (seed) → 2% in 12 months",
          },
          {
            metric: "ARPA (Workspace Customers)",
            definition: "Average revenue per account for workspace-paying customers",
            why: "Revenue health for the workspace product",
            target: "$300–800 / month (initial benchmark)",
          },
        ],
        growthMetrics: [
          {
            metric: "MAU Growth (Workspace Users)",
            definition: "Monthly active users who use the Workspace feature",
            why: "Usage baseline for product prioritisation",
            target: ">+40% YoY for the workspace cohort",
          },
        ],
      },
      metrics: [
        {
          category: "Adoption & Activation",
          items: [
            "Workspace Creation Rate: target 8–12% within 30 days (aim 10%)",
            "Activation (≥3 widgets saved): target 5–9% (aim 7%)",
            "Template Adoption: ~40% of creators (aim 45% with highlights)",
          ],
        },
        {
          category: "Engagement",
          items: [
            "Workspace DAU Ratio: 20–30%",
            "Avg Widgets per Workspace: 3–6 (aim 4.5)",
            "Page Switching Rate: ≥18%",
          ],
        },
        {
          category: "Monetization",
          items: [
            "Paid Workspace Conversion: seed 0.5–1% → 2% in 12 months",
            "ARPA (Workspace Customers): $300–800 / month",
          ],
        },
      ],
      operationalMetrics: [
        {
          name: "UI & Data SLAs",
          items: [
            "Widget initial render latency: <300ms target",
            "Widget data refresh: <5s for streaming feeds, <30s for batched sources",
            "API availability SLO: 99.9%",
            "Error rate (5xx): <0.1%",
          ],
        },
        {
          name: "Data Freshness",
          items: [
            "Market ticks supported: 10k+ events/s",
            "Max data lag tolerated: <500ms for market-critical widgets",
          ],
        },
      ],
      experimentation: {
        objectives: [
          "Increase Workspace Creation Rate",
          "Improve Activation (≥3 widgets saved)",
          "Improve Template Adoption",
        ],
        experiments: [
          {
            name: "Onboarding CTA Test",
            hypothesis: "Defaulting to a sample template increases creation rate by 10%",
            metric: "Workspace Creation Rate",
            duration: "4 weeks",
          },
          {
            name: "Template Highlighting",
            hypothesis: "Highlighting best-value templates increases template adoption by 15%",
            metric: "Template Adoption",
            duration: "6 weeks",
          },
        ],
      },
      tags: [
        "0→1 Product",
        "PRD",
        "Figma Prototype",
        "Fintech",
        "Widget System",
        "Bloomberg",
        "Market Research",
        "Information Architecture",
        "B2B",
      ],
      prdLink:
        "https://docs.google.com/document/d/1MZGAA0LmIOjF_hVQIMYgjWKM06vQP8Aq66b8-xf2xFQ/edit?tab=t.0",
      prototypeLink: "https://coin-move-54711900.figma.site",
    },
  },
  {
    id: 4,
    theme: "teal",
    vol: "VOL.04",
    volJp: "",
    co: "GLP Health",
    title: "GLP-1 DIGITAL SCAFFOLD",
    desc: "Repositioning a GLP app from activity tracker to outcome-driven metabolic platform for durable weight loss",
    impact: "+2.5 kg lost by protocol followers",
    tags: ["engagement", "personalization", "monetization"],
    kpis: [
      { v: "64%", l: "Users currently losing >1 kg — baseline to improve" },
      { v: "2.5kg", l: "Additional loss for protocol followers vs non-followers" },
      { v: "25%", l: "Fitness MAU — structural engagement gap to close" },
    ],
    content: {
      opportunity:
        "<strong>The Opportunity:</strong> GLP-1 medications have redefined what is clinically possible in weight loss — but real-world outcomes remain fragile. The gap is no longer pharmacology; it is <strong>behavioral persistence, expectation management, and metabolic protection</strong>. Today's GLP app is optimised for recording activity, not driving outcomes. Users can log weight, meals, fitness, and side effects — but the product does not help them interpret stalled progress, understand body recomposition, protect muscle mass, or stay adherent through plateaus and side effects. The next phase requires a strategic shift from tracking behaviour to <strong>owning outcomes</strong>.",
      userChallenges: {
        invisibleProgress:
          "<strong>Progress Feels Invisible:</strong> Users anchor success entirely to scale weight. Data shows users who lose ≥1 kg show –2 cm waist reduction, while non-losers show +1 cm gain. Waist and body composition changes are real signals of progress — but they're invisible in the current product. Without visible progress signals beyond the scale, motivation collapses during natural weight plateaus.",
        expectationMismatch:
          "<strong>Expectation Mismatch With GLP-1:</strong> Users believe 'medication will do the work — I can eat freely.' The clinical reality: GLP-1 reduces appetite, not muscle loss risk. Without guided exercise, lean mass declines, RMR falls, and weight regain risk increases. The app does not currently reset these expectations early enough in the user journey.",
        fitnessAvoidance:
          "<strong>Fitness Avoidance Is a Structural Risk:</strong> Fitness MAU is ~25%, with most users completing only one session. Clinically, this creates sarcopenic obesity risk and unsustainable weight loss. Fitness is treated as optional when it is medically essential for metabolic protection.",
        genderOutcomeGap:
          "<strong>Gender-Based Outcome Gap:</strong> Men average 1.66 kg loss vs women at 1.26 kg. Testosterone supports muscle preservation; women require more intentional resistance training. A gender-blind fitness experience fails the majority of the user base. Fitness cannot be optional — especially for female users.",
      },
      whyNow:
        "<strong>Why Now:</strong> Between 2022–2024, the GLP-1 market optimised for access — rapid prescriber onboarding, consumer-led demand, medication-first value propositions. By 2025–2026, structural shifts are forcing a reset: medication prices are falling, prescription access is commoditising, and GLP-only platforms are losing defensibility. <strong>Differentiation has moved downstream</strong> — from getting users on medication to ensuring outcomes persist. The next category leader will sell metabolic integrity, not just weight loss. Platforms that remain logging-centric will struggle. Platforms that own outcomes, expectations, and persistence will define the category.",
      competitiveGap: {
        overview:
          "<strong>What Winning Products Do Differently:</strong> Across Noom, Omada, Found, and HealthifyMe, a consistent pattern emerges: medication enables weight loss, but engagement architecture determines durability. High-performing weight-loss platforms converge on three principles that the current product does not deliver.",
        benchmark: {
          outcomeVisibility: { principle: "Outcome visibility beats activity logging", finding: "Users need interpretation, not raw data. Progress signals must go beyond scale weight." },
          humanDigital: { principle: "Human + digital hybrids outperform pure automation", finding: "Coaching access materially improves adherence and persistence. Current ~80% M2 chat usage is an underutilised asset." },
          musclePreservation: { principle: "Muscle preservation is the new moat", finding: "Fast weight loss without muscle protection leads to metabolic slowdown and rebound. No competitor owns this positioning yet." },
        },
        insight:
          "The current product has strong foundational tracking primitives and high coach engagement. The gap is in connecting these assets to a unified outcome narrative — making protocol adherence visible, actionable, and clinically reinforced.",
      },
      rootCauseAnalysis: [
        {
          cause: "Biological Friction",
          evidence: "Nausea, GI distress, and fatigue in early weeks create unmanaged dropout signals. No structured side-effect monitoring or rapid escalation path to coaches/doctors.",
          impact: "Early dropout — 50–70% discontinuation within 12 months, with highest drop in first 90 days.",
        },
        {
          cause: "Psychological Friction",
          evidence: "Food identity shifts, stigma, and confusion about what medication 'should' be doing. App does not reset GLP-1 expectations or reframe progress beyond weight.",
          impact: "Loss of confidence — users interpret lack of scale movement as product/medication failure rather than normal recomposition.",
        },
        {
          cause: "Metric Friction",
          evidence: "Scale plateaus despite active fat loss and waist reduction. Body composition and non-scale victories are invisible. Progress is perceived as binary: weight down = success, else failure.",
          impact: "Motivation collapse — users disengage from the app and discontinue medication during natural progress plateaus.",
        },
        {
          cause: "No Protocol Visibility",
          evidence: "Protocol followers lose ~2.5 kg more. Weight-loss cohort logs 2× more meals and connects ~30% more with doctors. But adherence is implicit — not surfaced or reinforced in the product.",
          impact: "Missed activation — users who would benefit most from protocol guidance receive no signal that their behaviours are causal.",
        },
      ],
      keyFeatures: [
        {
          title: "Pillar 1: Progress Visibility Beyond the Scale",
          desc: "Smart scale integration (where available), waist and measurement trends surfaced prominently, full-body scan to visualise recomposition, and explicit plateau education. Progress is no longer binary.",
        },
        {
          title: "Pillar 2: Muscle Preservation & Fitness as Core Outcome",
          desc: "Resistance-first fitness programs, proactive 1:1 fitness consultations, clear framing of fitness = metabolic protection, and gender-aware guidance. Fitness becomes essential, not optional.",
        },
        {
          title: "Pillar 3: Clinical Adherence & Side-Effect Triage",
          desc: "Structured side-effect monitoring, rapid escalation to coach/doctor, dosage expectation education, and early-week intervention loops. Side-effect resolution builds trust and reduces dropout.",
        },
        {
          title: "Pillar 4: Protocol-Driven Experience",
          desc: "Clear weekly protocol with visible adherence signals and outcome-based milestones (not task completion). Transforms the app from a passive logger to an active guide.",
        },
      ],
      strategicInitiatives: [
        {
          title: "Primary Engagement Loop",
          timing: "Core",
          approach: "Progress clarity → confidence → adherence → outcomes. Every product surface reinforces that visible signals (waist, composition, energy) compound into durable metabolic change.",
        },
        {
          title: "Human Accountability Loop",
          timing: "Retention",
          approach: "Leverage the existing ~80% M2 coach chat usage as a structured check-in cadence, not reactive support. Proactive coach touchpoints at risk moments (plateau weeks, side-effect spikes).",
        },
        {
          title: "Visual Reinforcement Loop",
          timing: "Engagement",
          approach: "Body scans, composition change visualisations, and waist trend charts shown contextually — not just in a data tab. Progress is surfaced where users are already looking.",
        },
        {
          title: "Safety Loop",
          timing: "Trust",
          approach: "Side-effect resolution workflows that proactively surface guidance and escalation options. Trust is built through managed adversity, not avoided friction.",
        },
      ],
      metrics: [
        {
          category: "Outcome Improvement",
          items: [
            "Users losing >1 kg: 64% baseline → 75% target",
            "Average weight loss vs protocol followers gap: close from 2.5 kg to <1 kg",
            "Non-scale victory visibility: waist tracking adoption >50%",
          ],
        },
        {
          category: "Fitness & Muscle Protection",
          items: [
            "Fitness MAU: ~25% baseline → 45% target",
            "Users completing ≥3 resistance sessions/week: <5% baseline → 20% target",
            "Female fitness engagement parity within 6 months",
          ],
        },
        {
          category: "Adherence & Retention",
          items: [
            "12-month retention: 30–50% baseline → 55% target",
            "First-90-day dropout: reduce by 30%",
            "Coach escalation within 48hr of side-effect log: >80%",
          ],
        },
      ],
      tags: [
        "GLP-1",
        "Metabolic Health",
        "Digital Health",
        "Engagement Architecture",
        "Muscle Preservation",
        "Retention",
        "Behavioral Design",
        "Clinical Adherence",
        "Market Strategy",
      ],
    },
  },
  {
    id: 6,
    theme: "orange",
    vol: "VOL.06",
    volJp: "",
    co: "Arcana \u00b7 Fintech",
    title: "ARCANA WORKSPACE",
    desc: "Bloomberg-style modular workspace PRD for institutional investors — widgets, pages, templates & real-time monitoring",
    impact: "PRD shipped",
    tags: ["feature", "prototype"],
    kpis: [
      { v: "7", l: "Widget types prioritised" },
      { v: "4", l: "User journeys designed" },
      { v: "V1", l: "Full PRD & live prototype" },
    ],
    prdLink: "https://docs.google.com/document/d/1MZGAA0LmIOjF_hVQIMYgjWKM06vQP8Aq66b8-xf2xFQ/edit?tab=t.0#heading=h.su9f7jlfuspx",
    prototypeUrl: "https://workspace-nu-liard.vercel.app/",
    content: {
      problem: "", approach: "", solution: [] as string[],
      impact: { text: "", items: [] as { v: string; l: string; c: string }[] },
      tags: ["PRD","Figma","Bloomberg Launchpad","Fintech","Workspace Design","Widget System","State Management","Success Metrics"],
      customSections: [
        { num: "01", title: "Problem Statement", body: "Institutional investors, analysts & researchers operate in a <strong>high frequency, high cognitive load environment</strong>. Their daily workflow involves simultaneously monitoring live prices, charts, news, alerts, and global market context while switching context across multiple asset classes.", items: ["<strong>Fragmented Information</strong> \u2014 Prices, charts, news, alerts, and market hours live in separate views. Users must mentally stitch insights together by exploring each view independently.","<strong>High Context Switching Cost</strong> \u2014 Switching between workflows (e.g., market open vs research) requires re-navigation. Analysts lose time reconstructing views multiple times a day.","<strong>One-Size-Fits-All Interfaces</strong> \u2014 Different users track different assets, regions, and time horizons. A single default layout fails all of them.","<strong>Poor State Persistence</strong> \u2014 Users expect their layouts, filters, and configurations to persist across sessions. Without this, they rework the same setup every time they log in."] },
        { num: "02", title: "Why This Is Worth Solving", body: null, items: ["A modular workspace increases <strong>product stickiness</strong>. Custom dashboards directly correlate with higher retention and daily engagement by becoming the user\u2019s <strong>first preference</strong> for daily monitoring.","There is <strong>already a market precedent</strong> set by <strong>Bloomberg Launchpad</strong> \u2014 one of the most heavily used terminal features \u2014 because it solves this exact problem through customizable, persistent widgets & workspaces."] },
        { num: "03", title: "Product Vision", body: "Build <strong>Arcana Workspace</strong> \u2014 a modular, <strong>Bloomberg-style Launchpad</strong> that allows users to create, save, and switch between personalised workspaces composed of configurable widgets \u2014 optimised for real-time monitoring, clarity, and execution with speed, leading to repeat daily usage.", items: null },
        { num: "04", title: "Goals for V1", body: null, items: ["Enable users to build custom workspaces using modular widgets from scratch or premade templates","Templates are workspace formats with widgets designed for unique use cases (NEWS, Portfolio, Research) \u2014 with optional Global Settings that are must-haves (e.g., Portfolio template requires selecting an index/equity to power widgets)","Support adding, resizing, configuring, and saving widget layouts","Allow multiple tabs/pages per workspace","Ability to edit / copy / add / save / share workspace & pages, with fast switching between them","Preserve widget-level intelligence (e.g., Nvidia selected in index & performance widget persists)","<strong>V1 = Signal intake + context + workflow persistence.</strong> V2 = Outcome measurement (performance, deep analytics, risk, attribution, order execution integration)"] },
        { num: "05", title: "Market Research", body: "A Bloomberg Launchpad user typically combines price monitors + charts + news feeds to correlate headlines with price reactions, uses alerts to catch significant moves without continuous hovering, and saves workflows by theme (commodity tracking, earnings day, global markets). This mirrors how users segment their day:", items: ["<strong>Morning pre-open scan</strong> \u2014 Macro indices, overnight movers, news catch-up","<strong>Live session monitoring</strong> \u2014 Real-time price action, alerts firing, chart patterns","<strong>Post-close analysis</strong> \u2014 P&L review, sector performance, next-day prep"] },
        { num: "06", title: "Prioritised Widgets", body: "These cover the <strong>core workflows of watching prices & signals</strong> \u2014 the top job of users. We are launching the monitoring layer, not the outcome layer.", items: null, widgets: [{ name: "Equity Price Monitor", rationale: "Most basic, most used \u2014 priority 1 for every workflow" },{ name: "Index Tracker", rationale: "Global indices (S&P, Nifty) \u2014 macro sentiment gauge widely used by analysts" },{ name: "Commodity Prices", rationale: "Critical for cross-asset views (similar to Bloomberg\u2019s commodities widget)" },{ name: "Real-Time Chart", rationale: "Visual confirmation of trends & patterns \u2014 core to all workflows" },{ name: "Live News Feed", rationale: "Provides context to price movements \u2014 heavily used across all personas" },{ name: "Price Alerts", rationale: "Simple price threshold alerts \u2014 helps catch key events without always watching" },{ name: "Timezone / Market Hours", rationale: "Supports a global view across regions and trading sessions" }] },
        { num: "07", title: "Core Capabilities", body: null, items: null, subsections: [{ title: "Workspace", items: ["Grid-based canvas (like Metabase dashboard layout) \u2014 chosen over free-form positioning to optimise for scale, stability, and cognitive clarity in high-load environments","Preset templates for core use cases (Portfolio Analysis, Single Stock Analysis, etc.) with pre-specified widgets and optional Global Settings","Workspaces can be copied, renamed, shared, rearranged, customised and managed from settings","Added workspaces appear side-by-side and switch instantly on click"] },{ title: "Widgets", items: ["Modular, atomic blocks of the workspace with multiple responsive UI sizes (like Apple widgets \u2014 different UI for different grid sizes)","Can be configured (columns/filters/indicators/flags), added, resized, repositioned, renamed, or removed","Widgets retain their full capabilities inside the workspace (e.g., Summary widget retains % AUM & % Gross selections)","Users can add any widget from the terminal directly to a workspace page; widget lands in the next vacant grid area","Widgets cannot overlap. Option to export widget data in relevant Excel format"] },{ title: "Pages", items: ["Each workspace supports multiple pages representing sub-contexts (e.g., Price, Valuation within a Portfolio template)","Pages visible side-by-side with add, delete, reorder, rename, copy, share capabilities","Pages can be managed from settings or via right-click context menu"] },{ title: "Group Components (V1 \u2192 V2)", items: ["V1: Global Settings for presets \u2014 groupings are done during template creation (e.g., selecting a stock links all widgets)","V2: Fully-fledged Group Manager where users can map components to each other, change a security in one component and all grouped components update"] }] },
        { num: "08", title: "User Journeys", body: null, items: null, journeys: [{ name: "First-Time User Experience", entry: "No existing workspaces", steps: ["User opens Arcana Workspace, clicks Create New \u2192 3 options: optimised view for screen, sample view from manager, or blank canvas","On blank canvas: Launchpad toolbar appears with Page 1 and no widgets. Search bar available to add components or select templates","User adds first component or selects template, configures parameters/global settings, adjusts position & size","User saves the view and workspace"], exit: "Saved workspace with at least one page and widget" },{ name: "Adding & Configuring a Widget", entry: "Active workspace with at least one page", steps: ["User clicks search \u2192 Component/Template Browser opens with categories and previews","Selects component \u2192 appears on canvas in default state","User configures columns/filters/indicators/flags, optionally renames widget","A widget can\u2019t exist in the same state twice on a particular page"], exit: "Configured widget on active page" },{ name: "Building a Multi-Page Workspace", entry: "Workspace with at least one saved page", steps: ["User clicks +New Page, creates Page 2 inside the same workspace","Adds different widgets (e.g., Asia markets) or templates from search","Right-click options: copy, rename, rearrange, delete, share, customise","Pages appear side-by-side, switch instantly on click"], exit: "One workspace, multiple task-specific pages" },{ name: "Returning User Daily Flow", entry: "Existing saved workspaces", steps: ["User logs in \u2192 last-used workspace auto-opens (if no default set)","Scans monitors, switches pages/workspaces as needed","Makes minor edits \u2192 auto-save or manual save persists state"], exit: "Updated workspace state persisted for next session" }] },
        { num: "09", title: "Success Metrics", body: null, items: null, metricGroups: [{ name: "Adoption & Activation", subtitle: "Is Workspace Valuable?", metrics: [{ metric: "Workspace Creation Rate", definition: "% of active users who create \u22651 workspace within 7 days", why: "Indicates initial value discovery" },{ metric: "Activation Rate", definition: "% of users who create a workspace, add \u22653 widgets & save it", why: "Confirms meaningful usage, not just exploration" },{ metric: "Template Usage Rate", definition: "% of users using a template vs blank canvas", why: "Validates usefulness of templates" },{ metric: "Creation Drop-off Rate", definition: "% of users who abandon creation flow before saving", why: "Identifies friction in workspace creation" }] },{ name: "Engagement & Habit Formation", subtitle: "Is It Becoming a Daily Tool?", metrics: [{ metric: "Workspace DAU Ratio", definition: "Workspace DAU \u00f7 Total DAU", why: "Indicates daily stickiness" },{ metric: "Default Launch Rate", definition: "% of sessions where Workspace opens by default", why: "Signals habit formation" },{ metric: "Repeat Usage Rate", definition: "Avg workspace sessions per user per day \u00f7 total sessions", why: "Measures frequency of use" },{ metric: "D1\u2013D30 Retention", definition: "Day-over-day retention for Workspace users", why: "Validates long-term platform stickiness" },{ metric: "Avg Widgets per Workspace", definition: "Average widgets added per workspace", why: "Indicates richness of setup" },{ metric: "Page Switching Rate", definition: "% of users switching pages within a session", why: "Validates page-level value" }] }] },
      ],
    },
  },
  //  {
  //   id: 3,
  //   theme: "blue",
  //   vol: "VOL.03",
  //   volJp: "",
  //   co: "Arcana · Workspace",
  //   title: "ARCANA WORKSPACE",
  //   desc: "Bloomberg-styled modular launchpad for institutional investors — grid-based workspaces with configurable widgets for real-time market monitoring",
  //   impact: "0→1 shipped",
  //   tags: ["0→1", "b2b", "prototype", "workflows", "fintech"],
  //   kpis: [
  //     { v: "7", l: "Priority widgets designed" },
  //     { v: "V1", l: "Full PRD → prototype shipped" },
  //     { v: "∞", l: "Workspace configurations possible" },
  //   ],
  //   prdLink: "https://docs.google.com/document/d/1MZGAA0LmIOjF_hVQIMYgjWKM06vQP8Aq66b8-xf2xFQ/edit?tab=t.0#heading=h.su9f7jlfuspx",
  //   prototypeUrl: "https://workspace-nu-liard.vercel.app/",
  //   content: {
  //     problem: "", approach: "", solution: [] as string[],
  //     impact: { text: "", items: [] as { v: string; l: string; c: string }[] },
  //     tags: ["PRD","Figma","Bloomberg Launchpad","Fintech","Workspace Design","Widget System","State Management","Success Metrics"],
  //   },
  //   customSections: [
  //     { num: "01", title: "Problem Statement", body: "Institutional investors, analysts & researchers operate in a <strong>high frequency, high cognitive load environment</strong>. Their daily workflow involves simultaneously monitoring live prices, charts, news, alerts, and global market context while switching context across multiple asset classes.", items: ["<strong>Fragmented Information</strong> \u2014 Prices, charts, news, alerts, and market hours live in separate views. Users must mentally stitch insights together by exploring each view independently.","<strong>High Context Switching Cost</strong> \u2014 Switching between workflows (e.g., market open vs research) requires re-navigation. Analysts lose time reconstructing views multiple times a day.","<strong>One-Size-Fits-All Interfaces</strong> \u2014 Different users track different assets, regions, and time horizons. A single default layout fails all of them.","<strong>Poor State Persistence</strong> \u2014 Users expect their layouts, filters, and configurations to persist across sessions. Without this, they rework the same setup every time they log in."] },
  //     { num: "02", title: "Why This Is Worth Solving", body: null, items: ["A modular workspace increases <strong>product stickiness</strong>. Custom dashboards directly correlate with higher retention and daily engagement by becoming the user\u2019s <strong>first preference</strong> for daily monitoring.","There is <strong>already a market precedent</strong> set by <strong>Bloomberg Launchpad</strong> \u2014 one of the most heavily used terminal features \u2014 because it solves this exact problem through customizable, persistent widgets & workspaces."] },
  //     { num: "03", title: "Product Vision", body: "Build <strong>Arcana Workspace</strong> \u2014 a modular, <strong>Bloomberg-style Launchpad</strong> that allows users to create, save, and switch between personalised workspaces composed of configurable widgets \u2014 optimised for real-time monitoring, clarity, and execution with speed, leading to repeat daily usage.", items: null },
  //     { num: "04", title: "Goals for V1", body: null, items: ["Enable users to build custom workspaces using modular widgets from scratch or premade templates","Templates are workspace formats with widgets designed for unique use cases (NEWS, Portfolio, Research) \u2014 with optional Global Settings that are must-haves (e.g., Portfolio template requires selecting an index/equity to power widgets)","Support adding, resizing, configuring, and saving widget layouts","Allow multiple tabs/pages per workspace","Ability to edit / copy / add / save / share workspace & pages, with fast switching between them","Preserve widget-level intelligence (e.g., Nvidia selected in index & performance widget persists)","<strong>V1 = Signal intake + context + workflow persistence.</strong> V2 = Outcome measurement (performance, deep analytics, risk, attribution, order execution integration)"] },
  //     { num: "05", title: "Market Research", body: "A Bloomberg Launchpad user typically combines price monitors + charts + news feeds to correlate headlines with price reactions, uses alerts to catch significant moves without continuous hovering, and saves workflows by theme (commodity tracking, earnings day, global markets). This mirrors how users segment their day:", items: ["<strong>Morning pre-open scan</strong> \u2014 Macro indices, overnight movers, news catch-up","<strong>Live session monitoring</strong> \u2014 Real-time price action, alerts firing, chart patterns","<strong>Post-close analysis</strong> \u2014 P&L review, sector performance, next-day prep"] },
  //     { num: "06", title: "Prioritised Widgets", body: "These cover the <strong>core workflows of watching prices & signals</strong> \u2014 the top job of users. We are launching the monitoring layer, not the outcome layer.", items: null, widgets: [{ name: "Equity Price Monitor", rationale: "Most basic, most used \u2014 priority 1 for every workflow" },{ name: "Index Tracker", rationale: "Global indices (S&P, Nifty) \u2014 macro sentiment gauge widely used by analysts" },{ name: "Commodity Prices", rationale: "Critical for cross-asset views (similar to Bloomberg\u2019s commodities widget)" },{ name: "Real-Time Chart", rationale: "Visual confirmation of trends & patterns \u2014 core to all workflows" },{ name: "Live News Feed", rationale: "Provides context to price movements \u2014 heavily used across all personas" },{ name: "Price Alerts", rationale: "Simple price threshold alerts \u2014 helps catch key events without always watching" },{ name: "Timezone / Market Hours", rationale: "Supports a global view across regions and trading sessions" }] },
  //     { num: "07", title: "Core Capabilities", body: null, items: null, subsections: [{ title: "Workspace", items: ["Grid-based canvas (like Metabase dashboard layout) \u2014 chosen over free-form positioning to optimise for scale, stability, and cognitive clarity in high-load environments","Preset templates for core use cases (Portfolio Analysis, Single Stock Analysis, etc.) with pre-specified widgets and optional Global Settings","Workspaces can be copied, renamed, shared, rearranged, customised and managed from settings","Added workspaces appear side-by-side and switch instantly on click"] },{ title: "Widgets", items: ["Modular, atomic blocks of the workspace with multiple responsive UI sizes (like Apple widgets \u2014 different UI for different grid sizes)","Can be configured (columns/filters/indicators/flags), added, resized, repositioned, renamed, or removed","Widgets retain their full capabilities inside the workspace (e.g., Summary widget retains % AUM & % Gross selections)","Users can add any widget from the terminal directly to a workspace page; widget lands in the next vacant grid area","Widgets cannot overlap. Option to export widget data in relevant Excel format"] },{ title: "Pages", items: ["Each workspace supports multiple pages representing sub-contexts (e.g., Price, Valuation within a Portfolio template)","Pages visible side-by-side with add, delete, reorder, rename, copy, share capabilities","Pages can be managed from settings or via right-click context menu"] },{ title: "Group Components (V1 \u2192 V2)", items: ["V1: Global Settings for presets \u2014 groupings are done during template creation (e.g., selecting a stock links all widgets)","V2: Fully-fledged Group Manager where users can map components to each other, change a security in one component and all grouped components update"] }] },
  //     { num: "08", title: "User Journeys", body: null, items: null, journeys: [{ name: "First-Time User Experience", entry: "No existing workspaces", steps: ["User opens Arcana Workspace, clicks Create New \u2192 3 options: optimised view for screen, sample view from manager, or blank canvas","On blank canvas: Launchpad toolbar appears with Page 1 and no widgets. Search bar available to add components or select templates","User adds first component or selects template, configures parameters/global settings, adjusts position & size","User saves the view and workspace"], exit: "Saved workspace with at least one page and widget" },{ name: "Adding & Configuring a Widget", entry: "Active workspace with at least one page", steps: ["User clicks search \u2192 Component/Template Browser opens with categories and previews","Selects component \u2192 appears on canvas in default state","User configures columns/filters/indicators/flags, optionally renames widget","A widget can\u2019t exist in the same state twice on a particular page"], exit: "Configured widget on active page" },{ name: "Building a Multi-Page Workspace", entry: "Workspace with at least one saved page", steps: ["User clicks +New Page, creates Page 2 inside the same workspace","Adds different widgets (e.g., Asia markets) or templates from search","Right-click options: copy, rename, rearrange, delete, share, customise","Pages appear side-by-side, switch instantly on click"], exit: "One workspace, multiple task-specific pages" },{ name: "Returning User Daily Flow", entry: "Existing saved workspaces", steps: ["User logs in \u2192 last-used workspace auto-opens (if no default set)","Scans monitors, switches pages/workspaces as needed","Makes minor edits \u2192 auto-save or manual save persists state"], exit: "Updated workspace state persisted for next session" }] },
  //     { num: "09", title: "Success Metrics", body: null, items: null, metricGroups: [{ name: "Adoption & Activation", subtitle: "Is Workspace Valuable?", metrics: [{ metric: "Workspace Creation Rate", definition: "% of active users who create \u22651 workspace within 7 days", why: "Indicates initial value discovery" },{ metric: "Activation Rate", definition: "% of users who create a workspace, add \u22653 widgets & save it", why: "Confirms meaningful usage, not just exploration" },{ metric: "Template Usage Rate", definition: "% of users using a template vs blank canvas", why: "Validates usefulness of templates" },{ metric: "Creation Drop-off Rate", definition: "% of users who abandon creation flow before saving", why: "Identifies friction in workspace creation" }] },{ name: "Engagement & Habit Formation", subtitle: "Is It Becoming a Daily Tool?", metrics: [{ metric: "Workspace DAU Ratio", definition: "Workspace DAU \u00f7 Total DAU", why: "Indicates daily stickiness" },{ metric: "Default Launch Rate", definition: "% of sessions where Workspace opens by default", why: "Signals habit formation" },{ metric: "Repeat Usage Rate", definition: "Avg workspace sessions per user per day \u00f7 total sessions", why: "Measures frequency of use" },{ metric: "D1\u2013D30 Retention", definition: "Day-over-day retention for Workspace users", why: "Validates long-term platform stickiness" },{ metric: "Avg Widgets per Workspace", definition: "Average widgets added per workspace", why: "Indicates richness of setup" },{ metric: "Page Switching Rate", definition: "% of users switching pages within a session", why: "Validates page-level value" }] }] },
  //   ],
  // },
  
];



function accentColor(t: string) {
  const m: Record<string, string> = {
    red: "#E8273A",
    cyan: "#00D4FF",
    gold: "#F0C040",
    purple: "#C084FC",
    teal: "#2DD4BF",
    blue: "#3B82F6",
    orange: "#F97316",
  };
  return m[t] || "#E8273A";
}

function speedSVG(c: string) {
  return `<svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice"><g stroke="${c}" stroke-width="0.5" fill="none" opacity="0.7"><line x1="200" y1="150" x2="-50" y2="10"/><line x1="200" y1="150" x2="-50" y2="60"/><line x1="200" y1="150" x2="-50" y2="110"/><line x1="200" y1="150" x2="-50" y2="170"/><line x1="200" y1="150" x2="-50" y2="230"/><line x1="200" y1="150" x2="-50" y2="290"/><line x1="200" y1="150" x2="50" y2="-20"/><line x1="200" y1="150" x2="120" y2="-20"/><line x1="200" y1="150" x2="50" y2="320"/><line x1="200" y1="150" x2="120" y2="320"/></g></svg>`;
}

function buildBookHTML(c: (typeof CASES)[0]) {
  const ac = accentColor(c.theme);
  return `<div class="mbook" data-theme="${c.theme}" data-id="${c.id}"><div class="mbook-body"><div class="mbook-spine"><div class="mspine-txt">${c.co}</div></div><div class="mbook-speed">${speedSVG(ac)}</div><div class="mbook-cover-bg"></div><div class="mbook-pattern"></div><div class="mbook-num">${String(c.id).padStart(2, "0")}</div><div class="mbook-overlay"></div><div class="mbook-cover"><div class="mvol"><span>${c.vol}</span><span class="mvol-jp">${c.volJp}</span></div><div class="mbook-bottom"><div class="mbook-co">${c.co}</div><div class="mbook-title">${c.title}</div><div class="mbook-desc">${c.desc}</div><div class="mbook-tags">${(c.tags || []).map(t => '<span class="chip">' + t + '</span>').join('')}</div><div class="mimpact" style="color:${ac};border-color:${ac}">&#9650; ${c.impact}</div></div></div><div class="mbook-hover-panel"><div class="mhp-co" style="color:${ac}">${c.co}</div><div class="mhp-title">${c.title}</div><div class="mhp-desc">${c.desc}</div><div class="mhp-impact" style="color:${ac}"><span class="mhp-impact-val">${c.impact.split(" ")[0]}</span><span class="mhp-impact-lbl">${c.impact.split(" ").slice(1).join(" ")}</span></div><button class="mhp-cta">Read Case Study &#8599;</button></div></div></div>`;
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

  useEffect(() => {
    // Auto-open modal when URL contains ?open=<caseId>
    try {
      const params = new URLSearchParams(window.location.search);
      const open = params.get("open") || params.get("openCase") || params.get("open_case");
      if (open) {
        const id = Number(open);
        if (!Number.isNaN(id)) openModal(id);
      }
    } catch (e) {
      // ignore
    }
  }, [openModal]);

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
  const protoHref =
    modalCase && modalCase.content.prototypeLink
      ? modalCase.content.prototypeLink.startsWith("http")
        ? modalCase.content.prototypeLink
        : `${window.location.origin}${modalCase.content.prototypeLink}`
      : null;

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
            <div className="eyebrow rv">— Projects</div>
            <div className="s-title rv-clip rv-d1">
              DECISIONS, <em>NOT FEATURES</em>
            </div>
            <div className="filter-row rv rv-d2">
              {[
                ["all", "All Volumes"],
                ["monetization", "Monetization"],
                ["workflows", "Workflows"],
                ["personalization", "Personalization"],
                ["prototype", "Prototyping"],
                ["engagement", "Engagement"],
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
                {(modalCase.content.prdLink ||
                  modalCase.content.prototypeLink) && (
                  <div className="modal-links-row">
                    {modalCase.content.prdLink && (
                      <a
                        href={modalCase.content.prdLink}
                        className="modal-link-btn"
                        style={{
                          borderColor: ac,
                          color: ac,
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = modalCase.content.prdLink;
                        }}
                      >
                        &#8599; View PRD
                      </a>
                    )}
                    {protoHref && (
                      <a
                        href={protoHref}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="modal-link-btn"
                        style={{
                          borderColor: ac,
                          color: ac,
                          marginLeft: 8,
                        }}
                      >
                        ⤢ Open Live Prototype
                      </a>
                    )}
                  </div>
                )}
                {modalCase.content.prototypeLink && (
                  <div className="modal-prototype-embed">
                    <div className="proto-label">
                      Prototype Preview
                    </div>
                    <iframe
                      src={protoHref || ""}
                      title="Prototype Preview"
                      className="proto-iframe"
                      allow="fullscreen"
                    />
                  </div>
                )}
                {modalCase.content.problem && (
                  <>
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
                  </>
                )}

                {(modalCase.content.opportunity || modalCase.content.competitiveGap) && (
                  <>
                    <div className="mchapter">
                      <div className="ch-label">
                        <span
                          className="ch-n"
                          style={{ color: ac }}
                        >
                          01
                        </span>
                        <span className="ch-t">Opportunity & Competitive Gap</span>
                      </div>
                      <div className="ch-body">
                        {modalCase.content.opportunity && (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: modalCase.content.opportunity,
                            }}
                          />
                        )}
                        {modalCase.content.competitiveGap && (
                          <div>
                            <div dangerouslySetInnerHTML={{ __html: modalCase.content.competitiveGap.overview }} />
                            <div className="bench-wrap">
                              {Object.entries(modalCase.content.competitiveGap.benchmark).map(
                                ([k, v]: any) => (
                                  <div className="bench-row" key={k}>
                                    <div className="bc-label">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</div>
                                    <div className="bc-vals">
                                      {Object.entries(v).map(([field, value]: any) => (
                                        <span className="bc-val" key={field}>
                                          <span>{field}</span>{value}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                            <div className="ch-body" style={{ marginTop: 12 }}><p>{modalCase.content.competitiveGap.insight}</p></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {modalCase.content.userChallenges && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>02</span>
                          <span className="ch-t">User Challenges</span>
                        </div>
                        <div className="ch-cards">
                          {Object.entries(modalCase.content.userChallenges).map(
                            ([, desc]: any, idx) => (
                              <div className="ch-card" key={idx}>
                                <div className="cc-body" dangerouslySetInnerHTML={{ __html: desc }} />
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {(modalCase.content.whyNow || modalCase.content.rootCauseAnalysis) && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>03</span>
                          <span className="ch-t">Root Cause & Why Now</span>
                        </div>
                        <div className="ch-body">
                          {modalCase.content.whyNow && (
                            <div dangerouslySetInnerHTML={{ __html: modalCase.content.whyNow }} />
                          )}
                          {modalCase.content.rootCauseAnalysis && (
                            <div className="rca-stack">
                              {modalCase.content.rootCauseAnalysis.map((item: any, idx: number) => (
                                <div className="rca-card" key={idx}>
                                  <div className="rca-left">
                                    <div className="rc-cause">{item.cause}</div>
                                    <div className="rc-impact">{item.impact}</div>
                                  </div>
                                  <div className="rca-right">
                                    <div className="rc-ev">{item.evidence}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {modalCase.content.strategicDvisions && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>04</span>
                          <span className="ch-t">Strategy</span>
                        </div>
                        <div className="init-stack">
                          {modalCase.content.strategicDvisions.map((item: any, idx: number) => (
                            <div className="init-card" key={idx}>
                              <div className="ic-body">
                                <div className="ic-title">{item.name}</div>
                                <div className="ic-approach">{item.detail}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalCase.content.strategicInitiatives && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>04</span>
                          <span className="ch-t">Strategic Initiatives</span>
                        </div>
                        <div className="init-stack">
                          {modalCase.content.strategicInitiatives.map((item: any, idx: number) => (
                            <div className="init-card" key={idx}>
                              {item.timing && <div className="ic-tag">{item.timing}</div>}
                              <div className="ic-body">
                                <div className="ic-title">{item.title}</div>
                                <div className="ic-approach">{item.approach}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalCase.content.keyFeatures && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>05</span>
                          <span className="ch-t">Key Features</span>
                        </div>
                        <div className="feat-grid">
                          {modalCase.content.keyFeatures.map((item: any, idx: number) => (
                            <div className="feat-card" key={idx}>
                              <div className="fc-title">{item.title}</div>
                              <div className="fc-desc">{item.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalCase.content.roadmap && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>06</span>
                          <span className="ch-t">Roadmap</span>
                        </div>
                        <div className="ch-body">
                          <ul>
                            {modalCase.content.roadmap.map((item: any, idx: number) => (
                              <li key={idx}>
                                <strong>{item.quarter} ({item.months}):</strong> {item.deliverables} <em>KPIs: {item.kpiTarget}</em>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {modalCase.content.metrics && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>07</span>
                          <span className="ch-t">Metrics</span>
                        </div>
                        <div className="met-section">
                          {modalCase.content.metrics.map((group: any, idx: number) => (
                            <div key={idx}>
                              <div className="mg-cat">{group.category}</div>
                              <div className="mg-rows">
                                {group.items.map((item: string, j: number) => (
                                  <div className="mg-row" key={j}>{item}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalCase.content.userJourneys && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>08</span>
                          <span className="ch-t">User Journeys</span>
                        </div>
                        <div className="journey-stack">
                          {modalCase.content.userJourneys.map((u: any, i: number) => (
                            <div className="journey-card" key={i}>
                              <div className="jc-persona">{u.journey || u.persona}</div>
                              <div className="jc-flow">{u.flow || u.steps?.join(' → ')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {modalCase.content.problemStatement && (
                  <>
                    <div className="mchapter">
                      <div className="ch-label">
                        <span
                          className="ch-n"
                          style={{ color: ac }}
                        >
                          01
                        </span>
                        <span className="ch-t">Problem Statement</span>
                      </div>
                      <div>
                        <div className="ch-body" style={{ marginBottom: 12 }}><p>{modalCase.content.problemStatement.overview}</p></div>
                        <div className="ch-cards">
                          {modalCase.content.problemStatement.challenges.map((c, i) => (
                            <div className="ch-card" key={i}>
                              <div className="cc-ttl">{c.title}</div>
                              <div className="cc-body">{c.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mchapter">
                      <div className="ch-label">
                        <span
                          className="ch-n"
                          style={{ color: ac }}
                        >
                          02
                        </span>
                        <span className="ch-t">Why It Matters</span>
                      </div>
                      <div
                        className="ch-body"
                        dangerouslySetInnerHTML={{
                          __html: `<p>${modalCase.content.whyItMatters}</p>`,
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
                        <span className="ch-t">Product Vision</span>
                      </div>
                      <div className="ch-body">
                        <p>{modalCase.content.productVision}</p>
                        <h4>V1 Goals</h4>
                        <ul>
                          {modalCase.content.v1Goals.map((goal, i) => (
                            <li key={i}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {modalCase.content.coreCapabilities && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span
                            className="ch-n"
                            style={{ color: ac }}
                          >
                            04
                          </span>
                          <span className="ch-t">Core Capabilities</span>
                        </div>
                        <div>
                          {modalCase.content.coreCapabilities.map((cap, idx) => (
                            <div className="cap-group" key={idx}>
                              <div className="cap-title">{cap.title}</div>
                              <div className="cap-items">
                                {cap.features.map((f, j) => (
                                  <div className="cap-item" key={j}>{f}</div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalCase.content.userJourneys && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span
                            className="ch-n"
                            style={{ color: ac }}
                          >
                            05
                          </span>
                          <span className="ch-t">User Journeys</span>
                        </div>
                        <div className="journey-stack">
                          {modalCase.content.userJourneys.map((u, i) => (
                            <div className="journey-card" key={i}>
                              <div className="jc-persona">{(u as any).journey || (u as any).persona}</div>
                              <div className="jc-flow">{(u as any).flow || (u as any).desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {modalCase.content.marketResearch && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>06</span>
                          <span className="ch-t">Market Research</span>
                        </div>
                        <div className="ch-body">
                          <p>{modalCase.content.marketResearch.userBehavior}</p>
                          <p>{modalCase.content.marketResearch.daySegmentation}</p>
                          <ul>
                            {modalCase.content.marketResearch.widgetPriority.map((wp, i) => (
                              <li key={i}>
                                <strong>{wp.widget}:</strong> {wp.rationale}
                              </li>
                            ))}
                          </ul>
                          {modalCase.content.marketResearch.layerStrategy && (
                            <p><strong>Layer Strategy:</strong> {modalCase.content.marketResearch.layerStrategy}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {modalCase.content.successMetrics && (
                      <div className="mchapter">
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>09</span>
                          <span className="ch-t">Success Metrics</span>
                        </div>
                        <div>
                          {Object.entries(modalCase.content.successMetrics).map(([category, metrics]: any, idx) => (
                            <div className="sm-group" key={idx}>
                              <div className="sm-cat">{category.replace(/([A-Z])/g, ' $1').replace(/^./, (s: string) => s.toUpperCase())}</div>
                              <div className="sm-rows">
                                {metrics.map((m: any, j: number) => (
                                  <div className="sm-row" key={j}>
                                    <div className="sm-metric">{m.metric}</div>
                                    <div className="sm-def">{m.definition}</div>
                                    {m.why && <div className="sm-why">{m.why}</div>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(modalCase.content as any).customSections && (
                  <>
                    {((modalCase.content as any).customSections as any[]).map((section: any, idx: number) => (
                      <div className="mchapter" key={idx}>
                        <div className="ch-label">
                          <span className="ch-n" style={{ color: ac }}>{section.num}</span>
                          <span className="ch-t">{section.title}</span>
                        </div>
                        {section.body && (
                          <div className="ch-body" dangerouslySetInnerHTML={{ __html: `<p>${section.body}</p>` }} />
                        )}
                        {section.items && (
                          <ul className="ch-list" style={{ marginTop: section.body ? 10 : 0 }}>
                            {section.items.map((item: string, i: number) => (
                              <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
                            ))}
                          </ul>
                        )}
                        {section.widgets && (
                          <div className="feat-grid">
                            {section.widgets.map((w: any, i: number) => (
                              <div className="feat-card" key={i}>
                                <div className="fc-title">{w.name}</div>
                                <div className="fc-desc">{w.rationale}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {section.subsections && section.subsections.map((sub: any, i: number) => (
                          <div className="cap-group" key={i}>
                            <div className="cap-title">{sub.title}</div>
                            <div className="cap-items">
                              {sub.items.map((f: string, j: number) => (
                                <div className="cap-item" key={j}>{f}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                        {section.journeys && (
                          <div className="journey-stack">
                            {section.journeys.map((j: any, i: number) => (
                              <div className="cs-jcard" key={i}>
                                <div className="cj-name">{j.name}</div>
                                <div className="cj-meta">
                                  <div className="cj-badge">Entry <span>{j.entry}</span></div>
                                  <div className="cj-badge">Exit <span>{j.exit}</span></div>
                                </div>
                                <div className="cj-steps">
                                  {j.steps.map((s: string, k: number) => (
                                    <div className="cj-step" key={k}>{s}</div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {section.metricGroups && (
                          <div className="cs-metrics">
                            {section.metricGroups.map((g: any, i: number) => (
                              <div className="cs-mg" key={i}>
                                <div className="cs-mg-name">{g.name}</div>
                                {g.subtitle && <div className="cs-mg-sub">{g.subtitle}</div>}
                                <div className="cs-mg-rows">
                                  {g.metrics.map((m: any, j: number) => (
                                    <div className="cs-mg-row" key={j}>
                                      <div className="cs-mg-metric">{m.metric}</div>
                                      <div className="cs-mg-def">{m.definition}</div>
                                      {m.why && <div className="cs-mg-why">{m.why}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
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
