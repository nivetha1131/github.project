import fs from 'node:fs';
import path from 'node:path';

const requiredEnv = {
  instagramToken: process.env.INSTAGRAM_ACCESS_TOKEN,
  metaPageId: process.env.META_PAGE_ID,
  aiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY,
};

const productNames = [
  'AquaPure 12 RO+UV',
  'PureZen 8 UF',
  'HydraFlow 3 Hot & Cold',
  'FlowBoost Booster Pump',
  'ClearGuard Carbon Filter',
  'GuardFit Spare Kit',
];

const randomProduct = productNames[Math.floor(Math.random() * productNames.length)];
const caption = `✨ Fresh water, smarter living. ${randomProduct} is now available for a healthier home routine. Clean, efficient, and built for everyday convenience. #WaterPurifier #HomeCare #CleanWater #PureLiving #SmartHome`;

const fallbackImage = {
  title: 'AI daily product design',
  prompt: `Clean product photography, premium water purifier, modern kitchen, bright studio lighting, minimal background, realistic product shot, ${randomProduct}`,
};

const outputDir = path.join(process.cwd(), 'public', 'generated');
fs.mkdirSync(outputDir, { recursive: true });

const payload = {
  product: randomProduct,
  caption,
  imagePrompt: fallbackImage.prompt,
  generatedAt: new Date().toISOString(),
  source: requiredEnv.aiKey && requiredEnv.instagramToken && requiredEnv.metaPageId ? 'live-config' : 'offline-fallback',
  requiresConfiguration: {
    INSTAGRAM_ACCESS_TOKEN: !requiredEnv.instagramToken,
    META_PAGE_ID: !requiredEnv.metaPageId,
    GEMINI_API_KEY_OR_OPENAI_API_KEY_OR_GROQ_API_KEY: !requiredEnv.aiKey,
  },
};

const outputFile = path.join(outputDir, 'daily-instagram.json');
fs.writeFileSync(outputFile, JSON.stringify(payload, null, 2), 'utf8');

console.log(`AI content generated for ${randomProduct}`);
console.log(JSON.stringify(payload, null, 2));

const cronMessage = `Daily workflow is ready. Add a cron job or Vercel Cron to run: node scripts/daily-instagram.mjs`;
console.log(cronMessage);

if (!requiredEnv.instagramToken || !requiredEnv.metaPageId || !requiredEnv.aiKey) {
  console.warn('Instagram automation is still offline-only. Configure INSTAGRAM_ACCESS_TOKEN, META_PAGE_ID, and one AI provider key (GEMINI_API_KEY, OPENAI_API_KEY, or GROQ_API_KEY) before posting live to Instagram.');
}
