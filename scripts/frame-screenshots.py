from PIL import Image, ImageDraw, ImageFilter


def backdrop(size):
    image = Image.new('RGB', size)
    draw = ImageDraw.Draw(image)
    for y in range(size[1]):
        t = y / size[1]
        draw.line((0, y, size[0], y), fill=(int(10+9*t), int(28+19*t), int(31+14*t)))
    return image.convert('RGBA')


def shadow(image, box, radius):
    layer = Image.new('RGBA', image.size)
    ImageDraw.Draw(layer).rounded_rectangle(box, radius, fill=(0, 0, 0, 160))
    image.alpha_composite(layer.filter(ImageFilter.GaussianBlur(30)))


image = backdrop((1200, 1600))
shot = Image.open('screenshots/10-mobile-with-bugs.png').convert('RGBA')
shot = shot.resize((560, 1212), Image.Resampling.LANCZOS)
shadow(image, (292, 155, 908, 1470), 68)
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((294, 132, 906, 1458), 66, fill='#111719', outline='#5b6968', width=3)
draw.rounded_rectangle((304, 142, 896, 1448), 58, fill='#060c0e', outline='#263532', width=2)
draw.rounded_rectangle((468, 157, 732, 175), 9, fill='#1c2729')
draw.ellipse((752, 157, 770, 175), fill='#1d3339')
draw.rounded_rectangle((907, 360, 913, 474), 3, fill='#687775')
draw.rounded_rectangle((287, 310, 293, 368), 3, fill='#687775')
draw.rounded_rectangle((287, 388, 293, 446), 3, fill='#687775')
image.alpha_composite(shot, (320, 200))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((512, 1426, 688, 1432), 3, fill='#b4c5bb')
image.convert('RGB').save('screenshots/06-phone-emulator-mockup.png')

image = backdrop((1600, 1100))
shadow(image, (65, 109, 1535, 1049), 25)
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((60, 70, 1540, 1030), 20, fill='#162b2c', outline='#45615a', width=2)
for x, color in [(89, '#db8b79'), (113, '#e8c984'), (137, '#86b599')]:
    draw.ellipse((x-6, 92, x+6, 104), fill=color)
draw.rounded_rectangle((470, 86, 1130, 110), 8, fill='#0a1d20')
shot = Image.open('screenshots/08-bugs-before-capture.png').convert('RGBA')
shot = shot.resize((1440, 900), Image.Resampling.LANCZOS)
image.alpha_composite(shot, (80, 120))
image.convert('RGB').save('screenshots/07-desktop-window-mockup.png')
