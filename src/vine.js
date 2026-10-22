// Render-only plant geometry. The simulation path remains the source of truth for hits/loops.
export const STEM_ROOT_RADIUS=4.8, STEM_TIP_RADIUS=1.35, LEAF_SPACING=34;
const caches=new WeakMap(),ribbonCache=new WeakMap(),captureCache=new WeakMap();
const clamp=v=>Math.max(0,Math.min(1,v));
const mix=(a,b,t)=>a+(b-a)*t;
const length=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function interpolate(a,b,t){return {x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),d:mix(a.d,b.d,t)};}

export function resamplePath(path,spacing=5){
  if(!Number.isFinite(spacing)||spacing<=0)throw new RangeError('Sample spacing must be positive.');
  if(!path.length)return {nodes:[],totalLength:0};
  const nodes=[{x:path[0].x,y:path[0].y,d:0}];let total=0,next=spacing;
  for(let i=1;i<path.length;i++){
    const a=path[i-1],b=path[i],segment=length(a,b);if(segment<1e-8)continue;
    while(next<=total+segment){const t=(next-total)/segment;nodes.push({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),d:next});next+=spacing;}
    total+=segment;
  }
  const tip=path.at(-1),last=nodes.at(-1);
  if(total-last.d>1e-7)nodes.push({x:tip.x,y:tip.y,d:total});
  else if(total>0){last.x=tip.x;last.y=tip.y;last.d=total;}
  return {nodes,totalLength:total};
}
export function stemRadius(distance,total){
  if(total<=0)return STEM_TIP_RADIUS;
  const maturity=Math.pow(clamp((total-distance)/Math.min(140,total)),.7);
  return mix(STEM_TIP_RADIUS,STEM_ROOT_RADIUS,maturity);
}
export function buildVineGeometry(path){
  const {nodes,totalLength}=resamplePath(path),smooth=[];
  if(nodes.length<3)smooth.push(...nodes.map(p=>({...p})));
  else{
    let start=nodes[0];smooth.push({...start});
    // Midpoint quadratic splines stay in their local control hull: no wide Catmull-Rom overshoot.
    for(let i=1;i<nodes.length-1;i++){
      const control=nodes[i],end=i===nodes.length-2?nodes.at(-1):interpolate(control,nodes[i+1],.5);
      for(const t of [.5,1]){
        const u=1-t;
        smooth.push({x:u*u*start.x+2*u*t*control.x+t*t*end.x,y:u*u*start.y+2*u*t*control.y+t*t*end.y,d:u*u*start.d+2*u*t*control.d+t*t*end.d});
      }
      start=end;
    }
  }
  const samples=smooth.map((p,i)=>{
    const a=smooth[Math.max(0,i-1)],b=smooth[Math.min(smooth.length-1,i+1)];
    const magnitude=length(a,b)||1,tx=(b.x-a.x)/magnitude,ty=(b.y-a.y)/magnitude;
    return {...p,tx,ty,nx:-ty,ny:tx,radius:stemRadius(p.d,totalLength)};
  });
  return {samples,totalLength};
}
export function sampleAtDistance(samples,d){
  if(!samples.length)return null;
  if(d<=0)return samples[0];if(d>=samples.at(-1).d)return samples.at(-1);
  let lo=0,hi=samples.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(samples[mid].d<d)lo=mid;else hi=mid;}
  const a=samples[lo],b=samples[hi],t=(d-a.d)/(b.d-a.d||1),p=interpolate(a,b,t);
  const segment=Math.hypot(b.x-a.x,b.y-a.y)||1,baseX=(b.x-a.x)/segment,baseY=(b.y-a.y)/segment;
  const dx=mix(a.tx??baseX,b.tx??baseX,t),dy=mix(a.ty??baseY,b.ty??baseY,t),magnitude=Math.hypot(dx,dy)||1;
  return {...p,tx:dx/magnitude,ty:dy/magnitude,nx:-dy/magnitude,ny:dx/magnitude,radius:mix(a.radius??0,b.radius??0,t)};
}
function variation(index,seed){let n=Math.imul(index+1,0x45d9f3b)^(seed>>>0);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967296;}
export function planLeaves(geometry,seed=0){
  const leaves=[];
  for(let index=0;;index++){
    const d=26+index*LEAF_SPACING+(variation(index,seed)-.5)*6;
    if(d>geometry.totalLength-7)break;
    const p=sampleAtDistance(geometry.samples,d),side=index%2?-1:1,v=variation(index+73,seed);
    leaves.push({...p,index,side,angle:Math.atan2(p.ty,p.tx)+side*(.85+v*.35),size:18+v*8,palette:Math.floor(variation(index+151,seed)*3),paired:index%4===2});
  }
  return leaves;
}
export function leafUnfurl(age,reducedMotion=false){const t=clamp(age/.45);return reducedMotion?1:t*t*(3-2*t);}
export function vineAppearance(g,{reducedMotion=false}={}){
  let cache=caches.get(g);
  if(!cache){cache={births:new Map()};caches.set(g,cache);}
  if(cache.pointCount!==g.path.length||cache.tip!==g.path.at(-1)){
    cache.geometry=buildVineGeometry(g.path);cache.leaves=planLeaves(cache.geometry,g.seed);
    cache.pointCount=g.path.length;cache.tip=g.path.at(-1);
    const active=new Set(cache.leaves.map(p=>p.index));
    for(const index of cache.births.keys())if(!active.has(index))cache.births.delete(index);
  }
  const clock=g.clock||0;
  const leaves=cache.leaves.map(p=>{
    if(!cache.births.has(p.index))cache.births.set(p.index,clock-Math.min(1,Math.max(0,cache.geometry.totalLength-p.d-7)/150));
    return {...p,unfurl:leafUnfurl(clock-cache.births.get(p.index),reducedMotion)};
  });
  return {geometry:cache.geometry,leaves};
}

