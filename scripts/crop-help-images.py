"""Make small, lossless guide illustrations from the real showcase screenshots."""
from pathlib import Path
import hashlib
import json
from PIL import Image

OUT = Path('public/assets/help')
OUT.mkdir(parents=True, exist_ok=True)


def crop(source, box, name):
    # Showcase desktop captures use two physical pixels per CSS pixel.
    image = Image.open(Path('screenshots') / source).convert('RGB')
    image = image.crop(tuple(value * 2 for value in box))
    image.save(OUT / name, optimize=True)
    return image


crop('09-progress-with-bugs.png', (600, 500, 850, 680), 'steering.png')
crop('08-bugs-before-capture.png', (445, 295, 595, 455), 'flowers-water.png')
crop('08-bugs-before-capture.png', (570, 345, 755, 495), 'loop-before.png')
crop('02-double-catch.png', (570, 345, 755, 495), 'loop-after.png')
crop('09-progress-with-bugs.png', (605, 370, 750, 475), 'stunned-bugs.png')
pause = crop('09-progress-with-bugs.png', (1208, 9, 1266, 65), 'pause-button.png')
rewind = crop('09-progress-with-bugs.png', (474, 720, 540, 790), 'rewind-button.png')
controls = Image.new('RGB', (420, 160), '#0b2528')
controls.paste(pause, (55, 24))
controls.paste(rewind, (235, 10))
controls.save(OUT / 'pause-rewind.png', optimize=True)
# Only ship the assembled control illustration, not its temporary crop parts.
(OUT / 'pause-button.png').unlink()
(OUT / 'rewind-button.png').unlink()

manifest = {
    'generator': 'scripts/crop-help-images.py',
    'description': 'Cropped real gameplay screenshots; controls image combines the actual Pause and Rewind buttons. No new gameplay elements added.',
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
