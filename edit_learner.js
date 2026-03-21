// edit_learner.js
// Triggered when AJ saves a final version to approved_posts/
// Finds matching AI draft
// Runs comparison via Claude
// Saves insights to learning/

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function loadLearningPrompt() {
  return fs.readFileSync('learning/style/edit_learning_prompt.md', 'utf8');
}

async function runComparison(draft, approved, channel, filename) {
  const learningPrompt = await loadLearningPrompt();

  const prompt = `${learningPrompt}

---

CHANNEL: ${channel}
FILE: ${filename}

AI-GENERATED DRAFT:
${draft}

---

AJ-APPROVED FINAL:
${approved}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  });

  return response.content[0].text;
}

function appendToEditLog(analysis, channel, filename) {
  const date = new Date().toISOString().split('T')[0];
  const entry = `\n---\n\n## ${date} — ${channel}/${filename}\n\n${analysis}\n`;

  const logPath = 'learning/feedback/edit_log.md';
  fs.appendFileSync(logPath, entry);
  console.log(`  → Appended to edit_log.md`);
}

function saveComparison(analysis, channel, filename) {
  const outDir = `learning/comparisons/${channel}`;
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outPath = `${outDir}/${filename}`;
  fs.writeFileSync(outPath, analysis);
  console.log(`  → Saved comparison: ${outPath}`);
}

function extractPatternUpdates(analysis, channel, filename) {
  // Save any "New Durable Rules" section to pattern_updates.md
  const match = analysis.match(/## New Durable Rules\n([\s\S]*?)(?=\n##|$)/);
  if (!match) return;

  const date = new Date().toISOString().split('T')[0];
  const entry = `\n---\n\n## ${date} — ${channel}/${filename}\n\n${match[1].trim()}\n`;

  const updatePath = 'learning/feedback/pattern_updates.md';
  if (!fs.existsSync(updatePath)) {
    fs.writeFileSync(updatePath, '# Pattern Updates\n\nSuggested rule additions. Review weekly and merge into prompt_rules.md.\n');
  }
  fs.appendFileSync(updatePath, entry);
  console.log(`  → Pattern updates saved`);
}

async function main() {
  const filesArg = process.argv[2] || '';
  const files = filesArg.split(',').filter(f => f.includes('approved_posts/'));

  if (!files.length) {
    console.log('No approved files found.');
    return;
  }

  for (const file of files) {
    const trimmed = file.trim();
    if (!trimmed || !fs.existsSync(trimmed)) continue;

    // Parse channel and filename from path
    // approved_posts/twitter/music_is_mispriced.md
    const parts = trimmed.split('/');
    const channel = parts[1];
    const filename = parts[2];

    console.log(`\nLearning from: ${channel}/${filename}`);

    // Find matching draft
    const draftPath = `publish/${channel}/${filename}`;
    if (!fs.existsSync(draftPath)) {
      console.log(`  → No matching draft found at ${draftPath}, skipping.`);
      continue;
    }

    const draft = fs.readFileSync(draftPath, 'utf8');
    const approved = fs.readFileSync(trimmed, 'utf8');

    // Skip if identical (no edits were made)
    if (draft.trim() === approved.trim()) {
      console.log(`  → No changes detected. Draft was good — noting that.`);
      // Still useful signal — add to examples_good.md
      const examplesPath = 'learning/style/examples_good.md';
      const date = new Date().toISOString().split('T')[0];
      const entry = `\n---\n\n## ${filename} (${channel}) — approved unchanged — ${date}\n\n${approved}\n`;
      fs.appendFileSync(examplesPath, entry);
      continue;
    }

    const analysis = await runComparison(draft, approved, channel, filename);

    saveComparison(analysis, channel, filename);
    appendToEditLog(analysis, channel, filename);
    extractPatternUpdates(analysis, channel, filename);
  }

  console.log('\nLearning complete.');
}

main().catch(console.error);
