/**
 * MoodMuse Artifact Card Renderer
 *
 * Creates a premium collectible museum artifact card as SVG.
 * Embeds the user's actual creation photo inside an ornate
 * celestial frame with gold accents, moon, stars, and plaque.
 *
 * Style: retro glamour collectible, vintage museum exhibit,
 * celestial theater, pastel + gold palette.
 */

export interface ArtifactCardOptions {
  imageBase64: string;
  artifactName: string;
  moodKey: string;
  hallName?: string;
  museumDescription?: string;
}

export function renderArtifactCard(opts: ArtifactCardOptions): string {
  const { imageBase64, artifactName, moodKey, museumDescription } = opts;

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const hallName = opts.hallName || HALL_FOR_MOOD[moodKey] || "Hall of Nostalgia";
  const moodAccent = MOOD_ACCENTS[moodKey] || { primary: "#c4a0d0", secondary: "#e8b4c8", glow: "#d4b0e0" };

  const name = esc(artifactName || "Untitled Artifact");
  const hall = esc(hallName);
  const desc = museumDescription
    ? esc(museumDescription.length > 70 ? museumDescription.slice(0, 67) + "..." : museumDescription)
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="440" height="620" viewBox="0 0 440 620">
  <defs>
    <!-- main background -->
    <radialGradient id="cardBg" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#3d2050"/>
      <stop offset="50%" stop-color="#2a1535"/>
      <stop offset="100%" stop-color="#150c1c"/>
    </radialGradient>

    <!-- frame gradient -->
    <linearGradient id="frameGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f0d890"/>
      <stop offset="30%" stop-color="#d4a850"/>
      <stop offset="50%" stop-color="#f0d890"/>
      <stop offset="70%" stop-color="#c49840"/>
      <stop offset="100%" stop-color="#f0d890"/>
    </linearGradient>

    <!-- inner frame shimmer -->
    <linearGradient id="frameInner" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8e8c0"/>
      <stop offset="50%" stop-color="#d4a850"/>
      <stop offset="100%" stop-color="#f8e8c0"/>
    </linearGradient>

    <!-- plaque fill -->
    <linearGradient id="plaqueFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#f8ecd0"/>
      <stop offset="100%" stop-color="#e8d8b8"/>
    </linearGradient>

    <!-- mood glow -->
    <radialGradient id="moodGlow" cx="50%" cy="30%" r="50%">
      <stop offset="0%" stop-color="${moodAccent.glow}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${moodAccent.glow}" stop-opacity="0"/>
    </radialGradient>

    <!-- sparkle filter -->
    <filter id="sparkle">
      <feGaussianBlur stdDeviation="2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softShadow">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="#0a0510" flood-opacity="0.6"/>
    </filter>
    <filter id="goldGlow">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="moonGlow">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>

    <!-- photo clip -->
    <clipPath id="photoClip">
      <rect x="72" y="100" width="296" height="280" rx="12"/>
    </clipPath>
  </defs>

  <!-- === BACKGROUND === -->
  <rect width="440" height="620" rx="24" fill="url(#cardBg)"/>
  <circle cx="220" cy="200" r="180" fill="url(#moodGlow)"/>

  <!-- === CELESTIAL DECORATIONS === -->
  <!-- scattered stars -->
  <g fill="#f0d890" filter="sparkle">
    <polygon points="60,40 62,46 68,46 63,50 65,56 60,52 55,56 57,50 52,46 58,46" opacity=".7"/>
    <polygon points="380,55 382,61 388,61 383,65 385,71 380,67 375,71 377,65 372,61 378,61" opacity=".5"/>
    <polygon points="45,180 47,184 51,184 48,187 49,191 45,188 41,191 42,187 39,184 43,184" opacity=".4"/>
    <polygon points="395,160 397,164 401,164 398,167 399,171 395,168 391,171 392,167 389,164 393,164" opacity=".6"/>
    <polygon points="90,70 91,73 94,73 92,75 93,78 90,76 87,78 88,75 86,73 89,73" opacity=".5"/>
    <polygon points="350,35 351,38 354,38 352,40 353,43 350,41 347,43 348,40 346,38 349,38" opacity=".4"/>
  </g>

  <!-- tiny dot stars -->
  <g fill="#e8d8c8">
    <circle cx="30" cy="100" r="1.2" opacity=".5"/>
    <circle cx="410" cy="120" r="1" opacity=".4"/>
    <circle cx="55" cy="250" r="1.3" opacity=".3"/>
    <circle cx="385" cy="240" r="1.5" opacity=".35"/>
    <circle cx="70" cy="350" r="1" opacity=".25"/>
    <circle cx="370" cy="330" r="1.2" opacity=".3"/>
    <circle cx="120" cy="30" r="1" opacity=".45"/>
    <circle cx="300" cy="25" r="1.3" opacity=".35"/>
    <circle cx="25" cy="420" r="1" opacity=".2"/>
    <circle cx="415" cy="400" r="1.2" opacity=".25"/>
  </g>

  <!-- crescent moon -->
  <g transform="translate(355,30)" filter="moonGlow">
    <circle cx="0" cy="0" r="22" fill="#f0e8d0" opacity=".85"/>
    <circle cx="8" cy="-6" r="18" fill="#3d2050"/>
    <circle cx="-5" cy="-3" r="2" fill="#f0d890" opacity=".3"/>
    <circle cx="2" cy="8" r="1.5" fill="#f0d890" opacity=".2"/>
  </g>

  <!-- decorative clouds -->
  <g fill="#5a3870" opacity=".2">
    <ellipse cx="80" cy="85" rx="40" ry="12"/>
    <ellipse cx="60" cy="82" rx="25" ry="10"/>
    <ellipse cx="360" cy="78" rx="35" ry="11"/>
    <ellipse cx="340" cy="75" rx="20" ry="9"/>
  </g>

  <!-- constellation lines -->
  <g stroke="#f0d890" stroke-width=".5" opacity=".15" fill="none">
    <line x1="60" y1="40" x2="90" y2="70"/>
    <line x1="90" y1="70" x2="45" y2="180"/>
    <line x1="380" y1="55" x2="395" y2="160"/>
    <line x1="350" y1="35" x2="380" y2="55"/>
  </g>

  <!-- === ORNATE FRAME === -->
  <g filter="softShadow">
    <!-- outer frame -->
    <rect x="56" y="84" width="328" height="312" rx="18" fill="url(#frameGold)"/>
    <!-- inner cutout -->
    <rect x="62" y="90" width="316" height="300" rx="15" fill="#1a0e20"/>
    <!-- inner gold trim -->
    <rect x="66" y="94" width="308" height="292" rx="13" fill="none" stroke="url(#frameInner)" stroke-width="1.5" opacity=".6"/>
    <!-- corner ornaments -->
    <g fill="#f0d890" opacity=".7">
      <!-- TL -->
      <circle cx="68" cy="96" r="4"/>
      <rect x="66" y="92" width="16" height="2" rx="1"/>
      <rect x="64" y="94" width="2" height="16" rx="1"/>
      <!-- TR -->
      <circle cx="372" cy="96" r="4"/>
      <rect x="358" y="92" width="16" height="2" rx="1"/>
      <rect x="374" y="94" width="2" height="16" rx="1"/>
      <!-- BL -->
      <circle cx="68" cy="384" r="4"/>
      <rect x="66" y="386" width="16" height="2" rx="1"/>
      <rect x="64" y="370" width="2" height="16" rx="1"/>
      <!-- BR -->
      <circle cx="372" cy="384" r="4"/>
      <rect x="358" y="386" width="16" height="2" rx="1"/>
      <rect x="374" y="370" width="2" height="16" rx="1"/>
    </g>
  </g>

  <!-- === USER'S PHOTO === -->
  <image href="${imageBase64}" x="72" y="100" width="296" height="280" clip-path="url(#photoClip)" preserveAspectRatio="xMidYMid slice"/>

  <!-- photo overlay vignette -->
  <rect x="72" y="100" width="296" height="280" rx="12" fill="none" stroke="#f0d89050" stroke-width="1"/>

  <!-- === TOP ORNAMENT (above frame) === -->
  <g transform="translate(220,78)" filter="goldGlow">
    <polygon points="0,-10 3,-3 10,-3 4,1 6,8 0,4 -6,8 -4,1 -10,-3 -3,-3" fill="#f0d890" opacity=".8"/>
  </g>

  <!-- small art supply decorations -->
  <g opacity=".5">
    <!-- pencil left -->
    <rect x="36" y="300" width="3" height="30" rx="1.5" fill="#f0d890" transform="rotate(-15,37,315)"/>
    <polygon points="36,330 37.5,338 39,330" fill="#e8b4c8" transform="rotate(-15,37,315)"/>
    <!-- brush right -->
    <rect x="401" y="280" width="3" height="28" rx="1.5" fill="#f0d890" transform="rotate(12,402,294)"/>
    <ellipse cx="402" cy="310" rx="4" ry="6" fill="${moodAccent.primary}" transform="rotate(12,402,294)" opacity=".7"/>
  </g>

  <!-- === PLAQUE === -->
  <g filter="softShadow">
    <rect x="60" y="416" width="320" height="180" rx="14" fill="url(#plaqueFill)"/>
    <rect x="64" y="420" width="312" height="172" rx="12" fill="none" stroke="#d4a850" stroke-width="1" opacity=".5"/>
    <rect x="68" y="424" width="304" height="164" rx="10" fill="none" stroke="#d4a850" stroke-width=".5" opacity=".3"/>
  </g>

  <!-- plaque top ornament -->
  <g transform="translate(220,412)">
    <ellipse cx="0" cy="0" rx="18" ry="8" fill="#e8d8b8" stroke="#d4a850" stroke-width="1"/>
    <text x="0" y="4" text-anchor="middle" font-size="8" fill="#8a6a30" font-family="Georgia,serif">✦</text>
  </g>

  <!-- plaque text -->
  <text x="220" y="454" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="400" font-size="17" fill="#3d2050">${name}</text>

  <!-- divider -->
  <line x1="120" y1="466" x2="320" y2="466" stroke="#d4a850" stroke-width=".8" opacity=".5"/>

  <!-- hall name -->
  <text x="220" y="486" text-anchor="middle" font-family="sans-serif" font-size="8" fill="#8a6a50" letter-spacing="3">${hall.toUpperCase()}</text>

  <!-- description -->
  <text x="220" y="508" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="9.5" fill="#6a5060">
    <tspan x="220" dy="0">${desc.slice(0, 40)}</tspan>
    <tspan x="220" dy="13">${desc.slice(40)}</tspan>
  </text>

  <!-- mood badge -->
  <g transform="translate(220,555)">
    <rect x="-40" y="-10" width="80" height="20" rx="10" fill="none" stroke="${moodAccent.primary}" stroke-width="1" opacity=".5"/>
    <text x="0" y="4" text-anchor="middle" font-family="sans-serif" font-size="7" fill="${moodAccent.primary}" letter-spacing="2">${esc(moodKey.toUpperCase())}</text>
  </g>

  <!-- bottom stars on plaque -->
  <text x="220" y="585" text-anchor="middle" font-size="7" fill="#d4a850" opacity=".5" letter-spacing="6">✦ ☽ ✦</text>

  <!-- === SPARKLE OVERLAYS === -->
  <g filter="sparkle">
    <circle cx="90" cy="110" r="2" fill="#f8f0e0" opacity=".6"/>
    <circle cx="350" cy="130" r="1.5" fill="#f8f0e0" opacity=".4"/>
    <circle cx="80" cy="370" r="1.8" fill="#f8f0e0" opacity=".5"/>
    <circle cx="360" cy="360" r="2" fill="#f8f0e0" opacity=".45"/>
    <circle cx="220" cy="95" r="1.5" fill="#f0d890" opacity=".5"/>
  </g>
</svg>`;

  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

// -- Mood-specific accent colors --

const MOOD_ACCENTS: Record<string, { primary: string; secondary: string; glow: string }> = {
  nostalgic:   { primary: "#c4a0d0", secondary: "#e8b4c8", glow: "#d4b0e0" },
  reflective:  { primary: "#b8a0c8", secondary: "#d0b8d8", glow: "#c8b0d8" },
  lonely:      { primary: "#a898c0", secondary: "#c8b0d0", glow: "#b8a8d0" },
  hopeful:     { primary: "#e8cd93", secondary: "#f0d8a0", glow: "#f0e0b0" },
  inspired:    { primary: "#f0d080", secondary: "#f8e0a0", glow: "#f8e8b8" },
  creative:    { primary: "#e0a0c0", secondary: "#f0b8d0", glow: "#f0c0d8" },
  healing:     { primary: "#90c0b0", secondary: "#b0d8c8", glow: "#a8d0c0" },
  overwhelmed: { primary: "#88a8c0", secondary: "#a0c0d8", glow: "#98b8d0" },
  ambitious:   { primary: "#d8a060", secondary: "#e8b878", glow: "#e0b070" },
  curious:     { primary: "#b8a0d0", secondary: "#d0b0e0", glow: "#c8a8d8" },
};

const HALL_FOR_MOOD: Record<string, string> = {
  nostalgic: "Hall of Nostalgia", reflective: "Hall of Nostalgia", lonely: "Hall of Nostalgia",
  hopeful: "Hall of Dreams", inspired: "Hall of Dreams", creative: "Hall of Dreams",
  healing: "Hall of Healing", overwhelmed: "Hall of Healing",
  ambitious: "Hall of Ambition",
  curious: "Hall of Curiosity",
};
