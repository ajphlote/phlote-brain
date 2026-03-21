// publisher.js
// Reads source file from publish/queue/
// Loads voice guide
// Generates channel-specific content via Claude
// Posts to each platform

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CHANNELS = ['twitter', 'linkedin', 'substack', 'instagram', 'tiktok'];

const CHANNEL_INSTRUCTIONS = {
  twitter: `Format as a Twitter thread or single tweet.
Tightest version of the idea. Strong opening line. 4–8 lines max.
No hashtags unless they're natural. No emojis.`,

  linkedin: `Format as a LinkedIn post.
Same voice, one level deeper. Slightly more context than Twitter.
End on a real observation — not a CTA or question.
3–6 short paragraphs.`,

  substack: `Format as a Substack field note.
Let it breathe. Document the thinking behind the thesis.
Conversational. Like a founder's journal entry made public.
No formal intro or outro needed.`,

  instagram: `Format as an Instagram caption.
Visual-first — caption should standalone.
Punchy. One idea. Short.
Can end with a relevant single question if it feels natural.`,

  tiktok: `Format as a TikTok spoken script.
Hook in first line — must stop the scroll.
Conversational rhythm — written how you'd say it out loud.
30–60 seconds when spoken. Short sentences.`
};

async function loadVoiceGuide() {
  const voice = fs.readFileSync('learning/style/aj_voice.md', 'utf8');
  const rules = fs.readFileSync('learning/style/prompt_rules.md', 'utf8');
  return `${voice}\n\n---\n\n${rules}`;
}

async function loadGoodExamples() {
  try {
    return fs.readFileSync('learning/style/examples_good.md', 'utf8');
  } catch {
    return '';
  }
}

async function generateForChannel(source, channel, voiceGuide, examples) {
  const systemPrompt = `You are a content formatter for AJ, founder of Phlote.

Your job: take AJ's raw notes and format them in his exact voice for ${channel}.

VOICE GUIDE:
${voiceGuide}

${examples ? `APPROVED EXAMPLES (target this standard):\n${examples}` : ''}

CHANNEL INSTRUCTIONS FOR ${channel.toUpperCase()}:
${CHANNEL_INSTRUCTIONS[channel]}

Rules:
- Do not add anything AJ didn't say
- Do not explain or editorialize
- Do not add a signature or sign-off
- Return only the post content, nothing else`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Format this for ${channel}:\n\n${source}` }]
  });

  return response.content[0].text;
}

async function postToTwitter(content, filename) {
  // Twitter API v2
  if (!process.env.TWITTER_ACCESS_TOKEN) return;
  try {
    const { TwitterApi } = require('twitter-api-v2');
    const twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
    await twitter.v2.tweet(content);
    console.log(`✓ Posted to Twitter: ${filename}`);
  } catch (err) {
    console.error('Twitter post failed:', err.message);
  }
}

async function postToLinkedIn(content, filename) {
  if (!process.env.LINKEDIN_ACCESS_TOKEN) return;
  try {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });
    console.log(`✓ Posted to LinkedIn: ${filename}`);
  } catch (err) {
    console.error('LinkedIn post failed:', err.message);
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
  const examples = await loadGoodExamples();

  for (const file of files) {
    const trimmed = file.trim();
    if (!trimmed || !fs.existsSync(trimmed)) continue;

    const source = fs.readFileSync(trimmed, 'utf8');
    const basename = path.basename(trimmed);

    console.log(`\nProcessing: ${basename}`);

    for (const channel of CHANNELS) {
      const content = await generateForChannel(source, channel, voiceGuide, examples);
      const outPath = `publish/${channel}/${basename}`;
      fs.writeFileSync(outPath, content);
      console.log(`  → Drafted: ${outPath}`);
    }

    // Post to live platforms
    const twitterContent = fs.readFileSync(`publish/twitter/${basename}`, 'utf8');
    const linkedinContent = fs.readFileSync(`publish/linkedin/${basename}`, 'utf8');

    await postToTwitter(twitterContent, basename);
    await postToLinkedIn(linkedinContent, basename);

    // Move to archive
    const archivePath = `publish/archive/${basename}`;
    fs.copyFileSync(trimmed, archivePath);
    fs.unlinkSync(trimmed);
    console.log(`  → Archived: ${archivePath}`);
  }
}

main().catch(console.error);
