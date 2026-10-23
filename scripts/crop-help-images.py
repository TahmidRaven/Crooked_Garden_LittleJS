"""Make small, lossless guide illustrations from the real showcase screenshots."""
from pathlib import Path
import hashlib
import json
from PIL import Image, ImageDraw

OUT = Path('public/assets/help')
OUT.mkdir(parents=True, exist_ok=True)


def crop(source, box, name=None):
    # Showcase desktop captures use two physical pixels per CSS pixel.
    image = Image.open(Path('screenshots') / source).convert('RGB')
    image = image.crop(tuple(value * 2 for value in box))
    if name:
        image.save(OUT / name, optimize=True)
    return image


crop('09-progress-with-bugs.png', (600, 500, 850, 680), 'steering.png')
pickups = Image.new('RGBA', (440, 180))
mask = Image.new('L', (110, 110))
ImageDraw.Draw(mask).ellipse((0, 0, 109, 109), fill=255)
flower = crop('08-bugs-before-capture.png', (532, 395, 587, 450))
water = crop('08-bugs-before-capture.png', (469, 302, 524, 357))
pickups.paste(flower, (55, 35), mask)
pickups.paste(water, (275, 35), mask)
pickups.save(OUT / 'flowers-water.png', optimize=True)
crop('08-bugs-before-capture.png', (585, 335, 855, 515), 'loop-before.png')
crop('02-double-catch.png', (585, 335, 855, 515), 'loop-after.png')
crop('09-progress-with-bugs.png', (625, 403, 740, 475), 'stunned-bugs.png')
# This old button collage is no longer used; readable HTML control labels replace it.
(OUT / 'pause-rewind.png').unlink(missing_ok=True)

manifest = {
    'generator': 'scripts/crop-help-images.py',
    'description': 'Cropped real gameplay screenshots. Flower and water close-ups are arranged side by side with circular masks. No new gameplay elements added.',
    'sources': [
        {'path': f'screenshots/{name}', 'sha256': hashlib.sha256((Path('screenshots') / name).read_bytes()).hexdigest()}
        for name in ['09-progress-with-bugs.png', '08-bugs-before-capture.png', '02-double-catch.png']
    ],
    'files': [
        {'path': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'size': list(Image.open(path).size)}
        for path in sorted(OUT.glob('*.png'))
    ]
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
