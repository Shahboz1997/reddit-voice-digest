import type { DigestEpisode } from "@/lib/types";
import { CHOCOLATE_PROCESS_TEXT, IELTS_OPENER_TEXT, TTS_PRESETS } from "@/lib/tts-presets";

export const demoEpisodes: DigestEpisode[] = [
  {
    id: "episode-2026-06-17",
    slug: "cocoa-bean-to-chocolate-process",
    title: "From Cocoa Bean to Chocolate",
    summary:
      "A step-by-step audio walkthrough of the process diagram: fermentation, roasting, grinding, pressing, conching, and tempering.",
    introText:
      "Follow the full transformation from harvested cocoa pods to a glossy chocolate bar — each stage explained in order.",
    transcriptText: CHOCOLATE_PROCESS_TEXT,
    publishedAt: "2026-06-17T07:15:00.000Z",
    durationSeconds: TTS_PRESETS["chocolate-process"].estimatedDurationSeconds,
    durationLabel: "2 min",
    audioUrl: "/api/tts?preset=chocolate-process",
    topics: ["food", "manufacturing", "process-diagram"],
    keyThoughts: [
      "Fermentation develops flavor precursors that roasting later unlocks.",
      "Grinding turns nibs into cocoa liquor — the base for both powder and bars.",
      "Tempering gives chocolate its snap, shine, and stable shelf life.",
    ],
    chapters: [
      {
        id: "chapter-cocoa-1",
        label: "Harvest & fermentation",
        startSeconds: 0,
        endSeconds: 22,
        summary: "Pods are opened, beans ferment to develop flavor and reduce bitterness.",
      },
      {
        id: "chapter-cocoa-2",
        label: "Drying & roasting",
        startSeconds: 22,
        endSeconds: 40,
        summary: "Beans are dried, then roasted to deepen aroma via the Maillard reaction.",
      },
      {
        id: "chapter-cocoa-3",
        label: "Cracking & grinding",
        startSeconds: 40,
        endSeconds: 58,
        summary: "Shells are winnowed away; nibs are ground into cocoa liquor.",
      },
      {
        id: "chapter-cocoa-4",
        label: "Pressing",
        startSeconds: 58,
        endSeconds: 70,
        summary: "Liquor is pressed into cocoa butter and cocoa powder.",
      },
      {
        id: "chapter-cocoa-5",
        label: "Conching",
        startSeconds: 70,
        endSeconds: 82,
        summary: "Liquor is blended with sugar and conched for smooth texture.",
      },
      {
        id: "chapter-cocoa-6",
        label: "Tempering & molding",
        startSeconds: 82,
        endSeconds: TTS_PRESETS["chocolate-process"].estimatedDurationSeconds,
        summary: "Tempered chocolate is molded, cooled, and wrapped into bars.",
      },
    ],
    items: [
      {
        id: "item-cocoa-1",
        threadTitle: "Harvest & fermentation",
        subredditName: "foodscience",
        whyItMatters:
          "Fermentation is where flavor precursors form — skipping it leaves beans bitter and flat.",
        summary:
          "Ripe pods are harvested, beans are extracted with pulp, and natural fermentation develops the flavors roasting will later release.",
        keyTakeaways: [
          "Fermentation reduces bitterness.",
          "Yeasts and bacteria break down pulp.",
          "Flavor precursors develop before roasting.",
        ],
        tldrPoints: [
          "Beans leave the pod surrounded by sweet pulp.",
          "Fermentation lasts several days.",
          "Without it, chocolate tastes harsh.",
        ],
        startSeconds: 0,
        endSeconds: 22,
        redditThreadUrl: "https://www.reddit.com/r/foodscience/",
        redditCommentUrl: "https://www.reddit.com/r/foodscience/",
        commentCtaLabel: "Open r/foodscience",
      },
      {
        id: "item-cocoa-2",
        threadTitle: "Drying & roasting",
        subredditName: "foodscience",
        whyItMatters:
          "Roasting unlocks chocolate aroma and color after moisture is removed during drying.",
        summary:
          "Fermented beans are dried to low moisture, then roasted at controlled heat to trigger Maillard browning and deepen flavor.",
        keyTakeaways: [
          "Drying prevents mold during storage.",
          "Roasting develops characteristic aroma.",
          "Temperature control shapes flavor profile.",
        ],
        tldrPoints: [
          "Sun or mechanical drying follows fermentation.",
          "Roasting drives off remaining water.",
          "Maillard reaction deepens chocolate notes.",
        ],
        startSeconds: 22,
        endSeconds: 40,
        redditThreadUrl: "https://www.reddit.com/r/foodscience/",
        redditCommentUrl: "https://www.reddit.com/r/foodscience/",
        commentCtaLabel: "Open r/foodscience",
      },
      {
        id: "item-cocoa-3",
        threadTitle: "Cracking, winnowing & grinding",
        subredditName: "foodscience",
        whyItMatters:
          "Grinding converts solid nibs into cocoa liquor — the foundation for both powder and bars.",
        summary:
          "Roasted beans are cracked into nibs, shells are winnowed off, and rollers grind nibs until cocoa fat melts into liquor.",
        keyTakeaways: [
          "Nibs are the edible core of the bean.",
          "Winnowing separates light shells.",
          "Grinding friction melts cocoa butter in place.",
        ],
        tldrPoints: [
          "Cracking breaks roasted beans apart.",
          "Winnowing removes papery shells.",
          "Liquor is thick melted cocoa mass.",
        ],
        startSeconds: 40,
        endSeconds: 58,
        redditThreadUrl: "https://www.reddit.com/r/foodscience/",
        redditCommentUrl: "https://www.reddit.com/r/foodscience/",
        commentCtaLabel: "Open r/foodscience",
      },
      {
        id: "item-cocoa-4",
        threadTitle: "Pressing, conching & tempering",
        subredditName: "foodscience",
        whyItMatters:
          "Pressing, conching, and tempering determine texture, mouthfeel, and whether the bar snaps cleanly.",
        summary:
          "Liquor may be pressed into butter and powder; for bars it is conched with sugar, then tempered and molded.",
        keyTakeaways: [
          "Pressing yields cocoa butter and powder.",
          "Conching smooths and rounds flavor.",
          "Tempering creates gloss and a clean snap.",
        ],
        tldrPoints: [
          "Cocoa butter is pressed out of liquor.",
          "Conching kneads the mixture for hours.",
          "Tempered chocolate sets shiny and stable.",
        ],
        startSeconds: 58,
        endSeconds: TTS_PRESETS["chocolate-process"].estimatedDurationSeconds,
        redditThreadUrl: "https://www.reddit.com/r/foodscience/",
        redditCommentUrl: "https://www.reddit.com/r/foodscience/",
        commentCtaLabel: "Open r/foodscience",
      },
    ],
  },
  {
    id: "episode-2026-05-14",
    slug: "main-insights-from-reddit-2026-05-14",
    title: "IELTS Writing: Strong Openers",
    summary:
      "Why examiners tune out generic openers like \"in today's modern world\" — and how to lead with a Band 7+ claim instead.",
    introText:
      "A 30-second listen on Lexical Resource: drop the throat-clearing and state your actual claim first.",
    transcriptText: IELTS_OPENER_TEXT,
    publishedAt: "2026-05-14T07:15:00.000Z",
    durationSeconds: TTS_PRESETS["ielts-opener"].estimatedDurationSeconds,
    durationLabel: "30 sec",
    audioUrl: "/api/tts?preset=ielts-opener",
    topics: ["ielts", "writing", "lexical-resource"],
    keyThoughts: [
      "Examiners hear the same generic openers dozens of times per shift.",
      "They're scoring Lexical Resource from your first sentences.",
      "Specific openers signal Band 7+ thinking.",
    ],
    chapters: [
      {
        id: "chapter-1",
        label: "IELTS openers",
        startSeconds: 0,
        endSeconds: TTS_PRESETS["ielts-opener"].estimatedDurationSeconds,
        summary: IELTS_OPENER_TEXT,
      },
    ],
    items: [
      {
        id: "item-1",
        threadTitle: "Drop generic IELTS openers",
        subredditName: "IELTS",
        whyItMatters:
          "Examiners hear the same throat-clearing phrases dozens of times per shift — specific openers signal Band 7+ lexical range.",
        summary: IELTS_OPENER_TEXT,
        keyTakeaways: [
          "Avoid \"in today's modern world\" and similar fillers.",
          "Lead with your actual claim, not a warm-up sentence.",
          "Specific openers signal stronger Lexical Resource.",
        ],
        tldrPoints: [
          "Generic openers signal generic thinking to examiners.",
          "They're scoring Lexical Resource from your first sentences.",
          "Drop the throat-clearing; state the claim immediately.",
        ],
        startSeconds: 0,
        endSeconds: TTS_PRESETS["ielts-opener"].estimatedDurationSeconds,
        redditThreadUrl: "https://www.reddit.com/r/IELTS/",
        redditCommentUrl: "https://www.reddit.com/r/IELTS/",
        commentCtaLabel: "Open r/IELTS",
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
