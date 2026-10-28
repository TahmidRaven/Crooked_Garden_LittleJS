// Presentation only: the hand never advances the vine or spends water.
export const IDLE_GUIDE_DELAY=6;

export function guideSegmentClear(a,b,rocks){
  return !rocks.some(r=>{
    let enter=0,exit=1;
    for(const [axis,min,max] of [['x',r.x-5,r.x+r.w+5],['y',r.y-5,r.y+r.h+5]]){
      const delta=b[axis]-a[axis];
      if(Math.abs(delta)<1e-9){if(a[axis]<=min||a[axis]>=max)return false;continue;}
      let near=(min-a[axis])/delta,far=(max-a[axis])/delta;
      if(near>far)[near,far]=[far,near];
      enter=Math.max(enter,near);exit=Math.min(exit,far);
      if(enter>exit)return false;
    }
    return enter<=exit;
  });
}

// Visibility graph around static timber. Moving bugs remain live hazards, not predicted here.
export function findGuideRoute(g){
  const start=g.path.at(-1),goals=[...g.level.flowers.filter((_,i)=>!g.bloomed[i]),...g.level.dew.filter((_,i)=>!g.collected[i])];
  if(!goals.length)return null;
  const nodes=[start,...goals];
  for(const r of g.level.rocks)for(const x of [r.x-12,r.x+r.w+12])for(const y of [r.y-12,r.y+r.h+12]){
    if(x>=35&&x<=565&&y>=35&&y<=660)nodes.push({x,y});
  }
  const distances=nodes.map(()=>Infinity),previous=[],visited=new Set();distances[0]=0;
  while(visited.size<nodes.length){
    let index=-1;
    for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(index<0||distances[i]<distances[index]))index=i;
    if(index<0||!Number.isFinite(distances[index]))break;
    if(index>0&&index<=goals.length){
      const route=[];
      for(let at=index;at!==undefined;at=previous[at])route.unshift({...nodes[at]});
      return route;
    }
    visited.add(index);
    for(let i=1;i<nodes.length;i++){
      if(visited.has(i)||!guideSegmentClear(nodes[index],nodes[i],g.level.rocks))continue;
      const distance=distances[index]+Math.hypot(nodes[i].x-nodes[index].x,nodes[i].y-nodes[index].y);
      if(distance<distances[i]){distances[i]=distance;previous[i]=index;}
    }
  }
  return null;
}

export function createIdleGuide(){
  let idle=0,seconds=0,route=null,signature='';
  const key=g=>`${g.path.at(-1).x},${g.path.at(-1).y}:${g.bloomed.join(',')}:${g.collected.join(',')}`;
  return {
    reset(g,{immediate=false}={}){idle=immediate?IDLE_GUIDE_DELAY:0;seconds=0;signature=key(g);route=immediate?findGuideRoute(g):null;},
    update(g,{growing=false,dt=1/60}={}){
      const current=key(g);
      if(growing||current!==signature){idle=0;seconds=0;route=null;signature=current;return;}
      idle+=dt;
      if(idle>=IDLE_GUIDE_DELAY){if(!route)route=findGuideRoute(g);seconds+=dt;}
    },
    get route(){return route;},get seconds(){return seconds;}
  };
}

export function pointAlongGuide(route,fraction){
  const lengths=route.slice(1).map((p,i)=>Math.hypot(p.x-route[i].x,p.y-route[i].y));
  let remaining=lengths.reduce((a,b)=>a+b,0)*fraction;
  for(let i=0;i<lengths.length;i++){
    if(remaining<=lengths[i]&&lengths[i]>0){const t=remaining/lengths[i];return {x:route[i].x+(route[i+1].x-route[i].x)*t,y:route[i].y+(route[i+1].y-route[i].y)*t};}
    remaining-=lengths[i];
  }
  return {...route.at(-1)};
}

export function dragGuidePose(start,flower,seconds,{reducedMotion=false,route=[start,flower]}={}){
  const cycle=((seconds%3.2)+3.2)%3.2;
  const progress=reducedMotion ? .45 : Math.max(0,Math.min(1,(cycle-.45)/1.9));
  const eased=progress*progress*(3-2*progress);
  return {...pointAlongGuide(route,eased),
    alpha:reducedMotion?1:Math.min(1,cycle/.2,(3.2-cycle)/.3)};
}

export function renderDragGuide(c,image,start,flower,seconds,{reducedMotion=false,scale=1,route=[start,flower]}={}){
  if(!image)return;
  const pose=dragGuidePose(start,flower,seconds,{reducedMotion,route});
  c.save();c.globalAlpha=.45;c.strokeStyle='#e7e9cf';c.lineWidth=1.5/scale;c.setLineDash([3/scale,7/scale]);
  c.beginPath();route.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();c.setLineDash([]);
  // The fingertip is near the upper-left of the unmodified cursor sprite.
  const size=34/scale;
  c.globalAlpha=pose.alpha;c.drawImage(image,pose.x-size*.12,pose.y-size*.12,size,size);
  c.restore();
}
