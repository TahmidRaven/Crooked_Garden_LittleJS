# Itch page theme

- **Banner:** `banner-960x240.png` — smaller version for the page banner. Fits a 960-pixel-wide page column without cropping. The original `banner-1260x300.png` is kept as an alternative. If it still looks small, check the theme editor's banner sizing/page width; the displayed size depends on those settings.
- **Page background:** `page-background-1920x1080.png` — upload as the page background, centred, no tiling. Use cover/stretch-to-fit if offered. The centre is deliberately quiet so page content stays readable.
- **Embed BG:** `embed-background-1280x720.png` — upload in the theme editor's Embed BG / background image option. This is the click-to-play background behind itch's launch button, not the page background. The centre is intentionally clear; no play button is baked in. Enable **Click to Play** in the game's embed options. Use `#071f24` for any fallback/gradient colour.

Matching optional colours:

| Setting | Colour |
| --- | --- |
| Page fallback / Embed BG | `#071f24` |
| Content panel | `#0b2928` |
| Text | `#edf0cc` |
| Links / buttons | `#e6c77e` |
| Button text | `#20382b` |

Original promotional composition with the game's credited Kenney foliage/bee/planter and studio-owned raven mark. Not a gameplay screenshot. Regenerate with `python3 scripts/make-itch-page.py` (Pillow; local Arial Rounded Bold or DejaVu Sans Bold).
