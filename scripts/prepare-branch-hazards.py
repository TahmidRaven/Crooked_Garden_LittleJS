"""Build option B from the official Kenney Platformer Art Deluxe ZIP.

Usage: python3 scripts/prepare-branch-hazards.py path/to/archive.zip
Requires Pillow. Source artwork is cropped, recoloured and scaled, not redrawn.
"""
import io
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageEnhance


def sprite(archive, name, colour, size):
    image = Image.open(io.BytesIO(archive.read(name))).convert('RGBA')
    image = image.crop(image.getbbox())
    target = tuple(int(colour[i:i + 2], 16) for i in (1, 3, 5))
    pixels = []
    for r, g, b, alpha in image.getdata():
        factor = .68 + (.2126 * r + .7152 * g + .0722 * b) / 255 * .43
        pixels.append(tuple(min(255, round(v * factor)) for v in target) + (alpha,))
    image.putdata(pixels)
    return image.resize(size, Image.Resampling.LANCZOS)


with zipfile.ZipFile(sys.argv[1]) as archive:
    tile = Image.new('RGBA', (46, 26))
    up = sprite(archive, 'Request pack/Tiles/dirtCaveSpikeBottom.png', '#b48452', (12, 10))
    down = sprite(archive, 'Request pack/Tiles/dirtCaveSpikeTop.png', '#a8794b', (12, 9))
    for x in (4, 27):
        tile.alpha_composite(up, (x, 0))
        tile.alpha_composite(down, (x + 5, 17))
    destination = Path('public/assets/art/barbed-branch.png')
    tile.save(destination)
    print(destination)
    timber = Image.open(io.BytesIO(archive.read('Base pack/Tiles/bridge.png'))).convert('RGBA')
    timber = timber.crop(timber.getbbox())
    # Repeat only the fully opaque middle, not each plank's rounded end caps.
    timber = timber.crop((12, 0, timber.width - 12, timber.height))
    timber = ImageEnhance.Color(timber).enhance(.55)
    timber = ImageEnhance.Brightness(timber).enhance(.56)
    timber = timber.resize((38, 22), Image.Resampling.LANCZOS)
    assert timber.getchannel('A').getextrema() == (255, 255)
    destination = Path('public/assets/art/timber-tiles.png')
    timber.save(destination)
    print(destination)
