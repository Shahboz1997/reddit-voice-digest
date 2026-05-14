import type { DigestEpisode } from "@/lib/types";

export const demoEpisodes: DigestEpisode[] = [
  {
    id: "episode-2026-05-14",
    slug: "main-insights-from-reddit-2026-05-14",
    title: "The Best Of Reddit For May 14",
    summary:
      "A five-minute digest of the strongest ideas from massive Reddit threads on focus, emergency funds, and startup validation.",
    introText:
      "Three huge Reddit discussions, reduced to one short listen you can finish before the next meeting starts.",
    transcriptText:
      "Welcome to Reddit Voice Digest. Today we are pulling signal from three massive Reddit threads. First, a productivity discussion about reducing context switching. The comments with the highest agreement pushed people toward batching communication, protecting ninety-minute focus blocks, and ending the day by writing tomorrow's first task. Second, a personal finance conversation on emergency funds. Most of the practical advice centered on keeping three to six months in cash, then expanding that target when income is unstable or fixed obligations are high. Third, an entrepreneurship thread on early founder mistakes. The most repeated lesson was to sell before you build and talk to customers before you automate anything. Across all three discussions, the pattern is clear. Reduce noise, choose fewer priorities, and pick actions that reveal useful information fast.",
    publishedAt: "2026-05-14T07:15:00.000Z",
    durationSeconds: 300,
    durationLabel: "5 min",
    audioUrl: "",
    topics: ["finance", "productivity", "startups"],
    keyThoughts: [
      "Protect focus windows before adding another productivity system.",
      "Emergency funds depend on income stability more than generic advice.",
      "Revenue beats assumptions when validating a product.",
    ],
    chapters: [
      {
        id: "chapter-1",
        label: "Productivity systems",
        startSeconds: 0,
        endSeconds: 92,
        summary: "How people reduce context switching and keep workdays from fragmenting.",
      },
      {
        id: "chapter-2",
        label: "Emergency funds",
        startSeconds: 92,
        endSeconds: 188,
        summary: "Why emergency fund targets expand or shrink depending on risk and obligations.",
      },
      {
        id: "chapter-3",
        label: "Startup mistakes",
        startSeconds: 188,
        endSeconds: 300,
        summary: "Why founders regret building early and selling late.",
      },
    ],
    items: [
      {
        id: "item-1",
        threadTitle: "What habit saved you the most time at work?",
        subredditName: "productivity",
        whyItMatters:
          "The thread distilled practical anti-burnout systems instead of generic motivation advice.",
        summary:
          "The highest-value comments recommended batching meetings, muting low-priority notifications, and ending the day by writing the next morning's first task.",
        keyTakeaways: [
          "Protect 90-minute focus blocks.",
          "Move chat and email into fixed windows.",
          "Leave yourself a low-friction start for tomorrow.",
        ],
        tldrPoints: [
          "Time savings came from fewer context switches, not from working faster.",
          "People got better results by batching communication into fixed windows.",
          "A shutdown ritual made the next morning easier to start.",
        ],
        startSeconds: 0,
        endSeconds: 92,
        redditThreadUrl:
          "https://www.reddit.com/r/productivity/comments/1abcde1/what_habit_saved_you_the_most_time_at_work/",
        redditCommentUrl:
          "https://www.reddit.com/r/productivity/comments/1abcde1/what_habit_saved_you_the_most_time_at_work/klm1234/",
        commentCtaLabel: "Open the top comment",
      },
      {
        id: "item-2",
        threadTitle: "How large should an emergency fund be in 2026?",
        subredditName: "personalfinance",
        whyItMatters:
          "This discussion contained grounded examples from people with different income stability and family setups.",
        summary:
          "Commenters converged on three to six months of runway, then adjusted upward for freelancers, homeowners, and single-income households.",
        keyTakeaways: [
          "Stability matters more than one universal number.",
          "Insurance and debt obligations change the target.",
          "Keep the fund liquid and boring.",
        ],
        tldrPoints: [
          "Three to six months was the common baseline.",
          "Freelancers and single-income households aimed higher.",
          "People warned against tying emergency cash up in volatile assets.",
        ],
        startSeconds: 92,
        endSeconds: 188,
        redditThreadUrl:
          "https://www.reddit.com/r/personalfinance/comments/1bcdef2/how_large_should_an_emergency_fund_be_in_2026/",
        redditCommentUrl:
          "https://www.reddit.com/r/personalfinance/comments/1bcdef2/how_large_should_an_emergency_fund_be_in_2026/knp5678/",
        commentCtaLabel: "See the most useful example",
      },
      {
        id: "item-3",
        threadTitle: "What early mistake cost you months in your startup?",
        subredditName: "entrepreneur",
        whyItMatters:
          "It highlights repeated founder mistakes that can be converted into a startup checklist.",
        summary:
          "People regretted building too much before getting proof of demand. The strongest advice was to sell manually first, then automate.",
        keyTakeaways: [
          "Customer interviews beat assumptions.",
          "Revenue is the clearest validation signal.",
          "Delay complexity until it becomes necessary.",
        ],
        tldrPoints: [
          "Founders regretted building too much before talking to buyers.",
          "Manual selling surfaced demand faster than new features did.",
          "Automation helped only after the offer was proven.",
        ],
        startSeconds: 188,
        endSeconds: 300,
        redditThreadUrl:
          "https://www.reddit.com/r/entrepreneur/comments/1cdefg3/what_early_mistake_cost_you_months_in_your_startup/",
        redditCommentUrl:
          "https://www.reddit.com/r/entrepreneur/comments/1cdefg3/what_early_mistake_cost_you_months_in_your_startup/kqr9012/",
        commentCtaLabel: "Jump to the founder reply",
      },
    ],
  },
  {
    id: "episode-2026-05-13",
    slug: "main-insights-from-reddit-2026-05-13",
    title: "The Best Of Reddit For May 13",
    summary:
      "A short audio brief on health systems, career leverage, and AI tools that actually saved time.",
    introText:
      "A cleaner daily brief for people who want the point of the thread, not all five hundred comments.",
    transcriptText:
      "Today's digest covers routines that make exercise stick, career moves that create leverage over time, and where AI tools really saved time instead of adding overhead.",
    publishedAt: "2026-05-13T07:15:00.000Z",
    durationSeconds: 300,
    durationLabel: "5 min",
    audioUrl: "",
    topics: ["health", "careers", "ai"],
    keyThoughts: [
      "Consistency systems beat motivation spikes in health threads.",
      "Career leverage came from writing, systems, and relationship equity.",
      "AI tools only worked when tightly scoped to repetitive tasks.",
    ],
    chapters: [
      {
        id: "chapter-4",
        label: "Health routines",
        startSeconds: 0,
        endSeconds: 100,
        summary: "What made people stick to workouts and sleep routines long-term.",
      },
      {
        id: "chapter-5",
        label: "Career leverage",
        startSeconds: 100,
        endSeconds: 205,
        summary: "Where professionals built leverage that kept compounding.",
      },
      {
        id: "chapter-6",
        label: "AI workflows",
        startSeconds: 205,
        endSeconds: 300,
        summary: "Which AI automations worked in practice and which ones wasted time.",
      },
    ],
    items: [
      {
        id: "item-4",
        threadTitle: "What made fitness finally sustainable for you?",
        subredditName: "health",
        whyItMatters:
          "The best comments were about reducing friction instead of waiting for motivation.",
        summary:
          "People stuck to routines when the default option became the healthy one: fixed workout times, easy meal prep, and sleep cues.",
        keyTakeaways: [
          "Consistency wins over intensity spikes.",
          "Reduce setup friction wherever possible.",
          "Link routines to existing cues.",
        ],
        tldrPoints: [
          "Lowering friction mattered more than finding the perfect plan.",
          "Sleep and meal prep made workouts easier to repeat.",
          "People kept routines when they attached them to existing habits.",
        ],
        startSeconds: 0,
        endSeconds: 100,
        redditThreadUrl:
          "https://www.reddit.com/r/health/comments/1defgh4/what_made_fitness_finally_sustainable_for_you/",
        redditCommentUrl:
          "https://www.reddit.com/r/health/comments/1defgh4/what_made_fitness_finally_sustainable_for_you/ksa4411/",
        commentCtaLabel: "Open the habit stack idea",
      },
      {
        id: "item-5",
        threadTitle: "What created the most career leverage for you?",
        subredditName: "technology",
        whyItMatters:
          "Instead of generic career advice, the thread surfaced compounding moves with examples.",
        summary:
          "Writing, public artifacts, and system knowledge created leverage because they kept paying off after the work was done once.",
        keyTakeaways: [
          "Public proof compounds.",
          "Reusable systems outperform one-off effort.",
          "Relationships create hidden leverage.",
        ],
        tldrPoints: [
          "Strong comments emphasized proof of work over credentials alone.",
          "Documentation and systems made people more scalable at work.",
          "Career upside often came from trust built over time.",
        ],
        startSeconds: 100,
        endSeconds: 205,
        redditThreadUrl:
          "https://www.reddit.com/r/technology/comments/1efghi5/what_created_the_most_career_leverage_for_you/",
        redditCommentUrl:
          "https://www.reddit.com/r/technology/comments/1efghi5/what_created_the_most_career_leverage_for_you/ktb5522/",
        commentCtaLabel: "Read the proof-of-work comment",
      },
      {
        id: "item-6",
        threadTitle: "Which AI automations actually saved you time?",
        subredditName: "Futurology",
        whyItMatters:
          "This thread separated shiny demos from the boring automations that really shipped value.",
        summary:
          "The strongest answers used AI for repetitive summaries, extraction, and drafting, but avoided high-stakes tasks without review.",
        keyTakeaways: [
          "Scope tools to repetitive workflows.",
          "Keep human review on important outputs.",
          "Measure time saved, not novelty.",
        ],
        tldrPoints: [
          "The best AI uses were narrow and repeatable.",
          "Teams got value from summarization and extraction more than from full autonomy.",
          "Review loops stayed necessary on anything customer-facing.",
        ],
        startSeconds: 205,
        endSeconds: 300,
        redditThreadUrl:
          "https://www.reddit.com/r/Futurology/comments/1fghij6/which_ai_automations_actually_saved_you_time/",
        redditCommentUrl:
          "https://www.reddit.com/r/Futurology/comments/1fghij6/which_ai_automations_actually_saved_you_time/kuc6633/",
        commentCtaLabel: "See the workflow breakdown",
      },
    ],
  },
  {
    id: "episode-2026-05-12",
    slug: "main-insights-from-reddit-2026-05-12",
    title: "The Best Of Reddit For May 12",
    summary:
      "An audio brief focused on investing psychology, solo founder execution, and staying consistent with learning.",
    introText:
      "When a thread is long but full of signal, this is the short version worth keeping.",
    transcriptText:
      "This episode covered investor mistakes caused by emotions, how solo founders avoid context collapse, and how people build learning systems that survive busy weeks.",
    publishedAt: "2026-05-12T07:15:00.000Z",
    durationSeconds: 300,
    durationLabel: "5 min",
    audioUrl: "",
    topics: ["investing", "founders", "learning"],
    keyThoughts: [
      "The strongest investing advice was mostly emotional, not technical.",
      "Solo founders stayed effective by reducing simultaneous projects.",
      "Learning systems survived when they were small enough to repeat.",
    ],
    chapters: [
      {
        id: "chapter-7",
        label: "Investor psychology",
        startSeconds: 0,
        endSeconds: 98,
        summary: "Why emotional control mattered more than finding the next perfect pick.",
      },
      {
        id: "chapter-8",
        label: "Solo founder execution",
        startSeconds: 98,
        endSeconds: 204,
        summary: "How founders avoided wasting time by keeping scope painfully small.",
      },
      {
        id: "chapter-9",
        label: "Learning systems",
        startSeconds: 204,
        endSeconds: 300,
        summary: "How people stayed consistent with reading and skill-building on busy schedules.",
      },
    ],
    items: [
      {
        id: "item-7",
        threadTitle: "What investing mistake did you stop repeating?",
        subredditName: "investing",
        whyItMatters:
          "The comments exposed emotional mistakes that keep showing up in every market cycle.",
        summary:
          "People improved results by reducing reactive trades, narrowing their strategy, and accepting boredom as part of the process.",
        keyTakeaways: [
          "A narrower process beats constant reacting.",
          "Boredom is often a sign of discipline.",
          "Emotions create more mistakes than spreadsheets do.",
        ],
        tldrPoints: [
          "Frequent reacting was the repeated regret.",
          "Investors performed better when they followed fewer rules consistently.",
          "Many top comments equated patience with edge.",
        ],
        startSeconds: 0,
        endSeconds: 98,
        redditThreadUrl:
          "https://www.reddit.com/r/investing/comments/1ghijk7/what_investing_mistake_did_you_stop_repeating/",
        redditCommentUrl:
          "https://www.reddit.com/r/investing/comments/1ghijk7/what_investing_mistake_did_you_stop_repeating/kvd7744/",
        commentCtaLabel: "Jump to the discipline comment",
      },
      {
        id: "item-8",
        threadTitle: "How do solo founders keep from doing too much at once?",
        subredditName: "entrepreneur",
        whyItMatters:
          "The thread condensed years of painful lessons about focus and sequencing.",
        summary:
          "The best responses cut scope aggressively, shipped one revenue-critical task at a time, and used customer calls to prioritize.",
        keyTakeaways: [
          "One bottleneck matters more than ten side ideas.",
          "Revenue tasks come before polish.",
          "Customer calls help kill distractions.",
        ],
        tldrPoints: [
          "The best founders treated scope as the main risk to execution.",
          "Most useful systems were simple weekly priorities, not elaborate dashboards.",
          "People used customer feedback to keep focus honest.",
        ],
        startSeconds: 98,
        endSeconds: 204,
        redditThreadUrl:
          "https://www.reddit.com/r/entrepreneur/comments/1hijkl8/how_do_solo_founders_keep_from_doing_too_much/",
        redditCommentUrl:
          "https://www.reddit.com/r/entrepreneur/comments/1hijkl8/how_do_solo_founders_keep_from_doing_too_much/kwf8855/",
        commentCtaLabel: "Open the one-bottleneck answer",
      },
      {
        id: "item-9",
        threadTitle: "What learning system survives a busy schedule?",
        subredditName: "productivity",
        whyItMatters:
          "The thread was unusually concrete about what people continued doing after motivation faded.",
        summary:
          "Short, repeatable sessions worked best. People who learned consistently kept the bar low and removed startup friction.",
        keyTakeaways: [
          "Make the unit of learning small.",
          "Track consistency before depth.",
          "Keep materials ready in advance.",
        ],
        tldrPoints: [
          "Small sessions beat ambitious plans that collapse after one week.",
          "Prepared materials removed decision fatigue.",
          "Consistency came from low-friction defaults.",
        ],
        startSeconds: 204,
        endSeconds: 300,
        redditThreadUrl:
          "https://www.reddit.com/r/productivity/comments/1ijklm9/what_learning_system_survives_a_busy_schedule/",
        redditCommentUrl:
          "https://www.reddit.com/r/productivity/comments/1ijklm9/what_learning_system_survives_a_busy_schedule/kxg9966/",
        commentCtaLabel: "Read the low-friction setup",
      },
    ],
  },
];
