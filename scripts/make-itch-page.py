"""Create itch page artwork using the game's original forest and credited sprites."""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/'public/assets/art'
OUT=ROOT/'screenshots/itch-page'
OUT.mkdir(parents=True,exist_ok=True)
FONT=Path('/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf')
if not FONT.exists():
    FONT=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')


def forest(w,h,seed,quiet=False):
    rng=random.Random(seed)
    image=Image.new('RGB',(w,h))
    pixels=image.load()
    for y in range(h):
        for x in range(w):
            if quiet:
                light=math.exp(-((abs(x-w/2)-w*.42)**2/(w*.16)**2+(y-h*.5)**2/(h*.7)**2))
            else:
                light=math.exp(-((x-w*.88)**2/(w*.5)**2+(y-h*.6)**2/(h*.9)**2))
            pixels[x,y]=(int(7+8*light),int(26+27*light),int(30+16*light))
    image=image.convert('RGBA')
    trees=Image.new('RGBA',image.size);draw=ImageDraw.Draw(trees)
    for x in range(-60,w+60,round(w/18)):
        width=rng.randint(round(w*.015),round(w*.04));lean=rng.randint(-35,35)
        draw.polygon([(x,0),(x+width,0),(x+width+lean,h),(x+lean,h)],fill=(3,20,24,90))
    image.alpha_composite(trees)
    for center,size,angle in [((0,h*.78),h*.7,-25),((w,h*.7),h*.75,155)]:
        source=Image.open(ART/'foliage.png').convert('RGBA')
        alpha=source.getchannel('A').point(lambda a:round(a*.65))
        source=Image.new('RGBA',source.size,'#294a3c');source.putalpha(alpha)
        source=source.resize((round(size),round(size)),Image.Resampling.LANCZOS).rotate(angle,Image.Resampling.BICUBIC,expand=True)
        image.alpha_composite(source,(round(center[0]-source.width/2),round(center[1]-source.height/2)))
    draw=ImageDraw.Draw(image)
    for _ in range(70 if quiet else 25):
        x,y=rng.randrange(w),rng.randrange(h)
        if quiet and w*.22<x<w*.78:
            continue
        r=rng.choice([1,1,2])
        draw.ellipse((x-r,y-r,x+r,y+r),fill='#687849')
    return image


def sprite(image,name,center,width,angle=0):
    source=Image.open(ART/name).convert('RGBA')
    source=source.resize((width,round(width*source.height/source.width)),Image.Resampling.LANCZOS)
    source=source.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    image.alpha_composite(source,(round(center[0]-source.width/2),round(center[1]-source.height/2)))


background=forest(1920,1080,45,quiet=True)
background.convert('RGB').save(OUT/'page-background-1920x1080.png',optimize=True)

banner=forest(1260,300,12)
draw=ImageDraw.Draw(banner)
sprite(banner,'after-hours-arcade.png',(77,47),26)
font=ImageFont.truetype(str(FONT),14)
draw.text((100,39),'AFTER HOURS ARCADE',font=font,fill='#e5dbb7')
font=ImageFont.truetype(str(FONT),77)
x=63;y=93
for text,color in [('CROOKED ','#f6f3d1'),('GARDEN','#c3e68f')]:
    draw.text((x,y+4),text,font=font,fill='#031a1d',stroke_width=2,stroke_fill='#031a1d')
    draw.text((x,y),text,font=font,fill=color)
    x+=draw.textlength(text,font=font)
font=ImageFont.truetype(str(FONT),17)
draw.text((67,210),'GROW. LOOP. BLOOM.',font=font,fill='#e4d38e')

# A winding, open vine rather than a capture diagram.
path=[]
points=[(920,261),(955,225),(1017,224),(1063,186),(1155,149)]
for i in range(len(points)-1):
    p0=points[max(0,i-1)];p1=points[i];p2=points[i+1];p3=points[min(len(points)-1,i+2)]
    for step in range(24):
        t=step/24
        path.append(tuple(round(.5*(2*p1[a]+(-p0[a]+p2[a])*t+(2*p0[a]-5*p1[a]+4*p2[a]-p3[a])*t*t+(-p0[a]+3*p1[a]-3*p2[a]+p3[a])*t*t*t)) for a in [0,1]))
for color,width in [('#173c2e',11),('#84b754',6),('#c4df86',2)]:
    draw.line(path,fill=color,width=width,joint='curve')
for x,y in [(958,225),(995,223),(1040,208),(1100,168)]:
    draw.ellipse((x-8,y-11,x+8,y-3),fill='#87af59',outline='#b4d587')
sprite(banner,'flower-pot.png',(920,271),49)
glow=Image.new('RGBA',banner.size);gd=ImageDraw.Draw(glow)
gd.ellipse((1080,70,1230,220),fill=(233,183,77,50))
banner.alpha_composite(glow.filter(ImageFilter.GaussianBlur(28)))
flower=Image.new('RGBA',(150,150))
for angle in range(0,360,72):
    petal=Image.new('RGBA',flower.size)
    ImageDraw.Draw(petal).ellipse((61,14,89,85),fill='#e6ad50')
    flower.alpha_composite(petal.rotate(angle,Image.Resampling.BICUBIC,center=(75,75)))
ImageDraw.Draw(flower).ellipse((57,57,93,93),fill='#ffe5a1')
banner.alpha_composite(flower,(1080,74))
sprite(banner,'bee-flight-2.png',(1086,250),77,-17)
banner.convert('RGB').save(OUT/'banner-1260x300.png',optimize=True)
