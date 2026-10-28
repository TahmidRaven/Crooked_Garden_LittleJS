"""Prepare Eder Muniz's licensed forest for this game's backdrop.

Usage: python3 scripts/prepare-dark-forest.py path/to/Free-Pixel-Art-Forest.zip
Requires Pillow. Use only with the author's included license and credit.
"""
import io
import sys
import zipfile
from pathlib import Path
from PIL import Image, ImageCms

with zipfile.ZipFile(sys.argv[1]) as archive:
    image = Image.open(io.BytesIO(archive.read(
        'Free Pixel Art Forest/Preview/Background.png'))).convert('RGB')
    # Preserve the Photoshop source's appearance in browser sRGB canvases.
    if image.info.get('icc_profile'):
        image = ImageCms.profileToProfile(image,
            ImageCms.ImageCmsProfile(io.BytesIO(image.info['icc_profile'])),
            ImageCms.createProfile('sRGB'), outputMode='RGB')
    image.info.clear()
    # Keep the shaded canopy/trunks/forest floor, excluding the bright sky above them.
    image = image.crop((0, 350, 928, 760))
    # Blend the wrap boundary offline so the runtime can scroll without a hard seam.
    overlap = 64
    result = image.crop((0, 0, image.width - overlap, image.height))
    mask = Image.new('L', (overlap, image.height))
    mask.putdata([round(x / (overlap - 1) * 255)
                  for y in range(image.height) for x in range(overlap)])
    seam = Image.composite(image.crop((0, 0, overlap, image.height)),
                           image.crop((image.width - overlap, 0, image.width, image.height)), mask)
    result.paste(seam, (0, 0))
    result.info.clear()
    result.save('public/assets/art/dark-forest.png')
    Path('public/assets/licenses/eder-forest.txt').write_bytes(
        archive.read('Free Pixel Art Forest/license.txt'))
    print('public/assets/art/dark-forest.png')
