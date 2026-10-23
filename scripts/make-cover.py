"""Compose itch cover art from the game's credited sprites and original garden shapes."""
from pathlib import Path
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / 'public/assets/art'
OUT = ROOT / 'screenshots'
S = 3
W, H = 630, 500
random.seed(14)
image = Image.new('RGBA', (W*S, H*S))
draw = ImageDraw.Draw(image)
for y in range(H*S):
    t = y/(H*S)
    draw.line((0, y, W*S, y), fill=(int(7+7*t), int(26+23*t), int(30+12*t)))
for x in range(-30, 680, 49):
    draw.polygon([(x*S, 0), ((x+24)*S, 0), ((x+12)*S, H*S), ((x-13)*S, H*S)], fill=(14, 45, 43, 255))


def sprite(name, center, width, angle=0):
    source = Image.open(ART/name).convert('RGBA')
    if name.startswith('fly-'):
        # Match the game's warmHunterPixels treatment, leaving wings/alpha alone.
        pixels = []
        for r,g,b,a in source.getdata():
            light = (r+g+b)/3
            if a and max(r,g,b)<155 and max(r,g,b)-min(r,g,b)<=12:
                if light<72:
                    r,g,b=round(46+light*.5),round(28+light*.3),round(17+light*.18)
                else:
                    t=min(1,(light-72)/83)
                    r,g,b=round(190+60*t),round(113+78*t),round(40+45*t)
            pixels.append((r,g,b,a))
        source.putdata(pixels)
    source = source.resize((round(width*S), round(width*S*source.height/source.width)), Image.Resampling.LANCZOS)
    if angle:
        source = source.rotate(angle, Image.Resampling.BICUBIC, expand=True)
    image.alpha_composite(source, (round(center[0]*S-source.width/2), round(center[1]*S-source.height/2)))


for center, width, angle in [((-15, 370), 200, -25), ((645, 360), 190, 155)]:
    source = Image.open(ART/'foliage.png').convert('RGBA')
    source.putalpha(source.getchannel('A').point(lambda a: round(a*.15)))
    source = source.resize((width*S, width*S)).rotate(angle, expand=True)
    image.alpha_composite(source, (round(center[0]*S-source.width/2), round(center[1]*S-source.height/2)))
draw = ImageDraw.Draw(image)
for _ in range(38):
    x,y=random.randrange(18,612),random.randrange(22,485)
    r=random.choice([.7,1,1.4])*S
    draw.ellipse((x*S-r,y*S-r,x*S+r,y*S+r), fill=(111,137,78,150))

# Rounded, deliberately crooked stem with a visible loop.
points=[(105,441),(171,400),(229,400),(229,294),(423,294),(423,400),(229,400),(514,400),(514,275)]
def rounded_path(points, radius=18):
    result=[points[0]]
    for i in range(1,len(points)-1):
        a,b,c=points[i-1:i+2]
        ab=math.dist(a,b);bc=math.dist(b,c)
        r=min(radius,ab/3,bc/3)
        p=(b[0]+(a[0]-b[0])*r/ab,b[1]+(a[1]-b[1])*r/ab)
        q=(b[0]+(c[0]-b[0])*r/bc,b[1]+(c[1]-b[1])*r/bc)
        result.append(p)
        for j in range(1,17):
            t=j/16
            result.append(((1-t)**2*p[0]+2*(1-t)*t*b[0]+t*t*q[0],(1-t)**2*p[1]+2*(1-t)*t*b[1]+t*t*q[1]))
    result.append(points[-1])
    return [(round(x*S),round(y*S)) for x,y in result]
path=rounded_path(points)
for color,width,offset in [('#041d1e',15,(0,4)),('#416537',10,(0,0)),('#84b754',6,(0,0)),('#c4df86',2,(-1,-1))]:
    draw.line([(x+offset[0]*S,y+offset[1]*S) for x,y in path], fill=color, width=width*S, joint='curve')
for x,y,angle in [(158,405,25),(211,400,-20),(229,357,40),(239,305,-30),(280,294,20),(369,294,-25),(423,336,35),(423,382,-30),(310,400,25),(465,400,-25),(514,355,30),(514,309,-20)]:
    leaf=Image.new('RGBA',(30*S,18*S))
    ld=ImageDraw.Draw(leaf)
    ld.ellipse((2*S,3*S,27*S,15*S),fill='#80ad55',outline='#bed88b',width=S)
    ld.line((3*S,10*S,26*S,8*S),fill='#c1dc8c',width=S)
    leaf=leaf.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    image.alpha_composite(leaf,(round(x*S-leaf.width/2),round(y*S-leaf.height/2-5*S)))

sprite('flower-pot.png',(105,452),61)
# Same petal shapes and palette as the in-game marigold.
flower=Image.new('RGBA',(120*S,120*S));fd=ImageDraw.Draw(flower)
for angle in range(0,360,72):
    petal=Image.new('RGBA',flower.size);pd=ImageDraw.Draw(petal)
    pd.ellipse((48*S,14*S,72*S,68*S),fill='#e6ad50')
    flower.alpha_composite(petal.rotate(angle,Image.Resampling.BICUBIC,center=(60*S,60*S)))
fd=ImageDraw.Draw(flower);fd.ellipse((46*S,46*S,74*S,74*S),fill='#ffe5a1')
image.alpha_composite(flower,(454*S,215*S))
sprite('bee-flight-2.png',(287,338),66,-12)
sprite('fly-flight-1.png',(366,360),65,10)

font_path=Path('/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf')
if not font_path.exists():
    font_path=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
def text_center(text,y,size,color,stroke=0):
    font=ImageFont.truetype(str(font_path),size*S)
    box=font.getbbox(text);x=(W*S-(box[2]-box[0]))/2
    draw=ImageDraw.Draw(image)
    draw.text((x,y*S+5*S),text,font=font,fill='#031a1d',stroke_width=stroke*S,stroke_fill='#031a1d')
    draw.text((x,y*S),text,font=font,fill=color,stroke_width=stroke*S,stroke_fill='#031a1d')

text_center('CROOKED',47,77,'#f6f3d1',2)
text_center('GARDEN',122,91,'#c3e68f',2)
text_center('GROW. LOOP. BLOOM.',226,14,'#e4d38e')
sprite('after-hours-arcade.png',(227,26),19)
font=ImageFont.truetype(str(font_path),10*S)
ImageDraw.Draw(image).text((243*S,20*S),'AFTER HOURS ARCADE',font=font,fill='#eadfbb')
OUT.mkdir(exist_ok=True)
image.convert('RGB').resize((1260,1000),Image.Resampling.LANCZOS).save(OUT/'cover-1260x1000.png',optimize=True)
image.convert('RGB').resize((630,500),Image.Resampling.LANCZOS).save(OUT/'cover-630x500.png',optimize=True)
