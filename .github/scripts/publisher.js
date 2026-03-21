const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CHANNELS = ['twitter', 'linkedin', 'substack', 'instagram', 'tiktok'];

const CHANNEL_INSTRUCTIONS = {
  twitter: `Format as a Twitter post. Tightest version of the idea. Strong opening line. 4-8 lines max. No hashtags. No emojis.`,
  linkedin: `Format as a LinkedIn post. Same voice, one level deeper. 3-6 short paragraphs. End on a real observation, not a CTA.`,
  substack: `Format
cat > .github/scripts/publisher.js << 'EOF'"
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CHANNELS = ['twitter', 'linkedin', 'substack', 'instagram', 'tiktok'];

const CHANNEL_INSTRUCTIONS = {
  twitter: `Format as a Twitter post. Tightest version of the idea. Strong opening line. 4-8 lines max. No hashtags. No emojis.`,
  linkedin: `Format as a LinkedIn post. Same voice, one level deeper. 3-6 short paragraphs. End on a real observation, not a CTA.`,
  substack: `Format as a Substack field note. Let it breathe. Document the thinking behind the thesis. Like a founder's journal entry made public.`,
  instagram: `Format as an Instagram caption. Punchy. One idea. Short. Visual-first.`,
  tiktok: `Format as a TikTok spoken script. Hook in first line. Conversational rhythm. 30-60 seconds when spoken.`
};

async function loadVoiceGuide() {
  try {
    const voice = fs.readFileSync('learning/style/aj_voice.md', 'utf8');
    const rules = fs.readFileSync('learning/style/prompt_rules.md', 'utf8');
    return `${voice}\n\n---\n\n${rules}`;
  } catch {
    return 'Write in a direct, casual, professional voice. Short sentences. White space. Make ideas feel obvious.';
  }
}

async function generateForChannel(source, channel, voiceGuide) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You are a content formatter for AJ, founder of Phlote.\n\nVOICE GUIDE:\n${voiceGuide}\n\nCHANNEL: ${channel}\n${CHANNEL_INSTRUCTIONS[channel]}\n\nRules:\n- Do not add anything AJ didn't say\n- Do not add a signature or sign-off\n- Return only the post content, nothing else`,
    messages: [{ role: 'user', content: `Format this for ${channel}:\n\n${source}` }]
  });
  return response.content[0].text;
}

async function postToTwitter(content) {
  if (!process.env.TWITTER_API_KEY) return;
  try {
    const { TwitterApi } = require('twitter-api-v2');
    const twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
    await twitter.v2.tweet(content);
    console.log('Posted to Twitter');
  } catch (err) {
    console.error('Twitter post failed:', err.message);
  }
}

async function main() {
  const filesArg = process.argv[2] || '';
  const files = filesArg.split(',').filter(f => f.includes('publish/queue/'));

  if (!files.length) {
    console.log('No queue files found.');
    return;
  }

  const voiceGuide = await loadVoiceGuide();

  for (const file of files) {
    const trimmed = file.trim();
    if (!trimmed || !fs.existsSync(trimmed)) continue;

    const source = fs.readFileSync(trimmed, 'utf8');
    const basename = path.basename(trimmed);

    console.log(`Processing: ${basename}`);

    for (const channel of CHANNELS) {
      const content = await generateForChannel(source, channel, voiceGuide);
      const outPath = `publish/${channel}/${basename}`;
      fs.writeFileSync(outPath, content);
      console.log(`Drafted: ${outPath}`);
    }

    if (process.env.TWITTER_API_KEY) {
      const twitterContent = fs.readFileSync(`publish/twitter/${basename}`, 'utf8');
      await postToTwitter(twitterContent);
    }

    const archivePath = `publish/archive/${basename}`;
    fs.copyFileSync(trimmed, archivePath);
    fs.unlinkSync(trimmed);
    console.log(`Archived: ${archivePath}`);
  }
}

main().catch(console.error);
EOFcat > .github/scripts/publisher.js << 'EOF'
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CHANNELS = ['twitter', 'linkedin', 'substack', 'instagram', 'tiktok'];

const CHANNEL_INSTRUCTIONS = {
  twitter: `Format as a Twitter post. Tightest version of the idea. Strong opening line. 4-8 lines max. No hashtags. No emojis.`,
  linkedin: `Format as a LinkedIn post. Same voice, one level deeper. 3-6 short paragraphs. End on a real observation, not a CTA.`,
  substack: `Format as a Substack field note. Let it breathe. Document the thinking behind the thesis. Like a founder's journal entry made public.`,
  instagram: `Format as an Instagram caption. Punchy. One idea. Short. Visual-first.`,
  tiktok: `Format as a TikTok spoken script. Hook in first line. Conversational rhythm. 30-60 seconds when spoken.`
};

async function loadVoiceGuide() {
  try {
    const voice = fs.readFileSync('learning/style/aj_voice.md', 'utf8');
    const rules = fs.readFileSync('learning/style/prompt_rules.md', 'utf8');
    return `${voice}\n\n---\n\n${rules}`;
  } catch {
    return 'Write in a direct, casual, professional voice. Short sentences. White space. Make ideas feel obvious.';
  }
}

async function generateForChannel(source, channel, voiceGuide) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: `You are a content formatter for AJ, founder of Phlote.\n\nVOICE GUIDE:\n${voiceGuide}\n\nCHANNEL: ${channel}\n${CHANNEL_INSTRUCTIONS[channel]}\n\nRules:\n- Do not add anything AJ didn't say\n- Do not add a signature or sign-off\n- Return only the post content, nothing else`,
    messages: [{ role: 'user', content: `Format this for ${channel}:\n\n${source}` }]
  });
  return response.content[0].text;
}

async function postToTwitter(content) {
  if (!process.env.TWITTER_API_KEY) return;
  try {
    const { TwitterApi } = require('twitter-api-v2');
    const twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
    await twitter.v2.tweet(content);
    console.log('Posted to Twitter');
  } catch (err) {
    console.error('Twitter post failed:', err.message);
  }
}

async function main() {
  const filesArg = process.argv[2] || '';
  const files = filesArg.split(',').filter(f => f.includes('publish/queue/'));

  if (!files.length) {
    console.log('No queue files found.');
    return;
  }

  const voiceGuide = await loadVoiceGuide();

  for (const file of files) {
    const trimmed = file.trim();
    if (!trimmed || !fs.existsSync(trimmed)) continue;

    const source = fs.readFileSync(trimmed, 'utf8');
    const basename = path.basename(trimmed);

    console.log(`Processing: ${basename}`);

    for (const channel of CHANNELS) {
      const content = await generateForChannel(source, channel, voiceGuide);
      const outPath = `publish/${channel}/${basename}`;
      fs.writeFileSync(outPath, content);
      console.log(`Drafted: ${outPath}`);
    }

    if (process.env.TWITTER_API_KEY) {
      const twitterContent = fs.readFileSync(`publish/twitter/${basename}`, 'utf8');
      await postToTwitter(twitterContent);
    }

    const archivePath = `publish/archive/${basename}`;
    fs.copyFileSync(trimmed, archivePath);
    fs.unlinkSync(trimmed);
    console.log(`Archived: ${archivePath}`);
  }
}

main().catch(console.error);
