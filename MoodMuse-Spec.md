# MoodMuse — MVP Build Specification

*Transform a feeling into something you can hold. Then keep it forever.*

MoodMuse turns an emotion + the objects within arm's reach into a real, 30‑minute creative project, then enshrines the finished object as a 3D artifact in a personal, magical museum. This document is the complete build packet for a 24‑hour hackathon: everything is scoped so a team of 2–4 can ship a polished, demo‑able product, with explicit notes on what to *build for real* vs. what to *fake convincingly* on stage.

---

## 1. Product specification

**One‑line:** A guided ritual that converts a mood and a pile of household materials into a meaningful object, then preserves it as a 3D museum artifact.

**Who it's for:** People who want to make something by hand but freeze at "what do I even make?" — the emotionally curious, the journaler, the person processing a hard week. Not crafters chasing a Pinterest tutorial.

**The promise that makes it different:** MoodMuse is not a generator that spits out craft ideas. It's a *museum that grows*. Every object you make becomes a curated artifact with a name, a plaque, and a wing of a private museum that is uniquely yours. The output is memory, not output.

**Core loop:**
1. Choose a feeling.
2. Show MoodMuse what you have.
3. Receive a personal project (achievable in < 30 min, uses only your materials).
4. Receive the artifact's *museum identity* — its name, title, and the meaning it will hold.
5. Make the thing. Photograph it.
6. Watch it become a 3D artifact on a pedestal.
7. It takes its place in the matching hall of your museum.

**MVP success criteria (what "done" means for the demo):**
- A user can complete the full loop end‑to‑end on a phone.
- Material detection feels accurate and a little magical.
- The generated project is specific to the materials and the mood, never generic.
- The museum is navigable and visibly fills up over a session.
- The whole experience never breaks character into "processing image…" language.

**Explicit non‑goals for MVP:** social/sharing graph, multi‑user museums, marketplace, real‑time collaboration, accounts beyond basic auth, payment.

---

## 2. Complete user flow

```
 ENTER ──▶ MOOD ──▶ MATERIALS ──▶ PROJECT ──▶ IDENTITY ──▶ MAKE ──▶ CAPTURE ──▶ FORGE 3D ──▶ MUSEUM
   │         │          │            │            │           │         │            │            │
 threshold  pick    camera +     project     artifact     offline   upload     image→.glb    placed in
 / login    1 mood  Claude       plan +      name +       (user      finished   (Tripo/Meshy) matching hall
                    Vision       steps       plaque       crafts)    photo                    + plaque
```

**State machine (single session object `session`):**

`idle → mood_selected → capturing → materials_detected → project_ready → identity_ready → awaiting_creation → uploaded → modeling → enshrined`

- Any step can fall back to a graceful re‑try without leaving the museum frame.
- `project_ready` and `identity_ready` are produced in a single Claude call (one round‑trip, two JSON sections) to save latency.
- `modeling` is async (poll). The UI shows the pedestal with a "still forming" shimmer until the `.glb` resolves; the artifact is already saved with its plaque before the mesh is ready, so a slow 3D job never blocks enshrinement.

**Edge handling, in‑character:**
- No materials detected → "The cabinet looks bare. Bring the objects closer to the light." (re‑capture)
- 3D job fails → artifact still enshrined as a "framed photograph" exhibit; a quiet "Re‑forge" option remains.
- Offline mid‑make → the project plan is cached locally so the user can craft without signal and upload later.

---

## 3. Database schema (conceptual)

Five core entities. `auth.users` is provided by Supabase Auth; everything else lives in `public`.

| Entity | Purpose | Key fields |
|---|---|---|
| **profiles** | App‑side user record | `id (=auth uid)`, `display_name`, `museum_name`, `created_at` |
| **moods** | Reference/seed list of the 10 feelings | `key`, `label`, `hall_key`, `accent_hex`, `prompt_blurb` |
| **halls** | The museum rooms | `key`, `name`, `emoji`, `theme_hex`, `description` |
| **projects** | A generated creative plan | `id`, `user_id`, `mood_key`, `title`, `concept`, `emotional_explanation`, `materials jsonb`, `steps jsonb`, `est_minutes`, `difficulty`, `created_at` |
| **artifacts** | The enshrined object + its museum identity | `id`, `user_id`, `project_id`, `mood_key`, `hall_key`, `artifact_name`, `museum_title`, `museum_description`, `artifact_meaning`, `source_image_url`, `glb_url`, `model_status`, `created_at` |

