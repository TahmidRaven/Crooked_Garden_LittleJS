"""Compose itch cover art from the game's credited sprites and original garden shapes."""
from pathlib import Path
import argparse
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--wavedash',action='store_true',help='Render widescreen covers without overwriting the itch originals')
parser.add_argument('--version',type=int,choices=[3,4],default=3,help='V4 uses the current locally bundled Courier Prime lettering')
options=parser.parse_args()
ART = ROOT / 'public/assets/art'
OUT = ROOT / 'screenshots'
S = 3
W, H = 630, 500
random.seed(14)
backdrop = Image.new('RGB',(W,H))
pixels = backdrop.load()
for y in range(H):
    for x in range(W):
        light=math.exp(-((x-450)**2/(260**2)+(y-345)**2/(200**2)))
        pixels[x,y]=(int(5+17*light),int(22+45*light),int(27+28*light))
image=backdrop.resize((W*S,H*S),Image.Resampling.BICUBIC).convert('RGBA')
draw=ImageDraw.Draw(image)
for x,width,lean in [(-15,70,12),(90,32,-15),(158,22,16),(225,45,-9),(317,24,18),(389,34,-12),(482,18,20),(561,37,28),(622,47,-15)]:
    draw.polygon([(x*S,0),((x+width)*S,0),((x+width+lean)*S,H*S),((x+lean)*S,H*S)],fill=(5,26,29,150))
shafts=Image.new('RGBA',image.size);sd=ImageDraw.Draw(shafts)
sd.polygon([(520*S,0),(565*S,0),(345*S,500*S),(290*S,500*S)],fill=(168,204,136,12))
sd.polygon([(590*S,0),(605*S,0),(465*S,500*S),(425*S,500*S)],fill=(184,214,148,14))
image.alpha_composite(shafts.filter(ImageFilter.GaussianBlur(7*S)))


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


for center, width, angle in [((-10, 380), 275, -25), ((650, 400), 275, 155)]:
    source = Image.open(ART/'foliage.png').convert('RGBA')
    alpha=source.getchannel('A').point(lambda a: round(a*.75))
    source=Image.new('RGBA',source.size,'#305341')
    source.putalpha(alpha)
    source = source.resize((width*S, width*S)).rotate(angle, expand=True)
    image.alpha_composite(source, (round(center[0]*S-source.width/2), round(center[1]*S-source.height/2)))
draw = ImageDraw.Draw(image)
for _ in range(38):
    x,y=random.randrange(18,612),random.randrange(22,485)
    r=random.choice([.7,1,1.4])*S
    draw.ellipse((x*S-r,y*S-r,x*S+r,y*S+r), fill=(111,137,78,150))

# Key art, not a diagram: a growing vine zigzags between mossy shelves toward
# the large bloom. No loop, enclosure, capture text or UI.
draw=ImageDraw.Draw(image)
draw.rounded_rectangle((175*S,360*S,327*S,382*S),radius=8*S,fill='#112e2d')
draw.rounded_rectangle((174*S,357*S,328*S,365*S),radius=4*S,fill='#53754b')
for x in [187,211,242,270,306]:
    draw.ellipse((x*S,349*S,(x+7)*S,360*S),fill='#718f50')
points=[(105,441),(159,410),(250,422),(318,407),(352,375),(356,340),(414,338),(467,328),(490,305)]
path=[]
for i in range(len(points)-1):
    p0=points[max(0,i-1)];p1=points[i];p2=points[i+1];p3=points[min(len(points)-1,i+2)]
    for step in range(24):
        t=step/24
        xy=[]
        for axis in range(2):
            a,b,c,d=p0[axis],p1[axis],p2[axis],p3[axis]
            xy.append(round(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)*S))
        path.append(tuple(xy))
path.append((490*S,305*S))
draw=ImageDraw.Draw(image)
for color,width,offset in [('#041d1e',15,(0,4)),('#416537',10,(0,0)),('#84b754',6,(0,0)),('#c4df86',2,(-1,-1))]:
    draw.line([(x+offset[0]*S,y+offset[1]*S) for x,y in path], fill=color, width=width*S, joint='curve')
leaves=[]
travel=0
for a,b in zip(path,path[1:]):
    travel+=math.dist(a,b)/S
    if travel>57:
        travel=0
        angle=-math.degrees(math.atan2(b[1]-a[1],b[0]-a[0]))+(-30 if len(leaves)%2 else 30)
        leaves.append((b[0]/S,b[1]/S,angle))
