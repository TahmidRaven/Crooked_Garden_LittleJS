// Artwork stays within the existing lethal rectangles; collision/game rules are unchanged.
export function branchSegments(rect,tileWidth=46){
  const segments=[];
  for(let offset=0;offset<rect.w;offset+=tileWidth){
    const width=Math.min(tileWidth,rect.w-offset);
    segments.push({x:rect.x+offset,y:rect.y,width,height:rect.h});
  }
  return segments;
}

export function renderBranchHazard(c,rect,image,timber){
  // A continuous solid core prevents subpixel seams or missing tiles from exposing the backdrop.
  c.fillStyle='#73533d';c.fillRect(rect.x,rect.y+rect.h*6/26,rect.w,rect.h*14/26);
  if(timber){
    const base={...rect,y:rect.y+rect.h*6/26,h:rect.h*14/26};
    for(const part of branchSegments(base,timber.width))c.drawImage(timber,0,0,part.width,timber.height,part.x,part.y,part.width,part.height);
  }
  if(image){
    // Hooks render last and overlap the timber surfaces by 2px, visibly in front of the wood.
    for(const part of branchSegments(rect,image.width)){
      c.drawImage(image,0,0,part.width,10,part.x,rect.y,part.width,rect.h*8/26);
      c.drawImage(image,0,17,part.width,9,part.x,rect.y+rect.h*18/26,part.width,rect.h*8/26);
    }
    return;
  }
  // Keep hazards visible if the optional sprite cannot load.
  c.fillStyle='#b48452';
  for(let x=rect.x;x<rect.x+rect.w;x+=23){
    const width=Math.min(12,rect.x+rect.w-x);
    for(const flip of [false,true]){
      // Bent woody hooks, not the old straight triangular fallback spikes.
      c.beginPath();
      for(const [i,[px,py]] of [[0,.4],[.3,.29],[.27,0],[.63,.12],[.49,.21],[.72,.33],[1,.4]].entries()){
        const edge=py/.4*8/26;
        const y=rect.y+(flip?1-edge:edge)*rect.h;
        if(i)c.lineTo(x+px*width,y);else c.moveTo(x+px*width,y);
      }
      c.closePath();c.fill();
    }
  }
}