**Mood → Hall mapping (seed data):**

| Hall | Emoji | Moods routed here |
|---|---|---|
| Hall of Nostalgia | 🌙 | Nostalgic, Reflective, Lonely |
| Hall of Dreams | ✨ | Hopeful, Inspired, Creative |
| Hall of Healing | 🌊 | Healing, Overwhelmed |
| Hall of Ambition | 🔥 | Ambitious |
| Hall of Curiosity | 🎭 | Curious |

All 10 moods route to a hall, so the museum is never empty‑roomed by design.

---

## 4. Supabase schema (SQL)

```sql
-- PROFILES ---------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  museum_name  text default 'A Museum of Feelings',
  created_at   timestamptz default now()
);

-- REFERENCE: HALLS -------------------------------------------------------
create table public.halls (
  key         text primary key,           -- 'nostalgia','dreams','healing','ambition','curiosity'
  name        text not null,              -- 'Hall of Nostalgia'
  emoji       text not null,
  theme_hex   text not null,
  description  text
);

-- REFERENCE: MOODS -------------------------------------------------------
create table public.moods (
  key          text primary key,          -- 'nostalgic','inspired',...
  label        text not null,             -- 'Nostalgic'
  hall_key     text not null references public.halls(key),
  accent_hex   text not null,
  prompt_blurb text                       -- tone guidance fed to Claude
);

-- PROJECTS ---------------------------------------------------------------
create table public.projects (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users(id) on delete cascade,
  mood_key               text not null references public.moods(key),
  title                  text not null,
  concept                text not null,
  emotional_explanation  text not null,
  materials              jsonb not null,   -- ["3 shells","blue ribbon",...]
  steps                  jsonb not null,   -- [{n:1,text:"..."},...]
  est_minutes            int  not null,
  difficulty             text not null,    -- 'Gentle'|'Considered'|'Devoted'
  created_at             timestamptz default now()
);

-- ARTIFACTS --------------------------------------------------------------
create table public.artifacts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  project_id          uuid references public.projects(id) on delete set null,
  mood_key            text not null references public.moods(key),
  hall_key            text not null references public.halls(key),
  artifact_name       text not null,
  museum_title        text not null,
  museum_description  text not null,
  artifact_meaning    text not null,
  source_image_url    text,
  glb_url             text,
  model_status        text default 'pending', -- 'pending'|'forging'|'ready'|'failed'
  created_at          timestamptz default now()
);

-- ROW LEVEL SECURITY -----------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.projects  enable row level security;
alter table public.artifacts enable row level security;

create policy "own profile"   on public.profiles  using (auth.uid() = id) with check (auth.uid() = id);
create policy "own projects"  on public.projects  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own artifacts" on public.artifacts using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- halls + moods are public read
alter table public.halls enable row level security;
alter table public.moods enable row level security;
create policy "halls readable" on public.halls for select using (true);
create policy "moods readable" on public.moods for select using (true);

-- STORAGE: two buckets — 'captures' (source photos), 'artifacts' (.glb files)
-- Both private; access via signed URLs scoped to user_id path prefix.
```

---

## 5. API architecture (Next.js App Router)

All routes are server actions / route handlers; the Claude and Tripo keys never touch the client.

| Route | Method | In | Out |
|---|---|---|---|
| `/api/materials` | POST | `{ imageBase64 }` | `{ materials: string[] }` |
| `/api/conjure` | POST | `{ moodKey, materials }` | `{ project, identity }` (one Claude call) |
| `/api/artifact` | POST | `{ projectId, identity }` | `{ artifactId }` (persists plaque immediately) |
| `/api/artifact/forge` | POST | `{ artifactId, imageUrl }` | `{ jobId }` (kicks off Tripo/Meshy) |
| `/api/artifact/forge` | GET | `?jobId=` | `{ status, glbUrl? }` (poll) |
| `/api/museum` | GET | — | `{ halls: [{ ...hall, artifacts: [...] }] }` |

