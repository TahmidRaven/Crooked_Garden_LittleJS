# Kenney planter source

The unchanged `plantSmall1.obj` and `plantSmall1.mtl` come from **Kenney Furniture Kit**:

- Creator: https://kenney.nl / https://kenney.itch.io/
- Pack: https://kenney.nl/assets/furniture-kit
- Archive: https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip
- Original directory: `Models/OBJ format/`
- License: CC0 1.0 Universal. The archive notice is included at `public/assets/licenses/kenney-furniture.txt`.

Only the container's wood-material geometry is rendered. The plant is omitted and a dark soil surface is added. This is a 2D render of a pre-existing Kenney asset, not an AI-generated model. No 3D runtime is included in the game.

Regenerate the high-resolution transparent PNG with:

```sh
env NODE_OPTIONS='' npm run art:pot
```

The script uses the existing Playwright/Chromium development dependency and prints image dimensions, the soil anchor, and the PNG hash. If rendering settings change, update `src/pot.js` and `public/assets/manifest.json` to match. The source hashes and rendered image are checked by the tests. Only the PNG/notice are shipped in the game ZIP; this source directory is retained in the repository for provenance and reproducibility.
