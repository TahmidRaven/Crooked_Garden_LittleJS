"""Recompose the existing V3 key art for Wavedash's 16:9 cover slot."""
import math
import random
from PIL import Image, ImageChops, ImageDraw, ImageFont


def render_wavedash_cover(scene,font_path,art,out):
    width,height=1920,1080
    image=Image.new('RGB',(width,height))
    pixels=image.load()
    for y in range(height):
        for x in range(width):
            light=math.exp(-((x-1390)**2/760**2+(y-765)**2/520**2))
            pixels[x,y]=(int(5+17*light),int(22+45*light),int(27+28*light))
    image=image.convert('RGBA')
    trees=Image.new('RGBA',image.size)
    draw=ImageDraw.Draw(trees)
    rng=random.Random(14)
    for x in range(-60,width+100,125):
        trunk=rng.randrange(25,75);lean=rng.randrange(-35,35)
        draw.polygon([(x,0),(x+trunk,0),(x+trunk+lean,height),(x+lean,height)],fill=(5,26,29,120))
    image.alpha_composite(trees)

    # Uniformly scale the original title-free composition; keep pot/vine/bloom intact.
    # Feather only the empty upper/left background to join the wider forest.
    garden=scene.resize((1260,1000),Image.Resampling.LANCZOS)
    horizontal=Image.new('L',(garden.width,1),255)
    vertical=Image.new('L',(1,garden.height),255)
    for x in range(220):horizontal.putpixel((x,0),round(255*(x/219)**2))
    for y in range(120):vertical.putpixel((0,y),round(255*y/119))
    mask=ImageChops.multiply(horizontal.resize(garden.size),vertical.resize(garden.size))
    garden.putalpha(ImageChops.multiply(garden.getchannel('A'),mask))
    image.alpha_composite(garden,(660,80))

    title=Image.new('RGBA',image.size)
    draw=ImageDraw.Draw(title)
    for text,y,size,color in [('CROOKED',248,151,'#f6f3d1'),('GARDEN',413,178,'#c3e68f')]:
        font=ImageFont.truetype(str(font_path),size)
        draw.text((110,y+9),text,font=font,fill='#031a1d',stroke_width=4,stroke_fill='#031a1d')
        draw.text((110,y),text,font=font,fill=color,stroke_width=2,stroke_fill='#031a1d')
    image.alpha_composite(title.rotate(3,Image.Resampling.BICUBIC,center=(520,400)))
    draw=ImageDraw.Draw(image)
    draw.text((110,650),'GROW. LOOP. BLOOM.',font=ImageFont.truetype(str(font_path),27),fill='#e4d38e')
    logo=Image.open(art/'after-hours-arcade.png').convert('RGBA').resize((48,48),Image.Resampling.LANCZOS)
    image.alpha_composite(logo,(110,88))
    draw=ImageDraw.Draw(image)
    draw.text((178,112),'AFTER HOURS ARCADE',font=ImageFont.truetype(str(font_path),26),anchor='lm',fill='#eadfbb')
    out.mkdir(exist_ok=True)
    for w,h in [(1920,1080),(1280,720)]:
        path=out/f'cover-v3-wavedash-{w}x{h}.png'
        image.convert('RGB').resize((w,h),Image.Resampling.LANCZOS).save(path,optimize=True)
        print(path)
