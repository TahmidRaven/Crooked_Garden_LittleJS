"""Render PNG/ICO fallbacks matching the original flower in public/favicon.svg."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / 'public'
S = 8
image = Image.new('RGBA', (64*S, 64*S))
ImageDraw.Draw(image).rounded_rectangle((0, 0, 64*S-1, 64*S-1), radius=14*S, fill='#0b2928')
for angle in range(0, 360, 72):
    petal = Image.new('RGBA', image.size)
    ImageDraw.Draw(petal).ellipse((25*S, 8*S, 39*S, 36*S), fill='#e6ad50')
    image.alpha_composite(petal.rotate(-angle, Image.Resampling.BICUBIC, center=(32*S, 32*S)))
ImageDraw.Draw(image).ellipse((23*S, 23*S, 41*S, 41*S), fill='#ffe5a1')
image.resize((32, 32), Image.Resampling.LANCZOS).save(OUT / 'favicon-32.png', optimize=True)
image.resize((180, 180), Image.Resampling.LANCZOS).save(OUT / 'apple-touch-icon.png', optimize=True)
image.save(OUT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
