/**
 * The live site's content, extracted verbatim from the Figma Make `App.tsx`
 * (docs/handover/07-v0-content.md · Extraction). Nothing renders this module:
 * it feeds the V0 seed. A snapshot test guards it, so any edit is deliberate.
 */

export const CASES = [
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
      customSections: [
        {
          num: "01",
          title: "Assignment Objective",
          body: "Improve the <strong>order per user (Monthly order frequency)</strong> for the puja service at Sri Mandir.",
          items: null,
        },
        {
          num: "02",
          title: "Assumptions",
          body: null,
          items: [
            "<strong>Core Puja Performance is Authentic:</strong> We assume the religious rituals are performed authentically by verified priests according to scriptures, and the challenge lies in communicating and ensuring this authenticity in the online format.",
            "<strong>Technological Infrastructure:</strong> Sri Mandir possesses or can acquire the necessary technological infrastructure to implement proposed digital enhancements, including localisation.",
            "<strong>Access to User Data:</strong> Basic user data regarding puja bookings, frequency, location (inferred), and stated preferences is accessible for analysis and personalisation efforts.",
            "<strong>Motivation Beyond One-Time Need:</strong> While specific needs might drive initial bookings, there's an underlying desire among users for ongoing spiritual connection, seeking blessings, and performing religious duties regularly.",
          ],
        },
        {
          num: "03",
          title: "Target User Segments",
          body: null,
          items: null,
          subsections: [
            {
              title: "Tech-Savvy Devotees (Millennials & Gen Z)",
              items: ["Individuals who integrate technology into their lives and seek convenient ways to practice faith."],
            },
            {
              title: "NRIs & Geographically Distant Devotees",
              items: ["Those living away from their preferred temples or countries, seeking to stay connected to their spiritual roots."],
            },
            {
              title: "Time-Constrained Individuals",
              items: ["Users with busy schedules who prioritise efficiency — seeking convenience & accessibility to easily book and participate from home."],
            },
            {
              title: "Individuals with Specific Needs",
              items: ["Users booking for particular life events, astrological reasons, or personal challenges."],
            },
            {
              title: "Tech-informed Devotees Seeking Regular Practice",
              items: ["Tech-comfortable individuals who value consistency in spiritual rituals and seek regular puja participation."],
            },
            {
              title: "Non-Technological Regular Devotees",
              items: ["Older, tradition-focused individuals deeply devoted to puja but less comfortable with digital tools. Typically use WhatsApp or Facebook. May struggle with online payments."],
            },
            {
              title: "Non-Hindi/English Speaking Devotees",
              items: ["A potentially underserved segment comfortable in regional Indian languages."],
            },
          ],
        },
        {
          num: "04",
          title: "User Motivations & Pain Points",
          body: null,
          items: null,
          subsections: [
            {
              title: "Key Motivations",
              items: [
                "<strong>Spiritual Connection & Fulfillment:</strong> Seeking blessings and maintaining religious practice. Staying connected to traditional roots — often through listening to aartis and bhajans.",
                "<strong>Convenience & Accessibility:</strong> Booking and participating from anywhere, anytime.",
                "<strong>Time & Effort Saving:</strong> Avoiding logistical hassles of offline pujas.",
                "<strong>Authenticity & Trust (Desired):</strong> Expectation that rituals are performed correctly by qualified priests.",
                "<strong>Bridging Distance:</strong> Connecting with specific temples or traditions from afar.",
                "<strong>Receiving Prasad & Blessings:</strong> The tangible outcome of the puja.",
              ],
            },
            {
              title: "Pain Points (from Google Play Reviews & App Usage)",
              items: [
                "<strong>Lack of Personalisation & Context:</strong> The puja service page is generic, lacking recommendations based on user history, preferences, or local relevance (e.g., what others are booking in that location).",
                "<strong>Product Education:</strong> Low awareness & discoverability of the Puja service and its offerings.",
                "<strong>Lack of Trust Signals:</strong> Absence of trust on online payments. No social proofing (e.g., how many users viewed/booked). Concerns about divine box quality and missing items. Lack of clarity on puja venue. Critical issue of incorrect Gotra being used. Insufficient communication regarding venue changes or Prasad issues.",
                "<strong>Accessibility Limitations:</strong> Service primarily in Hindi and English alienates users comfortable only in regional languages.",
                "<strong>Learning Curve:</strong> Multiple steps and unfamiliar interactions differ from typical app flows (like FB, WhatsApp), creating a barrier especially for first-time users.",
                "<strong>Lack of Urgency/Timeliness Cues:</strong> No timer on critical pujas where timing is significant to create booking urgency.",
                "<strong>Limited Guidance on Options:</strong> Difficulty identifying the 'most picked plans' or best options without personalisation.",
              ],
            },
          ],
        },
        {
          num: "05",
          title: "Opportunities for Improvement",
          body: "Opportunities lie in addressing identified pain points to build trust, enhance convenience, and create a more personalised and engaging experience that encourages repeat and more frequent bookings.",
          items: [
            "<strong>Build and Communicate Trust:</strong> Proactively address concerns about authenticity, Prasad, Gotra, and venue transparency.",
            "<strong>Enhance Personalisation & Relevance:</strong> Make the puja discovery and booking process highly relevant based on profile, history, and context (location, auspicious dates).",
            "<strong>Product Education:</strong> Build awareness & product education experience for users.",
            "<strong>Subscriptions:</strong> Offer easy ways to book recurring pujas and manage spiritual obligations.",
            "<strong>Improve Accessibility:</strong> Cater to users in their preferred language & community (e.g., Bihari, Bengali).",
            "<strong>Optimise for Conversion:</strong> Use urgency cues wherever appropriate to reduce booking time.",
            "<strong>Improve Post-Booking Experience:</strong> Ensure smooth Prasad delivery and clear communication throughout the process.",
            "Implement robust data collection for Gotra and integrate it clearly into booking and confirmation.",
            "Develop a personalised dashboard showing recommended pujas, upcoming events, and loyalty status.",
            "Display social proof metrics (e.g., 'X users viewing,' 'Y users booked this week').",
            "Offer multiple language selection options for content and communication.",
            "Streamline the booking flow, clearly presenting options like single booking vs. subscription.",
          ],
        },
        {
          num: "06",
          title: "Proposed Solutions by Segment",
          body: null,
          items: null,
          subsections: [
            {
              title: "Time-Constrained Professional / Millennial / Gen Z",
              items: [
                "Puja Recommendation Engine",
                "Personalised Spiritual Calendar & Reminders",
                "Subscription Packages",
                "<em>Metrics:</em> Puja Order ↑ · Subscription Adoption & Renewal % · Reminder Click Rate",
              ],
            },
            {
              title: "NRI / Geographically Distant Devotee",
              items: [
                "Personalised Recommendations by region/tradition",
                "Spiritual Calendar with local timezone",
                "Gift a Puja",
                "<em>Metrics:</em> Repeat Booking Rate from NRIs · Gifting Feature Usage · NRI Engagement %",
              ],
            },
            {
              title: "Needs-Based / Occasional User",
              items: [
                "Problem-Specific Recommendation Engine",
                "Monthly Curated Focus Pujas",
                "<em>Metrics:</em> Engagement with Focus Pujas · Bounce Rate on Need-Based Pages ↓ · Booking Conversion Rate ↑",
              ],
            },
            {
              title: "Tech-informed Devotees Seeking Regular Practice",
              items: [
                "Subscription Packages",
                "Personalised Spiritual Calendar & Reminders",
                "Tiered Loyalty Rewards",
                "Puja & Aashirvaad Box Authenticity",
                "Complementary Puja Suggestions",
                "<em>Metrics:</em> Puja Users ↑ · Puja Booked ↑ · Loyalty Program Participation · Subscription Adoption & Renewal % · # Puja Box Complaints",
              ],
            },
            {
              title: "Non-Technological Regular Devotees",
              items: [
                "Product Education",
                "Video feed of puja, chadhavs or rituals",
                "WhatsApp Integration",
                "<em>Metrics:</em> Engagement Rate on Education · Video View Count · Engagement & retention on video feed · Conversion Rate via WhatsApp",
              ],
            },
            {
              title: "Skeptical / New Online Puja User",
              items: [
                "Post-Puja Transparency (video, photo, prasad)",
                "Responsive Support",
                "Social Proofing & User Testimonials",
                "<em>Metrics:</em> First-Time Booking Conversion Rate · Support Ticket Resolution Time ↓ · NPS / CSAT Score ↑",
              ],
            },
            {
              title: "Non-Hindi/English Speaking Devotees",
              items: [
                "Multi-Language UI & Booking Flow",
                "Regional Language Video/Audio Mantras",
                "Local Language Support Team",
                "Puja Descriptions in Native Tongues",
                "<em>Metrics:</em> Drop-off Rate in Non-Hindi/English Regions ↓ · Increase in Bookings from Vernacular Users · Language Preference Opt-in Rate ↑",
              ],
            },
          ],
        },
        {
          num: "07",
          title: "Priority Segments",
          body: "To boost monthly orders per user, we will prioritise these key segments:",
          items: [
            "<strong>1. Time-Constrained Professionals / Millennials / Gen Z:</strong> Their busy, tech-savvy nature makes them highly receptive to convenient, recurring digital solutions like subscriptions, offering the greatest potential for increased monthly frequency.",
            "<strong>2. Tech-informed Devotees Seeking Regular Practice:</strong> Already inclined towards regular practice, they will benefit from streamlined processes, personalisation and subscriptions to maintain or slightly increase their existing high frequency.",
            "<strong>3. Non-Technological Regular Devotees</strong> (like mothers and grandparents): Social media users who struggle with online payments due to trust issues. Their strong religious commitment drives high repeat engagement and potential for increased order frequency.",
          ],
        },
        {
          num: "08",
          title: "RICE Prioritisation",
          body: null,
          items: null,
          metricGroups: [
            {
              name: "Feature Priority Ranking",
              subtitle: "Reach × Impact × Confidence ÷ Effort",
              metrics: [
                { metric: "WhatsApp Integration", definition: "Reach: 9 · Impact: 2.5 · Confidence: 85% · Effort: 2 mo", why: "RICE Score 9.6 — Priority #1" },
                { metric: "Product Education", definition: "Reach: 7 · Impact: 2 · Confidence: 65% · Effort: 1 mo", why: "RICE Score 9.1 — Priority #2" },
                { metric: "Puja Recommendation Engine", definition: "Reach: 9 · Impact: 2.7 · Confidence: 90% · Effort: 3 mo", why: "RICE Score 7.3 — Priority #3" },
                { metric: "Video Feed", definition: "Reach: 9 · Impact: 2.5 · Confidence: 95% · Effort: 3 mo", why: "RICE Score 7.1 — Priority #4" },
                { metric: "Personalised Spiritual Calendar & Reminders", definition: "Reach: 9 · Impact: 2 · Confidence: 95% · Effort: 2.5 mo", why: "RICE Score 6.8 — Priority #5" },
                { metric: "Subscription Packages", definition: "Reach: 8 · Impact: 2.5 · Confidence: 85% · Effort: 1.5 mo", why: "RICE Score 5.7 — Priority #6" },
                { metric: "Complementary Puja Suggestions", definition: "Reach: 6 · Impact: 2 · Confidence: 65% · Effort: 2 mo", why: "RICE Score 3.9 — Priority #7" },
                { metric: "Tiered Loyalty Rewards", definition: "Reach: 6 · Impact: 2 · Confidence: 65% · Effort: 3 mo", why: "RICE Score 2.6 — Priority #8" },
                { metric: "Puja & Aashirvaad Box Authenticity", definition: "Reach: 5 · Impact: 1.5 · Confidence: 60% · Effort: 2 mo", why: "RICE Score 2.3 — Priority #9" },
              ],
            },
          ],
        },
        {
          num: "09",
          title: "WhatsApp Integration",
          body: "We'll leverage WhatsApp as a <strong>dual-purpose channel</strong> — first, to deliver bite-sized, conversational product education (interactive tutorials, rich media demos, and targeted tips) that helps devotees discover and understand all puja services; and second, to enable <strong>seamless inbound booking requests</strong> directly within the chat interface, so users can simply message or tap menu options to schedule, personalize, and confirm their puja without ever leaving WhatsApp.",
          items: [
            "<strong>Product Education via WhatsApp:</strong> Bite-sized, conversational tutorials and rich media demos delivered in-chat to drive discovery and awareness.",
            "<strong>Puja Booking Service via WhatsApp:</strong> Users tap a menu → browse top pujas → select package → pay via deep-link → confirmation + tracking on WhatsApp. TAT from tap to confirmation: 60 seconds.",
          ],
        },
        {
          num: "10",
          title: "Video Feed",
          body: "Introducing a <strong>dedicated video section</strong> where devotees can endlessly scroll through immersive clips — creating session depth & improving engagement. By showcasing pujas, rituals, and Chadhavs in action, this video-led discovery format meets modern users' evolving browsing habits. Just as Meesho's in-app video feed lets shoppers see products in use and builds trust before purchase, our videos will foster <strong>authenticity and confidence</strong> in every puja experience.",
          items: null,
        },
        {
          num: "11",
          title: "Puja Recommendation Engine",
          body: "We'll gently collect key details — Gotra, birthdays, anniversaries, children's information — at right moments in the app (e.g., when user clicks on puja), always explaining the benefit. By collecting relevant info we deliver truly relevant puja recommendations, build trust, and avoid overload.",
          items: null,
          subsections: [
            {
              title: "Cold-Start (No User Data)",
              items: [
                "<strong>Show local favorites:</strong> Detect the user's location to highlight the most-booked pujas in their city or region.",
                "<strong>Feature upcoming & seasonal events:</strong> Surface major monthly pujas and festivals (e.g., Navratri, Sankashti) so newcomers see timely, relevant offerings.",
                "<strong>Highlight platform trends:</strong> 'What's Trending' strip showcasing pujas with high view or booking counts across all users, building social proof and driving initial engagement.",
              ],
            },
            {
              title: "When User Data Is Available",
              items: [
                "<strong>Leverage profile attributes:</strong> Pull in Gotra, birthdates, anniversaries and astrological details to surface rituals that align with heritage and life events.",
                "<strong>Tailor to important dates:</strong> Analyse their important days and suggest relevant pujas.",
                "<strong>Build a dynamic 'For You' carousel:</strong> Continuously updated with new recommendations — 'Based on your last Ganesh Puja' or 'Anniversary special for 5 years of devotion.' Incorporates past booking data and app interaction.",
              ],
            },
          ],
        },
      ],
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
      customSections: [
        {
          num: "01",
          title: "Word Trip Overview",
          body: "WordTrip is a word puzzle game that combines elements of crosswords and word searches with travel-themed visuals and progression. The game primarily monetizes through <strong>in-app purchases and advertising</strong>. Current position: <strong>#5 by revenue (~$500K/mo) with 6.5M MAU</strong>. Word Escapes generates 4.4× more revenue with only 1.7M incremental users — this is not a user acquisition problem, it's a <strong>monetization and retention gap</strong>.",
          items: null,
        },
        {
          num: "02",
          title: "Competitive Landscape",
          body: null,
          items: null,
          metricGroups: [
            {
              name: "Game Comparison",
              subtitle: "MAU · Monthly Revenue · App Store Ranking · Rating",
              metrics: [
                { metric: "Word Trip", definition: "MAU: 6.5M · Revenue: ~$500K/mo · App Store: #62 · Play Store: #23 · Rating: 4.6/4.4", why: "Current baseline — lowest revenue per user in category" },
                { metric: "Word Escapes", definition: "MAU: 8.2M · Revenue: ~$2.2M/mo · App Store: #6 · Play Store: #9 · Rating: 4.8/4.5", why: "Primary benchmark — 4.4× revenue on 1.7M more users" },
                { metric: "Words With Friends (Zynga)", definition: "MAU: 13.8M · Revenue: ~$2.7M/mo · App Store: #51 · Play Store: #21 · Rating: 4.5/3.5", why: "Largest MAU — strong social features and multi-format" },
                { metric: "Word Connect", definition: "MAU: 7.5M · Revenue: ~$500K/mo · App Store: #23 · Play Store: #136 · Rating: 4.8/4.6", why: "Comparable MAU to Word Trip; similar revenue — sentence completion adds variety" },
                { metric: "Word Cookies", definition: "MAU: 5.2M · Revenue: ~$400K/mo · App Store: #36 · Play Store: #56 · Rating: 4.5/4.5", why: "Lower MAU but better IAP strategy — milestone-based monetization" },
                { metric: "Words of Wonders", definition: "MAU: N/A · Revenue: ~$300K/mo · App Store: #10 · Play Store: #8 · Rating: 4.9/4.8", why: "Highest rating — localization success story (60M installs in 18mo via Russia/Turkey)" },
              ],
            },
            {
              name: "Top Performer Benchmarks",
              subtitle: "Industry benchmarks for mobile word games (GameAnalytics)",
              metrics: [
                { metric: "Day 1 Retention", definition: "Up to 43–50%", why: "Word Trip baseline: ~35%" },
                { metric: "Day 7 Retention", definition: "Up to 18–35%", why: "Word Trip baseline: ~18%" },
                { metric: "Day 28 Retention", definition: "Up to 20–29%", why: "Word Trip baseline: ~12%" },
                { metric: "IAP Conversion Rate", definition: "~3–5%", why: "Word Trip baseline: ~2.5%" },
                { metric: "Session Length", definition: "Up to 27–45 minutes", why: "Word Trip baseline: ~15 min" },
                { metric: "ARPPU", definition: "Up to $10", why: "Mobile game analytics benchmark" },
                { metric: "ARPU", definition: "~$0.60", why: "Word Trip baseline comparable" },
              ],
            },
          ],
        },
        {
          num: "03",
          title: "User Pain Points",
          body: "Based on observations from Word Trip & competitor app usage over multiple days:",
          items: null,
          subsections: [
            {
              title: "1. High Onboarding Friction",
              items: [
                "Word Trip shows 3 consecutive pop-ups (thank you message, iOS ads tracking, notifications) before even asking for login/account creation — then lands on the first product experience. This creates <strong>5+ clicks before first gameplay</strong>, the highest among all competitors.",
                "<strong>How competitors do it differently:</strong> Word Escapes: only EULA acceptance before product demo. Word Connect: iOS ad tracking then immediately starts gameplay. Word Cookies: just two pop-ups before gameplay.",
                "<strong>Why this matters:</strong> First-time UX directly impacts install-to-player conversion. Each additional click before gameplay increases drop-off by ~20% (GameAnalytics). Acquisition costs are wasted when users abandon before experiencing core gameplay. High friction creates negative first impressions leading to poor store ratings.",
              ],
            },
            {
              title: "2. Limited Game Formats",
              items: [
                "Word Trip offers only <strong>one format of word game</strong> unlocked at initial level. The travel theme with hidden bonus words is engaging but becomes repetitive without alternative modes.",
                "<strong>How competitors do it differently:</strong> Zynga Word With Friends: multiple game modes accessible at all levels — daily puzzle, match of the day, solo challenge, word wheel, social gaming, PvP, crosswords, Clubs. Word Connect: offers sentence completion. Word Escapes: crossword-style gameplay as an alternative format.",
                "<strong>Why this matters:</strong> Different formats appeal to various skill levels and play preferences. Udonis Research shows variety significantly reduces churn by preventing gameplay fatigue. Limited formats restrict session length. Multiple formats create cross-promotion opportunities.",
              ],
            },
            {
              title: "3. Suboptimal Monetization & IAP Strategy",
              items: [
                "<strong>Poor IAP Bundle Design:</strong> Best value packs are hidden; first item (600 INR) is neither popular nor best value. Most popular plan placed in the second fold. No restore plan option or mega sale timer.",
                "<strong>Ad Overload:</strong> Excessive ads during the second session, leading to a frustrating user experience.",
                "<strong>How competitors do it differently:</strong> Word Escapes: better bundling, exclusive time-sensitive bundling at start, red color to highlight value. Zynga: places 'most popular' first, uses time-associated offers with shimmer animation. Word Connect: 'one time offer' creating urgency, restore option. Word Cookies: sale timer, most popular bundles at top.",
                "<strong>Why this matters:</strong> IAP optimization impacts revenue without requiring additional users. Optimal IAP presentation can increase conversion by 25–35% (Liftoff). Early ad bombardment damages retention. Urgency mechanics (timers, limited offers) are proven psychological triggers.",
              ],
            },
            {
              title: "4. Missing Retention Mechanisms",
              items: [
                "Word Trip lacks <strong>leaderboards, daily/weekly milestones, temporal events</strong> (Holi, Diwali), and social gaming features like PvP. Engagement features like clubs and daily spelling bee only unlock at higher levels.",
                "<strong>How competitors do it differently:</strong> Word Escapes: leaderboards for competitive play. Zynga: leaderboards for global & friends, solo challenge, Clubs at all levels. Word Connect: daily tasks with progress promoting retention. Word Cookies: milestones with reward rates. Word With Friends: daily free claim section improving daily behaviour.",
                "<strong>Why this matters:</strong> Retention is the primary driver of LTV in free-to-play games. GameRefinery research shows games with robust retention features maintain 30–40% higher DAU/MAU ratios. Social features create organic growth. Seasonal events create reasons to return.",
              ],
            },
          ],
        },
        {
          num: "04",
          title: "RICE Prioritisation",
          body: null,
          items: null,
          metricGroups: [
            {
              name: "Initiative Priority Ranking",
              subtitle: "Reach × Impact × Confidence ÷ Effort",
              metrics: [
                { metric: "Streamline Onboarding", definition: "Reach: 10 · Impact: 2 · Confidence: 90% · Effort: 1 mo", why: "RICE Score 18 — Priority #1" },
                { metric: "Optimize IAP Strategy", definition: "Reach: 8 · Impact: 3 · Confidence: 85% · Effort: 3 mo", why: "RICE Score 6.8 — Priority #2" },
                { metric: "Add Multiple Game Formats", definition: "Reach: 8 · Impact: 2.5 · Confidence: 80% · Effort: 4 mo", why: "RICE Score 4 — Priority #3" },
                { metric: "Implement Retention Features", definition: "Reach: 9 · Impact: 2 · Confidence: 75% · Effort: 4 mo", why: "RICE Score 3.38 — Priority #4" },
                { metric: "Add Social Gaming", definition: "Reach: 6 · Impact: 2 · Confidence: 70% · Effort: 3 mo", why: "RICE Score 2.8 — Priority #5" },
              ],
            },
          ],
        },
        {
          num: "05",
          title: "Market Share Positioning Strategy",
          body: "<strong>Current Position:</strong> Word Trip is the #5 player in the word games category. <strong>Target Position:</strong> Reach #3 within 12 months. The strategy leverages Word Trip's unique travel theme as differentiation while filling competitive gaps in formats, retention, and monetization.",
          items: [
            "<strong>Travel Companions:</strong> Friend system framed as 'travel buddies' who can assist with hints or play together. Ability to send postcards (messages/challenges) from unlocked destinations.",
            "<strong>Travel Rewards Economy:</strong> Convert traditional coins/gems into 'miles' redeemable for game benefits. Premium 'expeditions' for IAP purchases taking players to exclusive destinations. Travel-themed power-ups (e.g., 'Local Guide' for hints, 'Translation Book' for word reveals).",
            "<strong>Fill competitive gaps:</strong> Multiple game formats and retention mechanics to match top performers.",
            "<strong>Monetization innovation:</strong> Personalized IAP bundles based on user behaviour and spend patterns.",
            "<strong>New Market Expansion:</strong> Identify new markets for localized experiences — inspired by Words of Wonders gaining 60 million installs in 18 months through localization for Russia and Turkey.",
          ],
        },
        {
          num: "06",
          title: "Expected Growth Metrics",
          body: null,
          items: null,
          metricGroups: [
            {
              name: "Growth Targets",
              subtitle: "6-Month vs 12-Month targets (relative to baseline)",
              metrics: [
                { metric: "Monthly Active Users", definition: "6-Month: 1.2× · 12-Month: 1.35×", why: "6.5M → 8.8M target" },
                { metric: "Average Revenue Per User", definition: "6-Month: 1.25× · 12-Month: 1.44×", why: "$0.60 → $0.75 ARPU" },
                { metric: "Market Share Ranking", definition: "6-Month: 1.5× · 12-Month: 1.1×", why: "App Store #62 → #30 target" },
                { metric: "Day 1 Retention", definition: "6-Month: 1.4× · 12-Month: 1.5×", why: "35% → 48% target" },
                { metric: "Day 30 Retention", definition: "6-Month: 1.1× · 12-Month: 1.15×", why: "12% → ~14% target" },
                { metric: "IAP Conversion Rate", definition: "6-Month: 1.2× · 12-Month: 1.4×", why: "2.5% → 3.5% target" },
              ],
            },
          ],
        },
        {
          num: "07",
          title: "Q1 Roadmap: Onboarding & Monetization",
          body: null,
          items: null,
          subsections: [
            {
              title: "Onboarding Optimization",
              items: [
                "Reduce clicks from 5 to 2 (game demo → optional account creation)",
                "A/B test streamlined flows",
                "Implement progressive permission requests at different milestones",
                "<em>KPIs:</em> First-time user conversion: 65% → 85% · Day 1 retention",
              ],
            },
            {
              title: "IAP Strategy Revamp",
              items: [
                "Reorganize IAP bundles (most popular/best value first)",
                "Implement timed exclusive offers",
                "Add 'Restore Purchase' option",
                "Improve bundle naming focused on value",
                "<em>KPIs:</em> IAP conversion rate: 2.5% → 3.1% · Total IAP purchases",
              ],
            },
            {
              title: "Ad Strategy Optimization",
              items: [
                "Reduce ad frequency in first 3 sessions",
                "Implement rewarded video ads with valuable rewards",
                "Optimize ad placement based on user journey & milestones",
                "<em>KPIs:</em> Ad revenue per DAU · 7-day retention",
              ],
            },
          ],
        },
        {
          num: "08",
          title: "Q2 Roadmap: Game Expansion & Engagement",
          body: null,
          items: null,
          subsections: [
            {
              title: "Multiple Game Format Introduction",
              items: [
                "Add 'Word Puzzles' format from level 1",
                "Introduce 'Daily Challenge' with rotating formats",
                "Create seamless navigation between game types",
                "<em>KPIs:</em> Average session time · Average sessions per day",
              ],
            },
            {
              title: "Retention Mechanisms",
              items: [
                "Implement global and friends leaderboards",
                "Add daily milestone system with rewards encouraging users to login",
                "<em>KPIs:</em> 30-day retention · DAU/MAU ratio",
              ],
            },
            {
              title: "Social Features Phase 1",
              items: [
                "Add word challenges between friends",
                "Create social sharing for achievements",
                "<em>KPIs:</em> Average sessions duration · Social feature engagement",
              ],
            },
          ],
        },
        {
          num: "09",
          title: "Q3 Roadmap: Monetization & Live Ops",
          body: null,
          items: null,
          subsections: [
            {
              title: "Live Ops & Seasonal Events",
              items: [
                "Implement seasonal event framework",
                "Add limited-time rewards and collections",
                "<em>KPIs:</em> Event participation rate · Revenue during events",
              ],
            },
            {
              title: "Personalization Engine",
              items: [
                "Implement user segmentation based on behaviour",
                "Create personalized & dynamic IAP bundles",
                "<em>KPIs:</em> IAP conversion for targeted segments · Retention rate",
              ],
            },
            {
              title: "New Market Expansion Research",
              items: [
                "Do market study of new markets for word games",
                "Create capabilities to support localised experience",
                "Formulate GTM for targeted new markets",
                "<em>KPIs:</em> Total addressable market expansion",
              ],
            },
          ],
        },
        {
          num: "10",
          title: "Q4 Roadmap: Advanced Features & Expansion",
          body: null,
          items: null,
          subsections: [
            {
              title: "Advanced Game Formats",
              items: [
                "Add 'Word Wheel', 'Sentence Completion', 'Wordle' and other high-engaging word game formats",
                "<em>KPIs:</em> New user growth: +15% · Cross-format engagement: 30% of users",
              ],
            },
            {
              title: "Social Features Phase 2",
              items: [
                "Implement PvP word battles",
                "Add different game formats for PvP battles",
                "<em>KPIs:</em> Social feature engagement · Retention rate · Average session time",
              ],
            },
            {
              title: "Market Expansion 2",
              items: [
                "Integrate Local Payment Methods",
                "Run targeted regional campaigns",
                "Launch localised leaderboards",
                "Launch Regional Live Events",
                "ASO for new markets",
                "<em>KPIs:</em> Total addressable market · Revenue · MAU · DAU",
              ],
            },
          ],
        },
      ],
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
    prdLink: "https://docs.google.com/document/d/1MZGAA0LmIOjF_hVQIMYgjWKM06vQP8Aq66b8-xf2xFQ/edit?tab=t.0#heading=h.su9f7jlfuspx",
    prototypeUrl: "https://workspace-nu-liard.vercel.app/",
    content: {
      problem: "", approach: "", solution: [],
      impact: { text: "", items: [] },
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
      customSections: [
        {
          num: "01",
          title: "Summary",
          body: "GLP-1 medications have redefined what is clinically possible in weight loss — but real-world outcomes remain fragile. The gap is no longer pharmacology; it is <strong>behavioral persistence, expectation management, and metabolic protection</strong>. Today's GLP app is optimised for <em>recording activity</em>, not <em>driving outcomes</em>.",
          items: [
            "The product does not help users <strong>interpret stalled progress</strong>",
            "The product does not help users <strong>understand body recomposition</strong>",
            "The product does not help users <strong>protect muscle mass</strong>",
            "The product does not help users <strong>stay adherent through plateaus and side effects</strong>",
            "As a result: only <strong>64% of users lose >1 kg</strong> · fitness engagement is <strong>~25% MAU</strong> · progress is perceived as binary ('weight down = success, else failure')",
            "The next phase requires a strategic shift from <strong>tracking behaviour</strong> to <strong>owning outcomes</strong> — repositioning the GLP app as a <strong>Digital Scaffold</strong> that translates medication into durable metabolic outcomes.",
          ],
        },
        {
          num: "02",
          title: "Market Research: Why the Old Model Is Breaking",
          body: null,
          items: null,
          subsections: [
            {
              title: "2.1 The GLP-1 Market Has Entered Its Second Act",
              items: [
                "<strong>2022–2024 optimised for access:</strong> Rapid prescriber onboarding · Consumer-led demand · Medication-first value propositions",
                "<strong>2025–2026 structural shifts forcing a reset:</strong> Medication prices are falling · Prescription access is commoditising · 'GLP-only' platforms are losing defensibility",
                "<strong>Differentiation has moved downstream</strong> — from getting users on medication to ensuring outcomes persist.",
                "Across Noom, Omada, Found, and HealthifyMe, a consistent pattern: <em>'Medication enables weight loss. Engagement architecture determines durability.'</em>",
              ],
            },
            {
              title: "2.2 The Persistence Crisis Is the Real Bottleneck",
              items: [
                "Real-world GLP-1 programs show <strong>50–70% discontinuation within 12 months</strong>, with highest dropout in the <strong>first 90 days</strong>.",
                "This is not due to lack of intent — it's due to unmanaged friction across <strong>The Attrition Triad</strong>:",
                "<strong>Biological:</strong> Nausea, GI distress, fatigue → Early dropout",
                "<strong>Psychological:</strong> Food identity shifts, stigma, confusion → Loss of confidence",
                "<strong>Metric:</strong> Scale plateaus despite fat loss → Motivation collapse",
                "Most products fail because they treat weight loss as <strong>linear</strong>. Users experience it as <strong>non-linear, emotional, and confusing</strong>.",
              ],
            },
            {
              title: "2.3 What Winning Products Do Differently",
              items: [
                "<strong>Outcome visibility beats activity logging</strong> — Users need interpretation, not raw data.",
                "<strong>Human + digital hybrids outperform pure automation</strong> — Coaching access materially improves adherence and persistence.",
                "<strong>Muscle preservation is emerging as the new moat</strong> — Fast weight loss without muscle protection leads to metabolic slowdown and rebound.",
                "This creates a clear opening: <em>The next category leader will sell <strong>metabolic integrity</strong>, not just weight loss.</em>",
              ],
            },
          ],
        },
        {
          num: "03",
          title: "Why Now",
          body: "<strong>The End of 'Prescription as Product':</strong> As GLP-1 access becomes ubiquitous, users will ask harder questions. A logging-centric app cannot answer them. An outcome-owning product can. This is the inflection point where <strong>clinical ownership becomes the product</strong>.",
          items: [
            "Does weight loss persist beyond 3 months?",
            "Is muscle mass preserved?",
            "Are side effects managed early?",
            "Is cardiometabolic risk actually improving?",
          ],
        },
        {
          num: "04",
          title: "Current Product Reality",
          body: null,
          items: null,
          subsections: [
            {
              title: "What's Working",
              items: [
                "Strong foundational tracking primitives (weight, meals, fitness, side effects)",
                "High engagement with human coaches (~<strong>80% M2 chat usage</strong>)",
                "Embedded clinical access",
              ],
            },
            {
              title: "Where the Experience Breaks",
              items: [
                "No unified definition of 'progress'",
                "Fitness treated as optional, not essential",
                "Body composition invisible",
                "Protocol adherence implicit, not explicit",
                "Users log, but are not guided",
                "<em>The product records the journey — but does not <strong>direct</strong> it.</em>",
              ],
            },
          ],
        },
        {
          num: "05",
          title: "Core User Pain Points (Data-Backed)",
          body: null,
          items: null,
          subsections: [
            {
              title: "5.1 Progress Feels Invisible",
              items: [
                "Users anchor success entirely to scale weight.",
                "Users who lose ≥1 kg show <strong>–2 cm waist reduction</strong>",
                "Users who don't lose weight show <strong>+1 cm waist gain</strong>",
                "Waist tracking strongly correlates with perceived success",
                "This does <strong>not</strong> imply waist logging causes weight loss. It shows that <strong>visible signals sustain motivation</strong> — and these signals need not be absolute weight loss.",
              ],
            },
            {
              title: "5.2 Expectation Mismatch With GLP-1",
              items: [
                "<strong>User belief:</strong> 'Medication will do the work. I can eat anything freely.'",
                "<strong>Clinical reality:</strong> GLP-1 reduces appetite — not muscle loss risk.",
                "Without guidance: Exercise drops · Lean mass declines · RMR falls · Weight regain risk increases",
                "The app does not currently reset expectations early enough.",
              ],
            },
            {
              title: "5.3 Fitness Avoidance Is a Structural Risk",
              items: [
                "Fitness MAU ~25% · Majority complete only one session",
                "<strong>Clinical implication:</strong> Sarcopenic obesity risk · Unsustainable weight loss",
              ],
            },
            {
              title: "5.4 Gender-Based Outcome Gap (New Insight)",
              items: [
                "Men: <strong>1.66 kg</strong> average loss · Women: <strong>1.26 kg</strong> average loss",
                "<strong>Clinical context:</strong> Testosterone supports muscle preservation. Women require more intentional resistance training.",
                "<strong>Strategic implication:</strong> Fitness cannot be optional — especially for female users.",
              ],
            },
          ],
        },
        {
          num: "06",
          title: "What the Data Is Actually Saying",
          body: "These are correlations, not causal claims. But they clearly indicate: when protocol adherence is understood and maintained, outcomes improve. <strong>Engagement clusters around success</strong> — not the other way around. The product must make adherence <strong>visible, actionable, and reinforced</strong>.",
          items: [
            "Protocol followers lose <strong>~2.5 kg more</strong>",
            "Weight-loss cohort logs <strong>2× more meals</strong>",
            "Weight-loss cohort connects <strong>~30% more with doctors</strong>",
            "Non-weight-loss cohort shows <strong>waist gain</strong>",
          ],
        },
        {
          num: "07",
          title: "The Four Pillars of the GLP Digital Scaffold",
          body: null,
          items: null,
          subsections: [
            {
              title: "Pillar 1: Progress Visibility Beyond the Scale",
              items: [
                "Smart scale integration (where available)",
                "Waist and measurement trends surfaced prominently",
                "Full-body scan to visualise recomposition",
                "Explicit plateau education",
              ],
            },
            {
              title: "Pillar 2: Muscle Preservation & Fitness as a Core Outcome",
              items: [
                "Resistance-first fitness programs",
                "Proactive 1:1 fitness consultations",
                "Clear framing: <em>fitness = metabolic protection</em>",
                "Gender-aware guidance (especially for women)",
              ],
            },
            {
              title: "Pillar 3: Clinical Adherence & Side-Effect Triage",
              items: [
                "Structured side-effect monitoring",
                "Rapid escalation to coach/doctor",
                "Dosage expectation education",
                "Early-week intervention loops",
              ],
            },
            {
              title: "Pillar 4: Protocol-Driven Experience",
              items: [
                "Clear weekly protocol",
                "Visible adherence signals",
                "Outcome-based milestones vs task completion",
              ],
            },
          ],
        },
        {
          num: "08",
          title: "Engagement & Retention Loops",
          body: null,
          items: null,
          subsections: [
            {
              title: "Primary Loop",
              items: [
                "<strong>Progress clarity → confidence → adherence → outcomes</strong>",
              ],
            },
            {
              title: "Secondary Loops",
              items: [
                "<strong>Human accountability loop:</strong> Coach touchpoints at risk moments (plateau weeks, side-effect spikes) — not reactive support. Leverages existing ~80% M2 chat engagement.",
                "<strong>Visual reinforcement loop:</strong> Body scans, composition change visualisations, and waist trend charts shown contextually — where users are already looking.",
                "<strong>Safety loop:</strong> Side-effect resolution workflows that proactively surface guidance and escalation options. Trust built through managed adversity.",
                "These loops align with industry evidence that <strong>hybrid human + digital models materially improve persistence</strong>.",
              ],
            },
          ],
        },
        {
          num: "09",
          title: "Success Metrics",
          body: null,
          items: null,
          metricGroups: [
            {
              name: "Outcome Improvement",
              subtitle: "Are users actually losing weight and keeping it off?",
              metrics: [
                { metric: "Users losing >1 kg", definition: "64% baseline → 75% target", why: "Primary outcome signal — closes the gap between medication efficacy and real-world results" },
                { metric: "Protocol followers weight gap", definition: "Close from 2.5 kg to <1 kg vs non-followers", why: "Protocol adherence is the primary causal lever" },
                { metric: "Waist tracking adoption", definition: ">50% of active users logging waist measurements", why: "Non-scale visibility drives motivation through plateaus" },
              ],
            },
            {
              name: "Fitness & Muscle Protection",
              subtitle: "Is the metabolic protection layer working?",
              metrics: [
                { metric: "Fitness MAU", definition: "~25% baseline → 45% target", why: "Structural engagement gap — fitness is medically essential, not optional" },
                { metric: "Resistance sessions/week", definition: "Users completing ≥3 sessions: <5% baseline → 20% target", why: "Resistance training is the primary muscle preservation mechanism" },
                { metric: "Female fitness engagement parity", definition: "Close the 0.4 kg gender outcome gap within 6 months", why: "Gender-blind fitness experience fails the majority of the user base" },
              ],
            },
            {
              name: "Adherence & Retention",
              subtitle: "Is the scaffold keeping users on protocol?",
              metrics: [
                { metric: "12-month retention", definition: "30–50% baseline → 55% target", why: "50–70% discontinuation is the core problem this entire strategy addresses" },
                { metric: "First-90-day dropout", definition: "Reduce by 30%", why: "Highest dropout in first 90 days — early intervention is highest leverage" },
                { metric: "Coach escalation speed", definition: ">80% escalation within 48hr of side-effect log", why: "Rapid escalation converts biological friction into trust-building moments" },
              ],
            },
          ],
        },
        {
          num: "10",
          title: "Final Takeaway",
          body: "The GLP market is shifting from <strong>access to accountability</strong>. Products that remain logging-centric will struggle to differentiate. Platforms that <strong>own outcomes, expectations, and persistence</strong> will define the category.",
          items: null,
        },
      ],
    },
  },
  {
    id: 5,
    theme: "orange",
    vol: "VOL.05",
    volJp: "",
    co: "FarmVille 3 · Zynga",
    title: "REVENUE GROWTH STRATEGY",
    desc: "Pain-point-driven monetization via subscription, consumables, and community events to unlock 5% monthly incremental revenue",
    impact: "+5% monthly revenue (~$50K)",
    tags: ["monetization", "mobile", "games", "engagement", "retention"],
    kpis: [
      { v: "$50-65K", l: "Projected net incremental monthly revenue" },
      { v: "$2.10+", l: "ARPU target (from $2.00 baseline)" },
      { v: "5", l: "Features across 4 player segments" },
    ],
    content: {
      prototypeLink: "/farmville3_prototype.html",
      tags: [
        "Mobile Games",
        "F2P Monetization",
        "IAP Strategy",
        "Player Segmentation",
        "Subscription Design",
        "Community Events",
        "Behavioral Economics",
        "Competitive Analysis",
        "Revenue Modeling",
      ],
      customSections: [
        {
          num: "01",
          title: "Executive Summary",
          body: "FarmVille 3 generates ~$1M/month from ~500K MAU with two revenue drivers: direct IAP purchases and gem spending. The strategy targets <strong>$50K incremental monthly revenue (5% lift)</strong> via IAP-only mechanics without any ads or partnerships. Three progression bottlenecks are identified — sticker scarcity, tree fatigue, and exotic quest walls — and five features are proposed across four player segments, from a $2.99 subscription to community-driven competitive events.",
          items: [
            "<strong>Current Revenue:</strong> ~$1M/month · <strong>Target Lift:</strong> +5% · <strong>Projected Net Impact:</strong> $50–65K/mo · <strong>ARPU Target:</strong> $2.10+",
            "<strong>Revenue Driver 1: Direct Purchase</strong> — Loot boxes, DLC, bundles bought with real money",
            "<strong>Revenue Driver 2: Gem Purchases</strong> — More gem spending = more real-money top-ups",
            "<strong>Approach:</strong> New ways to spend real money directly + increasing gem spending on in-game items — driven by solving real player frustrations, not adding more friction.",
          ],
        },
        {
          num: "02",
          title: "Market Context",
          body: "FarmVille 3 under-monetizes vs. farming genre leaders. Its animal breeding (gacha) mechanic is its unique strength — it creates a high completionist drive. But the same mechanic creates the highest frustration when stickers or exotic animals are gated. <strong>The opportunity is to reduce this friction for a price.</strong>",
          items: null,
          metricGroups: [
            {
              name: "Competitive Benchmark",
              subtitle: "FarmVille 3 vs. Farming Genre Leaders",
              metrics: [
                { metric: "Est. Monthly Revenue", definition: "FarmVille 3: ~$1M · Hay Day: $15–20M · Township: $25–30M", why: "FarmVille 3 is significantly under-monetized relative to MAU" },
                { metric: "Est. MAU", definition: "FarmVille 3: ~500K · Hay Day: 5–8M · Township: 10–15M", why: "Smaller audience but comparable ARPU opportunity" },
                { metric: "ARPU (Monthly)", definition: "FarmVille 3: $2.00 · Hay Day: $2.50–3.00 · Township: $2.00–2.50", why: "Target is to close the ARPU gap to $2.10+ via pain-point monetization" },
                { metric: "IAP Conversion Rate", definition: "FarmVille 3: 2–3% · Hay Day: 3–5% · Township: 3–4%", why: "Conversion gap is the primary revenue lever" },
                { metric: "Primary Monetization", definition: "FarmVille 3: Gems + Farm Pass · Hay Day: Diamonds + trading · Township: Events + content depth", why: "Events and content depth are underutilized in FarmVille 3" },
                { metric: "Key Differentiator", definition: "FarmVille 3: Animal gacha/breeding · Hay Day: No forced tutorial · Township: City + farm hybrid", why: "Breeding mechanic is both the strength and the source of highest player frustration" },
              ],
            },
          ],
        },
        {
          num: "03",
          title: "Player Segmentation",
          body: "Spend-behavior segmentation reveals the real revenue levers: 400K 'Never Spent' players are the largest conversion pool, while 30K 'Frequent Buyers' offer the deepest ARPU expansion. A Level 35 player who has never spent is fundamentally different from a Level 20 who buys every pass — level-based segmentation misses this.",
          items: null,
          metricGroups: [
            {
              name: "Segment Profiles & Monetization Strategies",
              subtitle: "4 Segments · Based on F2P Benchmarks (GameAnalytics 2024/2026)",
              metrics: [
                { metric: "Never Spent (75–80% · ~400K)", definition: "Play daily, social-heavy; never made a purchase", why: "Convert via low-friction subscription ($2.99/mo) — largest conversion pool" },
                { metric: "Occasional Spender (12–15% · ~65K)", definition: "Buy Farm Pass ($4.99) once or twice; use gems for level-ups", why: "Increase spend frequency via contextual bundles + XP boosters" },
                { metric: "Frequent Buyer (5–7% · ~30K)", definition: "Spend on energy, time-skips, Sky Races; actively pursue exotic collections", why: "Deepen progression spend via sticker bundles, breeding boosters, event passes" },
                { metric: "Power Spender (1–2% · ~5K)", definition: "Max out collections; buy every bundle; competitive status-driven", why: "Create prestige spend via animal showoffs and exclusive community events" },
              ],
            },
          ],
        },
        {
          num: "04",
          title: "Growth Levers: Three Pain Points = Three Opportunities",
          body: "<strong>Principle: Monetize the solution to player frustration, not the frustration itself.</strong>",
          items: null,
          subsections: [
            {
              title: "The Sticker Bottleneck",
              items: [
                "Players report extreme difficulty leveling up Farmhands due to rare sticker scarcity — the #1 complaint in app store reviews",
                "<strong>Opportunity:</strong> Sticker swap mechanics, targeted bundles",
                "<strong>Target:</strong> Occasional Spenders & Frequent Buyers",
              ],
            },
            {
              title: "Tree Fatigue",
              items: [
                "Trees wither after 3 harvests. Replacing costs coins/gems and high energy — creates negative friction that causes churn rather than spend",
                "<strong>Opportunity:</strong> Subscription that removes withering",
                "<strong>Target:</strong> Never Spent & Occasional Spenders",
              ],
            },
            {
              title: "Exotic Quest Walls",
              items: [
                "Many players are stuck on Chapter 10+ Exotic Quests because animal levels are too low — the gap feels unbridgeable",
                "<strong>Opportunity:</strong> Contextual bundles + breeding boosters",
                "<strong>Target:</strong> Frequent Buyers & Power Spenders",
              ],
            },
          ],
        },
        {
          num: "05",
          title: "Solutions: Converting 'Never Spent' & Accelerating Progression",
          body: "A subscription + two consumables target the largest untapped revenue pool. Projected combined revenue (net of 30% store cut): <strong>$30K–$43K/month</strong>.",
          items: null,
          subsections: [
            {
              title: "Farm Hand Club @ $2.99/month",
              items: [
                "Low-commitment entry below Farm Pass ($4.99) — priced to minimize friction for first-time buyers",
                "<strong>Infinite Tree Life</strong> — trees stop withering (solves #2 pain point)",
                "<strong>Weekly Sticker Swap</strong> — 3 dupes for 1 choice sticker (solves #1 pain point)",
                "<strong>+10% XP bonus</strong> on all farming activities",
                "Exclusive 'Club Member' farm badge",
                "<strong>Target:</strong> Never Spent (400K) → 3–4% conversion · <strong>Projected:</strong> $25K–$34K/mo net",
              ],
            },
            {
              title: "Farm Master Tonic (XP Booster)",
              items: [
                "Consumable: doubles XP for 30 mins ($0.99) or 1 hr ($1.49)",
                "Purchasable via gems OR real money (dual sink)",
                "<strong>Target:</strong> Occasional Spenders — helps level up faster",
              ],
            },
            {
              title: "Lucky Charm Serum (Breed Boost)",
              items: [
                "Applied during breeding: +30–40% rare animal chance",
                "Priced at $1.49 / 30 gems per use",
                "<strong>Target:</strong> Occasional & Frequent — collection psychology",
                "<strong>Combined XP Booster + Breed Boost projected:</strong> $5K–$9K/mo net",
              ],
            },
          ],
        },
        {
          num: "06",
          title: "Solutions: Engagement, Social & Contextual Spend",
          body: "Community events + showoffs + smart bundles capture the high-value segments. Projected combined revenue (net): <strong>$25K–$46K/month</strong>.",
          items: null,
          subsections: [
            {
              title: "Community Events",
              items: [
                "<strong>Great Harvest Day:</strong> Seasonal localized crops, leaderboards, milestone skins",
                "<strong>World Fair Day:</strong> Team co-op, mini-games, coin gambling for farm items",
                "Monetization: Community Day Pass @ $2.99 · 4 events/month",
                "<strong>Target:</strong> All segments · <strong>Projected:</strong> $12K–$22K/mo net",
              ],
            },
            {
              title: "Animal Showoffs",
              items: [
                "<strong>Theme-Based Decoration:</strong> Seasonal packs (Christmas, Diwali) for animals — $1.99–$4.99",
                "<strong>Voting & Leaderboards:</strong> Weekly shows; players vote for best animal; winners get exclusive skins",
                "Monetization: Entry fee 50 gems ($0.99) · Decoration packs $1.99–$4.99",
                "<strong>Target:</strong> Frequent & Power Spenders · <strong>Projected:</strong> $8K–$14K/mo net",
              ],
            },
            {
              title: "Contextual 'Missing Piece' Bundles",
              items: [
                "Trigger: fail Exotic Quest 3× or hit Farmhand level cap",
                "Bundle contains exact stickers/food needed to bridge the gap",
                "Monetization: $1.99–$7.99 per bundle · 30-min purchase window",
                "<strong>Target:</strong> Frequent & Power Spenders · <strong>Projected:</strong> $5K–$10K/mo net",
              ],
            },
          ],
        },
        {
          num: "07",
          title: "Financial Model: ARPU Bridge $2.00 → $2.10+",
          body: "All figures net of 30% Apple/Google store cut. Conservative scenario delivers 5.5% lift; moderate scenario delivers 8.9% lift.",
          items: null,
          metricGroups: [
            {
              name: "Initiative-Level Revenue Breakdown",
              subtitle: "Baseline: 500K MAU × $2.00 = $1.0M/mo → Target: $2.10 ARPU (+5%)",
              metrics: [
                { metric: "Farm Hand Club ($2.99/mo)", definition: "Never Spent (400K) · 3–4% conv. · $25K–$34K net", why: "+$0.05–$0.07 ARPU lift — biggest single lever" },
                { metric: "XP Booster + Breed Boost", definition: "Occasional (265K) · 2–3% conv. · $5K–$9K net", why: "+$0.01–$0.02 ARPU lift" },
                { metric: "Community Events ($2.99)", definition: "All active (500K) · 3–5% conv. · $12K–$22K net", why: "+$0.02–$0.04 ARPU lift" },
                { metric: "Animal Showoffs", definition: "Frequent + Power (35K) · 15–20% conv. · $8K–$14K net", why: "+$0.02–$0.03 ARPU lift" },
                { metric: "Contextual Bundles", definition: "Frequent + Power (35K) · 5–8% conv. · $5K–$10K net", why: "+$0.01–$0.02 ARPU lift" },
                { metric: "TOTAL (net of 30% cut)", definition: "$55K–$89K/month incremental", why: "+$0.11–$0.18 ARPU · Conservative: 5.5% lift · Moderate: 8.9% lift" },
              ],
            },
          ],
        },
        {
          num: "08",
          title: "Prioritization & Risks",
          body: "Ship quick wins first, validate before investing in complex infrastructure. 10-week rollout: P0+P1 Ship (Wk 1–3) → P2 Sub Launch (Wk 3–5) → P3 Events Build (Wk 5–8) → P4 Showoffs + Full Rollout (Wk 8–10).",
          items: null,
          metricGroups: [
            {
              name: "Feature Prioritization",
              subtitle: "Ordered by Impact-to-Effort ratio",
              metrics: [
                { metric: "P0 · XP Booster + Breed Boost", definition: "Impact: $5–9K · Effort: Low", why: "Fastest to validate; consumable pattern proven in category" },
                { metric: "P1 · Contextual Bundles", definition: "Impact: $5–10K · Effort: Low", why: "Trigger logic on existing quest system — minimal new infra" },
                { metric: "P2 · Farm Hand Club", definition: "Impact: $25–34K · Effort: Med", why: "Biggest single lever; creates recurring revenue base" },
                { metric: "P3 · Community Events", definition: "Impact: $12–22K · Effort: High", why: "Highest engagement ceiling; needs event infrastructure" },
                { metric: "P4 · Animal Showoffs", definition: "Impact: $8–14K · Effort: High", why: "Requires UGC system, voting, and moderation layer" },
              ],
            },
            {
              name: "Risk Register",
              subtitle: "Key risks and mitigations",
              metrics: [
                { metric: "Farm Pass cannibalization · MED", definition: "A/B test Month 1", why: "Add Premium tier ($7.99) if >15% downgrade observed" },
                { metric: "Pay-to-win perception · HIGH", definition: "All items are progression aids or cosmetic", why: "No competitive advantage — preserve fairness perception" },
                { metric: "Event fatigue / gem sink · MED", definition: "Cap 4 events/month", why: "Monitor existing gem conversion 30 days post-launch" },
              ],
            },
          ],
        },
        {
          num: "09",
          title: "Recommendation",
          body: "<strong>Fix the pain, and the revenue follows.</strong>",
          items: [
            "<strong>01 · Ship P0/P1</strong> consumables + contextual bundles in Weeks 1–3 — validate spend appetite ($10–19K/mo net)",
            "<strong>02 · Launch Farm Hand Club</strong> ($2.99/mo) in Week 4 — biggest single lever at $25–34K/mo net, creates recurring revenue",
            "<strong>03 · Build Community Events + Animal Showoffs</strong> in parallel — highest engagement and social retention ceiling",
            "<strong>04 · Guard retention as a kill-switch</strong> — if D30 drops >2pp in any segment, pause and recalibrate immediately",
            "<strong>Success Metrics (30/60/90 Day):</strong> ARPU: $2.00 → $2.04 → $2.07 → $2.10+ · Conv. Rate: 2.5% → 3.0% → 3.5% · D30 Retention: No drop >2pp",
          ],
        },
      ],
    },
  },

];