for x,y,angle in leaves:
    leaf=Image.new('RGBA',(30*S,18*S))
    ld=ImageDraw.Draw(leaf)
    ld.ellipse((2*S,3*S,27*S,15*S),fill='#80ad55',outline='#bed88b',width=S)
    ld.line((3*S,10*S,26*S,8*S),fill='#c1dc8c',width=S)
    leaf=leaf.rotate(angle,Image.Resampling.BICUBIC,expand=True)
    image.alpha_composite(leaf,(round(x*S-leaf.width/2),round(y*S-leaf.height/2-5*S)))

sprite('flower-pot.png',(105,456),82)
# Same petal shapes and palette as the in-game marigold.
flower=Image.new('RGBA',(120*S,120*S));fd=ImageDraw.Draw(flower)
for angle in range(0,360,72):
    petal=Image.new('RGBA',flower.size);pd=ImageDraw.Draw(petal)
    pd.ellipse((48*S,14*S,72*S,68*S),fill='#e6ad50')
    flower.alpha_composite(petal.rotate(angle,Image.Resampling.BICUBIC,center=(60*S,60*S)))
fd=ImageDraw.Draw(flower);fd.ellipse((46*S,46*S,74*S,74*S),fill='#ffe5a1')
flower=flower.resize((174*S,174*S),Image.Resampling.LANCZOS)
warmth=Image.new('RGBA',image.size);wd=ImageDraw.Draw(warmth)
wd.ellipse((415*S,230*S,565*S,380*S),fill=(238,193,85,50))
image.alpha_composite(warmth.filter(ImageFilter.GaussianBlur(26*S)))
image.alpha_composite(flower,(403*S,218*S))
# Flight strokes are decorative motion cues rather than a closing stem.
draw=ImageDraw.Draw(image)
draw.arc((170*S,273*S,281*S,345*S),200,255,fill='#91b17b',width=2*S)
draw.arc((184*S,278*S,285*S,344*S),203,243,fill='#4e7961',width=2*S)
sprite('bee-flight-2.png',(272,301),90,-23)
sprite('fly-flight-1.png',(445,423),76,22)
for x,y in [(380,282),(420,367),(530,401),(150,322)]:
    draw=ImageDraw.Draw(image)
    draw.line((x*S,(y-4)*S,x*S,(y+4)*S),fill='#dddfa3',width=S)
    draw.line(((x-4)*S,y*S,(x+4)*S,y*S),fill='#dddfa3',width=S)

font_path=Path('/System/Library/Fonts/Supplemental/Arial Rounded Bold.ttf')
if not font_path.exists():
    font_path=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')
if options.version==4:
    font_path=ROOT/'public/assets/fonts/courier-prime-bold.ttf'
if options.wavedash:
    from wavedash_cover import render_wavedash_cover
    render_wavedash_cover(image,font_path,ART,OUT,version=options.version)
    raise SystemExit
def text_center(text,y,size,color,stroke=0):
    font=ImageFont.truetype(str(font_path),size*S)
    box=font.getbbox(text);x=((W if options.version==4 else W-34)*S-(box[2]-box[0]))/2
    lettering=Image.new('RGBA',image.size)
    draw=ImageDraw.Draw(lettering)
    draw.text((x,y*S+5*S),text,font=font,fill='#031a1d',stroke_width=stroke*S,stroke_fill='#031a1d')
    draw.text((x,y*S),text,font=font,fill=color,stroke_width=stroke*S,stroke_fill='#031a1d')
    image.alpha_composite(lettering.rotate(3,Image.Resampling.BICUBIC,center=(290*S,150*S)))

if options.version==4:
    text_center('CROOKED',42,116,'#f6f3d1',1)
    text_center('GARDEN',118,136,'#c3e68f',1)
else:
    text_center('CROOKED',53,77,'#f6f3d1',2)
    text_center('GARDEN',132,91,'#c3e68f',2)
font=ImageFont.truetype(str(font_path),(14 if options.version==4 else 12)*S)
ImageDraw.Draw(image).text((70*S,235*S),'GROW. LOOP. BLOOM.',font=font,fill='#e4d38e')
sprite('after-hours-arcade.png',(81,27),19)
font=ImageFont.truetype(str(font_path),10*S)
ImageDraw.Draw(image).text((97*S,21*S),'AFTER HOURS ARCADE',font=font,fill='#eadfbb')
OUT.mkdir(exist_ok=True)
for width,height in [(1260,1000),(630,500)]:
    path=OUT/f'cover-v{options.version}-{width}x{height}.png'
    image.convert('RGB').resize((width,height),Image.Resampling.LANCZOS).save(path,optimize=True)
    print(path)
