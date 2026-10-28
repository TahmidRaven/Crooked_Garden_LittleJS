"""Prepare the selected Kenney UI Pack button row in the garden palette."""
from pathlib import Path
import argparse
import hashlib
import io
import urllib.request
import zipfile

ROOT=Path(__file__).resolve().parent.parent
URL='https://kenney.nl/media/pages/assets/ui-pack/f651646eab-1718203990/kenney_ui-pack.zip'
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--archive',type=Path,help='Use an already downloaded official archive')
parser.add_argument('--row',type=int,choices=[4,5],default=4,help='Fourth row is flat-line; fifth row adds depth')
args=parser.parse_args()
data=args.archive.read_bytes() if args.archive else urllib.request.urlopen(URL,timeout=40).read()
archive=zipfile.ZipFile(io.BytesIO(data))
out=ROOT/'public/assets/ui'
out.mkdir(exist_ok=True)
normal={'#FFFFFF':'#AABD9B','#DADCE7':'#2A463B','#9696A3':'#142D27','#747487':'#061D1A','#FF0000':'#142D27'}
primary={'#FFFFFF':'#D4D9AB','#DADCE7':'#485D3F','#9696A3':'#243D2E','#747487':'#0D211B','#FF0000':'#243D2E'}
suffix='line' if args.row==4 else 'depth_line'
files=[
 (f'Vector/Grey/button_rectangle_{suffix}.svg','simple-button.svg',normal),
 (f'Vector/Grey/button_rectangle_{suffix}.svg','simple-button-primary.svg',primary),
 (f'Vector/Grey/button_square_{suffix}.svg','simple-square.svg',normal),
 (f'Vector/Grey/button_round_{suffix}.svg','simple-round.svg',normal),
 ('Vector/Extra/icon_repeat_light.svg','simple-repeat.svg',{'#FFFFFF':'#E7E9CF'}),
 ('Vector/Extra/icon_play_light.svg','simple-play.svg',{'#FFFFFF':'#E7E9CF'}),
 ('Vector/Yellow/star.svg','rating-star.svg',{}),
 ('Vector/Grey/star_outline.svg','rating-star-empty.svg',{'#FFFFFF':'#5F7860','#DADCE7':'#395449'})
]
for original,name,palette in files:
    source=archive.read(original)
    text=source.decode()
    for old,new in palette.items():text=text.replace(old,new)
    rendered=text.encode()
    (out/name).write_bytes(rendered)
    print(name,original,hashlib.sha256(rendered).hexdigest(),'source',hashlib.sha256(source).hexdigest())
notice=ROOT/'public/assets/licenses/kenney-ui-pack.txt'
notice.write_bytes(archive.read('License.txt'))