export const TESTIMONIALS = [
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

export const NAV = ["About", "Skills", "Exp", "Work", "Testimonial"] as const;

export const NAV_CONTACT = "Let's Talk →";

export const HERO = {
  stats: [
    { value: "30", unit: "Cr+", label: "Annual Revenue Driven" },
    { value: "8", unit: "yr", label: "Product Experience" },
    { value: "300", unit: "M+", label: "Users Served" },
    { value: "5", unit: "", label: "Companies Built At" },
  ],
  openToWork: "Open to work",
  role: "Seeking Senior / Lead PM Roles",
  name: ["AKAR", "SHAN", "KUMAR"],
  title: "Senior Product Manager",
  location: "Bengaluru, India",
  tagline:
    "Product Manager with <strong>8 years experience</strong> driving <strong>30 Cr+ in annual revenue</strong> across consumer, health-tech, and D2C platforms. Proven track record in 0→1 and 1→100 product journeys across personalization, user experience, growth, and operations.",
  buttons: {
    resume: {
      label: "Download Resume",
      href: "https://drive.google.com/file/d/1yAEh4CRz0KLLDPQs4FtfIUPB4fBWnLWq/view?usp=sharing",
    },
    work: { label: "View My Work", href: "#work" },
  },
} as const;

export const ABOUT = {
  kicker: "— About",
  heading: ["BUILDING", "PRODUCTS", "THAT", "MATTER."],
  paragraphs: [
    "I'm a PM at <strong>SugarFit</strong> — leading product & analytics for Type 2 diabetes, GLP, and Active Foods D2C. Before this, I spent 3 years at <strong>Glance (InMobi Group)</strong> owning Content Experience & Serving for GlanceTV, driving the NFL launch on Google NAB, and leading GDPR readiness for EU launch.",
    "From <strong>Razorpay</strong> to <strong>Vedantu</strong> to <strong>Wipro</strong> — I've driven cross-functional impact across payments, edtech, and global operations.",
    "My unfair advantage: <strong>8 years across consumer, health-tech, and D2C</strong> with a proven track record of driving 30 Cr+ in annual revenue, shipping 0→1 products, and scaling 1→100.",
  ],
  currently: {
    label: "Currently building",
    text: "<strong>GLP, Active Foods D2C & Product Analytics</strong> at SugarFit.",
    sub: "Scaling AOV by 7% via upsell/cross-sell, reducing RTO by 25%, and improving NPS from 35→52.",
  },
  kpis: [
    { value: "30", unit: "Cr+", label: "Annual revenue driven across products" },
    { value: "$1.4", unit: "M", label: "ARR generated via 110M lockscreen impressions" },
    { value: "12", unit: "M", label: "Impressions on nationwide brand campaigns" },
    { value: "8", unit: "yr", label: "Cross-functional product experience" },
  ],
} as const;

export const SKILLS = {
  kicker: "— Skills",
  title: ["WHAT I", "BRING"],
  groups: [
    {
      title: "Product",
      subtitle: "Strategy & execution",
      items: [
        "User & Market Research",
        "Feature Prioritisation",
        "Road-mapping",
        "Stakeholder Management",
        "A/B Testing",
        "Experimentation",
        "Data-driven Development",
      ],
    },
    {
      title: "Data",
      subtitle: "My unfair advantage",
      items: [
        "SQL",
        "Web (Clickstream) Analytics",
        "Product & Data Analytics",
        "Visualization & Story Telling",
        "ETL",
      ],
    },
    {
      title: "Design",
      subtitle: "Pixel-perfect craft",
      items: ["FigmaMake", "Prototyping", "Wireframing", "Napkin.ai"],
    },
    {
      title: "Tools",
      subtitle: "The full stack",
      items: [
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
      ],
    },
  ],
} as const;

export const EXPERIENCE = {
  kicker: "— Experience",
  title: ["WHERE I'VE", "BUILT"],
  entries: [
    {
      period: "May 2025 — Present",
      company: "SugarFit",
      location: "Bengaluru",
      role: "Senior Product Manager",
      points: [
        "Leading product & analytics for Type 2 diabetes, GLP, and Active Foods D2C as primary SPOC for investors",
        "Scaled Active Foods D2C to 40L/month, improving AOV by 7% through upsell/cross-sell, reducing RTO by 25%",
        "Improved NPS from 35→52, reducing crash replacement from 20% to 6% (saving 3.2Cr YoY)",
        "Launched & scaled GLP-1 app to 50L MRR with 35% renewal rate, owning end-to-end app experience",
        "Revamped T2D renewals using VOC insights, driving 20% improvement and 17–20L MoM revenue uplift",
      ],
    },
    {
      period: "May 2022 — May 2025",
      company: "Glance (InMobi Group)",
      location: "Bengaluru",
      role: "Product Manager",
      points: [
        "Owned Content Experience & Serving for GlanceTV, partnering with DS, Engg, Design & Content",
        "Led market research & cross-functional execution to launch the NFL experience for Google NAB",
        "Drove GDPR readiness for EU launch — CMP integration, privacy disclosures, DSR workflows on 2.5M Airtel Xstream devices",
        "Generated $1.4M ARR by unlocking 110M lockscreen impressions via Tracfone Telco Partner, serving 5M users",
        "Launched GlanceTV's first nationwide brand campaign (Lakme, Women's Day) — 12M impressions, 470K reach, 64% higher ad recall",
      ],
    },
    {
      period: "Jul 2021 — Sep 2021",
      company: "Razorpay",
      location: "Bengaluru",
      role: "Senior Product Analyst",
      points: [
        "Drove +30% sign-ups and +23% MTU via homepage signup funnel & activation process redesign",
        'Awarded "Ace in the Race" for outstanding execution in data instrumentation & dashboards for GST, OCR & merchant verification',
      ],
    },
    {
      period: "Jan 2021 — Jul 2021",
      company: "Vedantu Innovations",
      location: "Bengaluru",
      role: "Senior Product Analyst",
      points: [
        'Drove +800 daily inbound leads by experimenting & optimising the "Book Online Demo" funnel across web and mobile',
        "Improved Micro-Concept video retention by +17% & revenue by 7L MoM; +4.3% MoM revenue via demo feedback analysis",
      ],
    },
    {
      period: "Aug 2017 — Jan 2021",
      company: "Wipro Analytics",
      location: "Bengaluru",
      role: "Senior Analyst",
      points: [
        "Led cross-functional data initiatives supporting Uber GSS operations across 64 languages with Product, Ops & Marketing",
        "Saved $XXXK by optimizing Uber Eats' language portfolio via cost-per-language analysis and Localisation vendor SLA",
        "Clients at Wipro included Lloyds Banking Group & CapitalOne",
      ],
    },
  ],
} as const;

export const WORK = {
  kicker: "— Projects",
  title: ["DECISIONS,", "NOT FEATURES"],
} as const;

export const TESTIMONIALS_HEADER = {
  kicker: "— Testimonials",
  title: ["WHAT TEAMMATES", "SAY"],
} as const;

export const HOBBIES = {
  kicker: "— Hobbies",
  title: ["WHEN I'M", "NOT", "SHIPPING"],
  items: [
    {
      label: "Passion",
      title: "Anime",
      text: "Big fan of layered storytelling — the kind where every detail from episode 1 pays off in the finale. AoT, Vinland Saga, FMA, and JJK are my benchmarks for what great narrative looks like.",
      tag: "Currently watching",
    },
    {
      label: "Creative",
      title: "Sketching",
      text: "I sketch to think — on notebooks, sticky notes, whatever's nearby. It's how I get ideas out of my head before they disappear. Mostly rough wireframes and random diagrams.",
      tag: "Product flows",
    },
    {
      label: "Sport",
      title: "Table Tennis",
      text: "Been playing TT for years — it's the one sport where I genuinely enjoy losing because it means I'm playing someone better. Best stress relief I've found so far.",
      tag: "Competitive player",
    },
    {
      label: "At home",
      title: "Cooking",
      text: "I cook mostly Indian and continental. Weekends I'll try something new — sometimes it's great, sometimes it's a disaster. The kitchen is the one place I'm happy either way.",
      tag: "Weekend chef",
    },
    {
      label: "Explorer",
      title: "Travel",
      text: "Love the feeling of landing somewhere new and figuring it out. No rigid itineraries — just a list of things worth seeing and room for whatever happens in between.",
      tag: "Always planning next",
    },
    {
      label: "Visual",
      title: "Photography",
      text: "Street and travel photography on my phone mostly. Chasing light, interesting faces, and scenes that tell a story without a caption.",
      tag: "Street & travel",
    },
  ],
} as const;

export const ANIME_PICKS = {
  label: "Currently watching / all-time favourites",
  picks: [
    ["Attack on Titan", "Action · Strategy"],
    ["Demon Slayer", "Action · Visual Art"],
    ["Death Note", "Psychological · Thriller"],
    ["Fullmetal Alchemist", "Adventure · Deep"],
    ["Jujutsu Kaisen", "Action · Current"],
    ["One Punch Man", "Comedy · Power"],
    ["Vinland Saga", "Historical · Epic"],
    ["Haikyuu!!", "Sports · Motivation"],
  ],
} as const;

export const CONTACT = {
  kicker: "— Thanks for stopping by —",
  closing: ["LET'S", "BUILD", "SOMETHING", "IMPACTFUL"],
  text: "Open to <strong>senior PM roles</strong> in health tech, consumer, or fintech. Data fluency, clinical context, ability to ship — fast.",
  linkedin: { label: "CONNECT ON LINKEDIN.", href: "https://linkedin.com/in/akarshan910" },
  resume: {
    label: "Download CV",
    href: "https://drive.google.com/file/d/1yAEh4CRz0KLLDPQs4FtfIUPB4fBWnLWq/view?usp=sharing",
  },
  email: { label: "Email me →", href: "mailto:akarshan910@gmail.com" },
} as const;

export const FOOTER = "VIBE CODED WITH ♥ IN BENGALURU";
