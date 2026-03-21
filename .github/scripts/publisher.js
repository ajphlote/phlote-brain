const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CHANNELS = ['twitter', 'linkedin', 'substack', 'instagram', 'tiktok'];
const CHANNEL_INSTRUCTIONS = {
  twitter: "Format as a Twitter post. Tightest version. Strong opening. 4-8 lines. No hashtags. No emojis.",
  linkedin: "Format as a LinkedIn post. One level deeper. 3-6 short paragraphs. End on an observation.",
  substack: "Format as a Substack field note. Let it breathe. Like a founder journal entry made public.",
  instagram: "Format as an Instagram caption. Punchy. One idea. Short.",
  tiktok: "Format as a TikTok script. Hook first. Conversational. 30-60 seconds spoken."
};
async function loadVoiceGuide() {
  try {
    const voice = fs.readFileSync('learning/style/aj_voice.md', 'utf8');
    const rules = fs.readFileSync('learning/style/prompt_rules.md', 'utf8');
    return voice + "\n\n---\n\n" + rules;
  } catch (e) {
    return "Direct, casual, professional voice. Short sentences. White space. Ideas feel obvious.";
  }
}
async function generateForChannel(source, channel, voiceGuide) {
  const sys = "You format content for AJ, founder of Phlote.\n\nVOICE:\n" + voiceGuide + "\n\nCHANNEL: " + channel + "\n" + CHANNEL_INSTRUCTIONS[channel] + "\n\nReturn only the post. No sign-off. Nothing AJ did not say.";
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: sys,
    messages: [{ role: "user", content: "Format for " + channel + ":\n\n" + source }]
  });
  return response.content[0].text;
}
async function postToTwitter(content) {
  if (!process.env.TWITTER_API_KEY) return;
  try {
    const { TwitterApi } = require('twitter-api-v2');
    const t = new TwitterApi({ appKey: process.env.TWITTER_API_KEY, appSecret: process.env.TWITTER_API_SECRET, accessToken: process.env.TWITTER_ACCESS_TOKEN, accessSecret: process.env.TWITTER_ACCESS_SECRET });
    await t.v2.tweet(content);
    console.log("Posted to Twitter");
  } catch (err) { console.error("Twitter failed:", err.message); }
}
async function main() {
  const files = (process.argv[2] || "").split(",").filter(f => f.includes("publish/queue/"));
  if (!files.length) { console.log("No files."); return; }
  const voiceGuide = await loadVoiceGuide();
  for (const file of files) {
    const trimmed = file.trim();
    if (!trimmed || !fs.existsSync(trimmed)) continue;
    const source = fs.readFileSync(trimmed, "utf8");
    const basename = path.basename(trimmed);
    console.log("Processing: " + basename);
    for (const channel of CHANNELS) {
      const content = await generateForChannel(source, channel, voiceGuide);
      fs.writeFileSync("publish/" + channel + "/" + basename, content);
      console.log("Drafted: " + channel);
    }
    if (process.env.TWITTER_API_KEY) {
      await postToTwitter(fs.readFileSync("publish/twitter/" + basename, "utf8"));
    }
    fs.copyFileSync(trimmed, "publish/archive/" + basename);
    fs.unlinkSync(trimmed);
    console.log("Archived.");
  }
}
main().catch(console.error);
