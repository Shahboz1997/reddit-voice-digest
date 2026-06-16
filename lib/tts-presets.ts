export const IELTS_OPENER_TEXT = [
  `Examiners read "in today's modern world" approximately 40 times per shift.`,
  `They're not impressed — they're already drafting your Lexical Resource score before sentence two.`,
  `Generic openers signal generic thinking. Specific ones signal Band 7+.`,
  `Swipe the formula: drop the throat-clearing, lead with the actual claim.`,
].join(" ");

export const CHOCOLATE_PROCESS_TEXT = [
  `This process diagram traces how cocoa beans become finished chocolate through seven linked stages.`,
  `First, farmers harvest ripe cocoa pods and extract the beans, still coated in sweet pulp.`,
  `The beans ferment for several days while natural yeasts and bacteria break down the pulp, develop flavor precursors, and reduce bitterness.`,
  `Without fermentation, chocolate would taste harsh and one-dimensional.`,
  `Next, the fermented beans are sun-dried or mechanically dried until moisture falls sharply.`,
  `Dry beans are roasted at controlled temperatures, deepening color, driving off remaining water, and unlocking chocolate aroma through the Maillard reaction.`,
  `Roasted beans are cracked into nibs, then winnowed to remove the lightweight shells.`,
  `The nibs are ground under heavy rollers; friction melts the cocoa fat into a thick fluid called cocoa liquor, though it contains no alcohol.`,
  `To separate components, the liquor can be pressed: high pressure squeezes out golden cocoa butter, leaving a hard cake that is ground into cocoa powder.`,
  `For eating chocolate, cocoa liquor is blended with sugar, extra cocoa butter, and milk powder for milk chocolate.`,
  `This mixture is conched — kneaded and aerated at warmth for hours or days — smoothing texture and rounding harsh flavors.`,
  `Finally, the chocolate is tempered: cooled and warmed in a precise cycle so cocoa butter crystals form in a stable structure.`,
  `Tempered chocolate sets with a glossy surface and a clean snap, is molded, cooled, wrapped, and packed — completing the journey from bean to bar.`,
].join(" ");

export const TTS_PRESETS = {
  "ielts-opener": {
    title: "IELTS openers",
    text: IELTS_OPENER_TEXT,
    /** Rough duration until MP3 is generated; updated after first render. */
    estimatedDurationSeconds: 28,
  },
  "chocolate-process": {
    title: "Cocoa bean to chocolate",
    text: CHOCOLATE_PROCESS_TEXT,
    estimatedDurationSeconds: 95,
  },
} as const;

export type TtsPresetId = keyof typeof TTS_PRESETS;
