# Phlote Brain

Phlote is building the music infrastructure for the agentic internet.
Music is mispriced — valued on listening, when the real opportunity is usage.
We're acquiring catalog, building the metadata layer, and positioning it
to be found and deployed by AI agents at scale.

This is the founder's public operating system. How we think. What we're building. Why it matters.

Not a content machine. A proof-of-work engine.

Work → Documentation → Intelligence → Distribution
Founder operating system for building Phlote in public.

Not a content machine. A proof-of-work engine.

Work → Documentation → Intelligence → Distribution

---

## How It Works

1. Write source notes anywhere — ideas/, signals/, daily_logs/, artifacts/
2. Drop a source file into `publish/queue/`
3. GitHub Action formats it into your voice across all channels
4. Posts automatically
5. If you improve a post, save the final to `approved_posts/[channel]/`
6. Second workflow compares draft vs final, extracts style patterns
7. Voice guide sharpens over time

---

## Folder Map

```
Phlote_Brain/
│
├── raw_conversations/     # Full AI conversations — unfiltered thinking log
│   ├── atlas/
│   └── claude/
│
├── references/            # Articles, papers, screenshots, people, companies
│
├── ideas/                 # Raw ideas, not yet developed
│
├── signals/               # High-conviction theses
│
├── artifacts/             # Structured outputs — strategy, models, memos
│
├── daily_logs/            # 2026_03_19.md — what you worked on, key decisions
│
├── weekly_briefs/         # Auto-generated weekly summaries
│
├── publish/
│   ├── queue/             # Drop source files here to trigger publishing
│   ├── twitter/           # AI-generated drafts
│   ├── linkedin/
│   ├── substack/
│   ├── instagram/
│   ├── tiktok/
│   └── archive/           # Everything that's been published
│
├── approved_posts/        # Your final edited versions (truth)
│   ├── twitter/
│   ├── linkedin/
│   ├── substack/
│   ├── instagram/
│   └── tiktok/
│
└── learning/
    ├── style/
    │   ├── aj_voice.md          # Master voice guide
    │   ├── prompt_rules.md      # AI formatting rules
    │   ├── examples_good.md     # Approved posts that nail it
    │   ├── examples_bad.md      # Drafts that missed
    │   └── edit_learning_prompt.md
    │
    ├── feedback/
    │   ├── edit_log.md          # Running record of what changed
    │   └── pattern_updates.md   # Suggested rule updates
    │
    └── comparisons/             # Draft vs final per channel
        ├── twitter/
        ├── linkedin/
        ├── substack/
        ├── instagram/
        └── tiktok/
```

---

## Naming Convention

Use the same filename across the pipeline so workflows can match files.

```
publish/queue/music_is_mispriced.md
publish/twitter/music_is_mispriced.md      ← AI draft
approved_posts/twitter/music_is_mispriced.md  ← your final
learning/comparisons/twitter/music_is_mispriced.md  ← comparison output
```

---

## Voice

See `learning/style/aj_voice.md`

Short version: direct, observational, calm confidence.
Ideas should feel like reminders, not revelations.
