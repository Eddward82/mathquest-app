# MathQuest — Asset Specs

## Brand colours
- Primary:    #4C35DE
- Secondary:  #6C63FF
- Accent:     #8B5CF6

## Files needed

### icon.png — 1024 × 1024 px
App store icon (iOS + Android).
- Purple gradient background (#4C35DE → #6C63FF diagonal)
- White symbol centred: Σ (sigma), 🧮, or custom calculator mark
- Do NOT add rounded corners — the OS does this automatically
- No transparency

### adaptive-icon.png — 1024 × 1024 px
Android adaptive icon foreground layer.
- Same symbol on a TRANSPARENT background
- Keep symbol within the central 680 × 680 px safe zone
- Background colour is set in app.json (#4C35DE)

### splash.png — 1284 × 2778 px
Loading screen shown while app boots.
- Background: #4C35DE (already set in app.json — the image can be just the logo)
- White logo/symbol + "MathQuest" text centred
- Keep all content within central 800 × 800 px — edges get cropped

### notification-icon.png — 96 × 96 px
Android notification bar icon.
- White symbol on TRANSPARENT background
- Simple silhouette only — no gradients or colour fills

### favicon.png — 48 × 48 px
Browser tab icon for web builds.

## Free tools to create these
- **Figma** (figma.com) — design all assets and export at exact sizes
- **AppIcon.co** — paste one 1024px icon, generates all platform sizes automatically
- **Canva** — easy drag-and-drop with export size control

## Suggested design
White Σ (sigma) symbol at ~55% of canvas on a #4C35DE → #8B5CF6 diagonal gradient.
Subtle white dot-grid overlay at 6% opacity adds texture without clutter.
