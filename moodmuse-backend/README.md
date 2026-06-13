# MoodMuse

**Turn a feeling into something you can hold.**

MoodMuse transforms an emotion and the objects within arm's reach into a meaningful 30-minute creative project, then enshrines the finished creation as a collectible artifact in a personal, magical museum.

## Demo

The app runs in full mock mode — no API keys needed.

```bash
cd moodmuse-backend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Flow

1. **Choose a feeling** — select a mood like Nostalgic, Inspired, or Curious
2. **Show your materials** — upload a photo of what's within reach
3. **Receive a project** — AI suggests a specific creative project using only your materials
4. **Make it** — follow the steps to create your artifact (under 30 minutes)
5. **Upload your creation** — photograph what you made
6. **Watch it transform** — the app forges your photo into a stylized museum collectible
7. **Enter your museum** — your artifact sits on a golden shelf in the Hall of Nostalgia

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Supabase** (optional — runs in-memory without it)
- **AI providers** (optional — runs with mock responses)
  - Google Gemini, OpenAI GPT-4o, or Anthropic Claude for vision + generation
- Single HTML frontend with celestial theater museum UI

## Project Structure

```
moodmuse-backend/
├── public/
│   ├── index.html              # Full frontend (single file)
│   └── artifact-mock.png       # Pre-made collectible artifact for demo
├── src/
│   ├── app/api/
│   │   ├── materials/route.ts  # POST — detect materials from photo
│   │   ├── conjure/route.ts    # POST — generate project from mood + materials
│   │   ├── artifact/route.ts   # POST — save artifact
│   │   ├── artifact/style/route.ts  # POST — generate stylized artifact card
│   │   └── museum/route.ts     # GET  — all artifacts grouped by hall
│   ├── lib/
│   │   ├── ai.ts               # AI service (Gemini/OpenAI/Claude)
│   │   ├── demo.ts             # Mock mode — hardcoded responses
│   │   ├── stylize.ts          # Artifact card SVG renderer
│   │   └── supabase.ts         # DB client (optional)
│   └── types/index.ts          # TypeScript types
├── supabase/schema.sql         # Database schema
├── .env.example
└── .env.local                  # MOCK_MODE=true (no keys needed)
```

## API Endpoints

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/materials` | Send photo → get detected materials list |
| POST | `/api/conjure` | Send mood + materials → get project + museum identity |
| POST | `/api/artifact` | Save artifact to museum |
| POST | `/api/artifact/style` | Generate stylized artifact card from photo |
| GET | `/api/museum` | Get all artifacts grouped by museum hall |

## Museum Halls

| Hall | Moods |
|------|-------|
| Hall of Nostalgia 🌙 | Nostalgic, Reflective, Lonely |
| Hall of Dreams ✨ | Hopeful, Inspired, Creative |
| Hall of Healing 🌊 | Healing, Overwhelmed |
| Hall of Ambition 🔥 | Ambitious |
| Hall of Curiosity 🎭 | Curious |

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# Mock mode — no API keys needed
MOCK_MODE=true

# Optional: enable real AI (pick one)
# GEMINI_API_KEY=           # Free at https://aistudio.google.com/apikey
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...

# Optional: Supabase (uses in-memory DB without these)
# NEXT_PUBLIC_SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=
```

## Mock Mode

When `MOCK_MODE=true` (default), the app returns hardcoded responses:

- **Materials detected**: canvas, markers, pencils, brushes
- **Project**: "The Girl Who Carried Her Chapters" — draw yourself surrounded by constellation symbols of recent memories
- **Artifact**: "The Stars She Took With Her" — placed in the Hall of Nostalgia
- **Stylized image**: pre-made collectible artifact card (`artifact-mock.png`)

No external API calls are made. Everything works offline.

## Design System

| Token | Value | Use |
|-------|-------|-----|
| Background | `#F8F4EE` | Parchment surfaces |
| Deep Plum | `#4B324F` | Night galleries |
| Velvet Rose | `#A86A82` | Accents, curtains |
| Gold | `#D6B56E` | Plaques, frames, actions |
| Moonlight | `#E7E1D7` | Soft text on dark |

**Typography**: Fraunces (serif, display) + Inter (sans, UI)

**Aesthetic**: Celestial theater, Victorian curiosity cabinet, velvet curtains, gold ornamentation, tarot card collectibles

## Built for

24-hour hackathon MVP — scoped for a team of 2–4 to ship a polished, demo-able product.