**Forge flow (image → 3D):**
```
client uploads finished photo → Supabase Storage (captures/)
   → POST /api/artifact/forge { artifactId, imageUrl }
       → Tripo image-to-3D job created, model_status='forging'
   → client polls GET /api/artifact/forge?jobId
       → on success: download .glb → Supabase Storage (artifacts/)
                      update artifacts.glb_url, model_status='ready'
```

**Provider note:** Tripo AI image‑to‑3D is the primary (fast, good single‑object meshes); Meshy is the fallback. Both are swappable behind a single `forgeModel(imageUrl)` adapter so the demo can switch providers if one rate‑limits during the event.

---

## 6. Claude prompt architecture

Three specialized "curators," each a system prompt with strict structured output. Use the **tool‑use / forced‑JSON** pattern so every response parses cleanly — no markdown fences, no preamble.

### 6.1 The Curator (Claude Vision — material detection)
**System:**
> You are the Curator of a museum of feelings. You are shown a photograph of objects and craft materials a person has gathered. Identify only the tangible, usable materials you can see with confidence. Ignore backgrounds, hands, and furniture. Return plain, makeable nouns a person would recognize. Never invent materials that aren't visible.

**Output (forced):** `{ "materials": ["sea shells", "blue satin ribbon", "white cardstock", "gold marker"] }`

### 6.2 The Alchemist + The Archivist (single call — project + identity)
Combining the project plan and museum identity into one call keeps the experience to a single round‑trip. The prompt receives `moodKey`, the mood's `prompt_blurb`, and `materials`.

**System:**
> You are two voices in one museum. The Alchemist designs a single creative project that transforms a feeling into a physical object — achievable in under 30 minutes, using ONLY the listed materials, emotionally specific to the chosen feeling, and made to feel like creating an artifact rather than following a craft tutorial. The Archivist then names and enshrines what will be created, writing as a poetic museum curator. Be specific and sincere; avoid clichés, avoid corporate or self‑help language. Return one JSON object only.

**Output (forced):**
```json
{
  "project": {
    "title": "string",
    "concept": "1-2 sentences",
    "emotional_explanation": "why this object answers this feeling",
    "materials_used": ["..."],
    "steps": [{ "n": 1, "text": "..." }],
    "est_minutes": 20,
    "difficulty": "Gentle | Considered | Devoted"
  },
  "identity": {
    "artifact_name": "string",
    "museum_title": "evocative, e.g. 'The Stars I Followed Home'",
    "museum_description": "poetic plaque text, 2-3 sentences",
    "artifact_meaning": "what this object preserves for its maker"
  }
}
```

**Tone guardrails baked into each mood's `prompt_blurb`** — e.g. *Healing* → "gentle, slow, restorative; nothing sharp or rushed"; *Ambition* → "forward‑leaning, bold, a small monument"; *Lonely* → "tender, companionable; the object should feel like company."

**Why one call, two voices:** lower latency on stage, and the identity stays coherent with the actual project rather than being generated blind.

---

## 7. React component structure

```
app/
├─ layout.tsx                  // fonts (Fraunces + Inter), <Starfield/> ambient layer
├─ page.tsx                    // Threshold / landing
├─ create/
│  └─ page.tsx                 // orchestrates the session state machine
└─ museum/
   ├─ page.tsx                 // hall selection (the world)
   └─ [hall]/page.tsx          // gallery inside a hall

components/
├─ atmosphere/
│  ├─ Starfield.tsx            // ambient floating particles (canvas)
│  ├─ VelvetCurtain.tsx        // reveal transition wrapper
│  └─ Plaque.tsx               // the gold-bordered museum plaque (reused everywhere)
├─ flow/
│  ├─ MoodPicker.tsx           // celestial orbs, Step 1
│  ├─ MaterialCapture.tsx      // camera frame + detected-chip animation, Step 2
│  ├─ ProjectScroll.tsx        // project plan on parchment, Step 3
│  ├─ IdentityReveal.tsx       // artifact identity plaque, Step 4
│  ├─ CompletionUpload.tsx     // upload finished photo, Step 5
│  └─ ForgePedestal.tsx        // 3D forming → rotating artifact, Step 6
├─ museum/
│  ├─ HallDoor.tsx             // velvet doorway into a hall
│  ├─ Gallery3D.tsx            // R3F scene, Step 7
│  └─ Pedestal.tsx             // single artifact on a plinth + plaque
└─ ui/
   ├─ LoadingIncantation.tsx   // in-character loading lines
   └─ MoodMuseButton.tsx       // shared gold button
```