function ribbon(samples,left,right,dx=0,dy=0){
  const path=new Path2D();
  const point=(p,f)=>({x:p.x+p.nx*p.radius*f+dx,y:p.y+p.ny*p.radius*f+dy});
  samples.forEach((p,i)=>{const q=point(p,typeof left==='function'?left(p):left);i?path.lineTo(q.x,q.y):path.moveTo(q.x,q.y);});
  for(let i=samples.length-1;i>=0;i--){const p=samples[i],q=point(p,typeof right==='function'?right(p):right);path.lineTo(q.x,q.y);}
  path.closePath();return path;
}
function pathsFor(geometry){
  let paths=ribbonCache.get(geometry);if(paths)return paths;
  const s=geometry.samples,lit=p=>(p.nx*-.65+p.ny*-.75)*.42;
  paths={shadow:ribbon(s,1.15,-1.15,1,1.8),rim:ribbon(s,1,-1),body:ribbon(s,.82,-.82),highlight:ribbon(s,p=>lit(p)+.2,p=>lit(p)-.2)};
  ribbonCache.set(geometry,paths);return paths;
}
const palettes=[['#b4d97c','#7fac50','#436d37'],['#a9cf70','#6f9f4b','#365d35'],['#d0dc8a','#8fae56','#536e38']];
function botanicalLeaf(c,node,size=node.size,angle=node.angle){
  const progress=node.unfurl,fold=node.side*(1-progress)*.55;
  c.save();c.translate(node.x,node.y);c.rotate(angle+fold);
  c.strokeStyle='#688c49';c.lineWidth=1.3;c.beginPath();c.moveTo(-1,0);c.quadraticCurveTo(2,-.7,5,0);c.stroke();c.translate(4,0);
  c.scale(.3+.7*progress,.08+.92*progress);
  const colors=palettes[node.palette],gradient=c.createLinearGradient(0,-size*.4,0,size*.35);
  gradient.addColorStop(0,colors[0]);gradient.addColorStop(.5,colors[1]);gradient.addColorStop(1,colors[2]);
  c.fillStyle=gradient;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(size*.22,-size*.48,size*.76,-size*.42,size,0);c.bezierCurveTo(size*.7,size*.38,size*.2,size*.32,0,0);c.fill();
  c.strokeStyle='#30583288';c.lineWidth=.65;c.stroke();
  if(progress>.4){
    c.strokeStyle='#edf2b370';c.lineWidth=.65;c.beginPath();c.moveTo(1,0);c.quadraticCurveTo(size*.5,-size*.035,size*.91,0);
    for(const t of [.33,.58])for(const side of [-1,1]){c.moveTo(size*t,0);c.quadraticCurveTo(size*(t+.04),size*.07*side,size*(t+.16),size*(.19-t*.09)*side);}
    c.stroke();
  }
  c.restore();
}
export function renderVine(c,g,{reducedMotion=false}={}){
  const {geometry,leaves}=vineAppearance(g,{reducedMotion});if(geometry.samples.length<2)return;
  const paths=pathsFor(geometry),gradient=c.createLinearGradient(0,0,0,720);
  gradient.addColorStop(0,'#a8d57b');gradient.addColorStop(.55,'#86b65b');gradient.addColorStop(1,'#638e49');
  c.fillStyle='#021a1880';c.fill(paths.shadow);c.fillStyle='#2b5634';c.fill(paths.rim);
  c.fillStyle=g.burst>0?'#e3cc79':gradient;c.fill(paths.body);c.fillStyle=g.burst>0?'#fff1b3bb':'#d9ec9b99';c.fill(paths.highlight);
  c.strokeStyle='#284d3266';c.lineWidth=.8;c.beginPath();
  for(const p of leaves){c.moveTo(p.x-p.nx*p.radius*.8,p.y-p.ny*p.radius*.8);c.quadraticCurveTo(p.x+p.tx*1.5,p.y+p.ty*1.5,p.x+p.nx*p.radius*.8,p.y+p.ny*p.radius*.8);}
  c.stroke();
  for(const p of leaves){botanicalLeaf(c,p);if(p.paired)botanicalLeaf(c,{...p,side:-p.side},p.size*.57,Math.atan2(p.ty,p.tx)-p.side*1.05);}
}
export function renderVineTip(c,g,{reducedMotion=false,phase='playing'}={}){
  const tip=g.path.at(-1);if(!tip)return;
  const breathe=phase==='playing'&&!reducedMotion?Math.sin((g.clock||0)*7)*.04:0;
  c.save();c.translate(tip.x,tip.y);c.rotate(g.heading);c.scale(1+breathe,1-breathe);
  const bud=c.createLinearGradient(-3,-6,3,6);bud.addColorStop(0,g.burst>0?'#fff1bc':'#e5efaf');bud.addColorStop(.5,g.burst>0?'#e2c66c':'#a3c76b');bud.addColorStop(1,'#5a8a47');
  c.fillStyle=bud;c.strokeStyle='#47703b';c.lineWidth=.8;c.beginPath();c.moveTo(-6,0);c.bezierCurveTo(-4,-6,6,-7,10,0);c.bezierCurveTo(5,6,-4,5,-6,0);c.fill();c.stroke();
  c.strokeStyle='#f2f2b9aa';c.lineWidth=.7;c.beginPath();c.moveTo(-4,0);c.quadraticCurveTo(2,-1,8,0);c.stroke();
  for(const side of [-1,1]){c.save();c.translate(-5,0);c.rotate(side*.85);c.fillStyle=side<0?'#9ec46a':'#729e50';c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(4,-4*side,9,0);c.quadraticCurveTo(4,2*side,0,0);c.fill();c.restore();}
  c.restore();
}
export function renderCaptureFlow(c,capture,age,{reducedMotion=false}={}){
  if(reducedMotion||age<0||age>1.35)return;
  let cache=captureCache.get(capture);
  if(!cache){cache=resamplePath([...capture.polygon,capture.polygon[0]],5);captureCache.set(capture,cache);}
  if(!cache.totalLength)return;
  c.save();const alpha=c.globalAlpha*(1-age/1.35);
  for(let i=5;i>=0;i--){
    if(age<i*.025)continue;
    const d=((age/.95*cache.totalLength-i*10)%cache.totalLength+cache.totalLength)%cache.totalLength,p=sampleAtDistance(cache.nodes,d);
    c.globalAlpha=alpha*(1-i*.13);c.fillStyle=i?'#edda8a':'#fff5be';c.beginPath();c.arc(p.x,p.y,i?2.5:4,0,Math.PI*2);c.fill();
  }
  c.restore();
}
