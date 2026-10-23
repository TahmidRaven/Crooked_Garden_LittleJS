"""Encode the recorded gameplay at 10 fps, with a readable hold before looping."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT=Path(__file__).resolve().parent.parent
frames=json.loads((ROOT/'artifacts/help-motion/frames.json').read_text())
out=ROOT/'public/assets/help'
loop=frames['loop']
burst=next(i for i,frame in enumerate(loop) if frame['burst']>0)
sequences={'grow':frames['grow'], 'capture':loop, 'burst':loop[max(0,burst-2):min(len(loop),burst+10)]}
manifest={'recorder':'scripts/capture-help-motion.mjs','encoder':'scripts/encode-help-motion.py','files':[]}
for name,sequence in sequences.items():
    images=[]
    for frame in sequence:
        image=Image.open(ROOT/frame['path']).convert('RGB')
        width=480
        image=image.resize((width,round(width*image.height/image.width)),Image.Resampling.LANCZOS)
        images.append(image)
    # One palette avoids colour shimmer and lets GIF store small frame deltas.
    palette_source=Image.new('RGB',(images[0].width,images[0].height*3))
    for j,i in enumerate([0,len(images)//2,len(images)-1]):
        palette_source.paste(images[i],(0,j*images[0].height))
    palette=palette_source.quantize(colors=96,method=Image.Quantize.MEDIANCUT)
    images=[image.quantize(palette=palette,dither=Image.Dither.NONE) for image in images]
    durations=[100]*len(images)
    durations[0]=500
    durations[-1]=1400 if name=='capture' else 900
    path=out/f'{name}.gif'
    images[0].save(path,save_all=True,append_images=images[1:],duration=durations,loop=0,optimize=True,disposal=1)
    with Image.open(path) as gif:
        manifest['files'].append({'path':path.name,'size':list(gif.size),'frames':gif.n_frames,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
(out/'motion-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