**State:** a single `useSession()` hook (Zustand or React context) holding the state‑machine status, the active mood, detected materials, the project, the identity, and the in‑flight artifact id. No prop‑drilling through the flow.

---

## 8. Three.js / React Three Fiber museum concept

The museum is a **room**, not a grid. Each hall is a dim gallery with a warm floor, a starfield ceiling, and artifacts on lit plinths.

**Scene composition (`Gallery3D.tsx`):**
- `Canvas` with `dpr={[1,2]}`, soft fog tinted to the hall's `theme_hex`.
- **Floor:** large plane, plum‑tinted, subtle reflection (`MeshReflectorMaterial`) for the "polished marble" feel.
- **Ceiling/atmosphere:** instanced points starfield slowly drifting; one large soft "moon" light.
- **Plinths:** artifacts arranged in a gentle arc. Each `<Pedestal>` = a `CylinderGeometry` plinth + the loaded `.glb` (`useGLTF`) on top + a focused `SpotLight` from above (the museum spotlight) + a floating gold plaque (`<Html>` or a texture) with the `museum_title`.
- **Empty plinths** glow faintly with a "?" — an invitation to make more, never a dead end.
- **Navigation:** `OrbitControls` clamped to a comfortable arc (no upside‑down), or tap‑to‑focus that dollies the camera to the selected pedestal and fades its plaque in.
- **Fallback if a `.glb` isn't ready:** the plinth holds a framed, slowly‑rotating plane textured with the source photo, with a "still forming" shimmer.

**Performance for a 24h build:** lazy‑load only the visible hall's models, `<Suspense>` per pedestal, cap to ~8 artifacts per visible arc, preload the empty‑plinth and frame fallbacks so the room is never blank while meshes stream in.

---

## 9. Landing page copy

**Eyebrow:** A museum of feelings

**Hero headline:** *Turn a feeling into something you can hold.*

**Subhead:** Choose how you feel. Show us what's within reach. MoodMuse hands you a small, beautiful thing to make — then keeps it forever, in a museum that is only yours.

**Primary button:** Enter the museum

**Three‑beat "how it works":**
1. **Name the feeling.** Ten doors, ten moods. Pick the one that's loudest today.
2. **Empty your pockets.** Shells, ribbon, a stray button. We make a project from only what you have.
3. **Enshrine it.** Your finished object becomes a 3D artifact with a name and a plaque, placed in its hall.

**Closing line, above the footer:** *Most apps help you do more. MoodMuse helps you keep something.*

---

## 10. Hackathon demo flow (the 3‑minute run of show)

Pre‑load one "seed" artifact in the Hall of Nostalgia so the museum isn't empty on first sight.

1. **(0:00) Cold open on the museum.** Walk the camera slowly past the one existing artifact + its plaque. "This is a museum of feelings. Let me add to it, live."
2. **(0:25) Pick a mood.** Tap **Nostalgic**. Velvet curtain transition.
3. **(0:40) Capture materials.** Point the phone at a small pre‑arranged tray (shells, ribbon, gold pen). Materials detect on screen as glowing chips. *(This is the "wow, it sees" beat.)*
4. **(1:00) The project appears.** Read the title + the emotional explanation aloud — this is the line that makes the room go quiet.
5. **(1:20) The identity plaque.** "Before I've even made it, it already has a name." Show *museum_title*.
6. **(1:35) Pre‑made object reveal.** Hold up the finished object you crafted earlier; upload its photo.
7. **(1:50) Forge.** Loading incantation → the 3D artifact resolves on its pedestal. *(Use a pre‑forged .glb keyed to this exact object so it's instant — see risk note.)*
8. **(2:20) Enshrine.** It slides into the Hall of Nostalgia beside the seed artifact. Camera pulls back to show the museum now holds two.
9. **(2:40) Close** on the closing line.

**Demo risk mitigation (critical):** image‑to‑3D takes 30–90s and can fail on conference Wi‑Fi. **Pre‑forge the demo object's `.glb` beforehand** and have the forge step resolve to it deterministically when the demo flag is on. Build the live path for real, but never gamble the stage on a cold 3D job.

---

## 11. Two‑minute pitch script

> Raise your hand if you've ever wanted to make something with your hands — and then just… didn't, because you didn't know what to make.
>
> That blank moment is where most creativity dies. Not from lack of materials. From lack of a *prompt that means something*.
>
> This is **MoodMuse**. It doesn't generate crafts. It transforms feelings into objects, and keeps them.
>
> It starts with one question: *what feeling would you like to transform today?* You pick a mood. Then you show it what you have — shells, ribbon, whatever's on your desk — and it sees them.
>
> And then it gives you a single, personal project. Under thirty minutes, using only what you have, built around the feeling you chose. Watch — *(read the emotional explanation)* — that's not a tutorial. That's a reason to make something.
>
> Here's the part nobody else does. Before you've even started, MoodMuse names the thing you're about to create and writes its museum plaque. *"The Stars I Followed Home."* Your craft just became an artifact.
>
> You make it. You photograph it. And it becomes a real 3D model, placed on a pedestal in a museum that is only yours — organized into halls of Nostalgia, Dreams, Healing, Ambition, and Curiosity. Every feeling you've ever transformed, preserved.
>
> Most apps are built to help you do more and remember less. MoodMuse is built so that a hard Tuesday, or a hopeful one, leaves something behind you can walk through later.
>
> Built tonight on Next.js, Claude, and image‑to‑3D. We're MoodMuse — the museum that grows every time you feel something. Come in.

---

## 12. Screens for every step

The accompanying interactive prototype renders all nine screens in the MoodMuse design system, in sequence:

1. **Threshold** — "Enter the museum."
2. **Mood** — "What feeling would you like to transform today?" (celestial orbs)
3. **Materials** — camera frame; detected materials surface as gold chips.
4. **Project** — the plan, on a museum scroll.
5. **Identity** — the artifact's name + plaque, before it exists.
6. **Make & capture** — upload the finished object.
7. **Forge** — loading incantation → 3D artifact on its pedestal.
8. **The museum** — five halls as velvet doorways.
9. **Inside a hall** — artifacts on lit plinths.

---

## Design system reference

| Token | Value | Use |
|---|---|---|
| Background | `#F8F4EE` | parchment surfaces, light screens |
| Deep Plum | `#4B324F` | night galleries, primary text on light |
| Velvet Rose | `#A86A82` | accents, curtains, secondary |
| Gold | `#D6B56E` | plaques, frames, primary action |
| Moonlight | `#E7E1D7` | soft text on dark, dividers |

**Type:** Display & plaques → **Fraunces** (an old‑style, optically warm serif — vintage‑museum, not corporate). Body & UI → **Inter**. Small‑caps, letter‑spaced Inter for plaque labels and captions.

**Motifs:** drifting star particles, a single soft moon‑light, gold hairline frames, wax‑seal/constellation marks, velvet‑curtain reveals between major steps.

**Voice rule (non‑negotiable):** the interface never breaks character. Loading reads *"Opening the curiosity cabinet…", "Gathering forgotten stories…", "Searching for hidden possibilities…"* — never "processing" or "analyzing."

---

## 24‑hour build plan

| Hours | Focus |
|---|---|
| 0–2 | Next.js + Supabase scaffold, auth, schema + seed (halls, moods), design tokens, fonts, `<Starfield>` + `<Plaque>`. |
| 2–6 | Flow screens 1–5 wired to a mocked session; `/api/materials` + `/api/conjure` against Claude with forced JSON. |
| 6–10 | Storage upload, `/api/artifact` persistence, museum data fetch, hall routing. |
| 10–14 | R3F `Gallery3D` + `Pedestal`, load a test `.glb`, spotlight + plaque. |
| 14–18 | Tripo forge adapter + polling + fallback frame; pre‑forge the demo `.glb`. |
| 18–21 | Motion polish: velvet transitions, loading incantations, mood orb interactions. |
| 21–24 | Seed the demo museum, rehearse the run of show, set the demo flag, record a backup video. |

**Build for real:** mood pick, material detection, project + identity generation, persistence, the museum room, the full forge path.
**Fake convincingly on stage:** the specific demo object's `.glb` (pre‑forged), one seed artifact already in the Hall of Nostalgia.
