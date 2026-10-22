// Pure simulation; independent from rendering so gameplay can be tested deterministically.
export const WIDTH = 600, HEIGHT = 720;
export const MAX_WATER = 1100;
export const LEVELS = [
  { name: 'First light', hint: 'Weave right, then left. The dew will help you grow.', start: {x:300,y:635}, goal:{x:290,y:95}, water:780,
    rocks:[{x:85,y:475,w:280,h:26},{x:280,y:310,w:235,h:26}], dew:[{x:425,y:435},{x:205,y:280},{x:345,y:170}] },
  { name: 'A crooked little path', hint: 'Three shelves. A little patience. Plenty of room to bloom.', start:{x:250,y:635},goal:{x:390,y:90},water:820,
    rocks:[{x:65,y:510,w:295,h:26},{x:285,y:355,w:250,h:26},{x:65,y:205,w:270,h:26}],dew:[{x:425,y:465},{x:205,y:310},{x:405,y:170}] },
  { name:'Room to bloom', hint:'Take the long way home. Gather dew between the bends.',start:{x:350,y:635},goal:{x:275,y:90},water:850,
    rocks:[{x:280,y:530,w:255,h:26},{x:65,y:390,w:270,h:26},{x:285,y:245,w:250,h:26}],dew:[{x:205,y:485},{x:410,y:345},{x:205,y:200}] }
];
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export function hitsRock(p, rock, radius=5) { return p.x+radius>rock.x && p.x-radius<rock.x+rock.w && p.y+radius>rock.y && p.y-radius<rock.y+rock.h; }
export function createGarden(index=0) {
  const level=LEVELS[index];
  return {index,level,path:[{...level.start}],heading:-Math.PI/2,water:level.water,collected:level.dew.map(()=>false),status:'ready',steps:0,history:[]};
}
export function advance(g, target, dt=1/60) {
  if(!Number.isFinite(dt)||dt<=0) return null;
  if(g.status==='won'||g.status==='blocked'||g.status==='dry') return null;
  const tip=g.path.at(-1);
  if(distance(tip,target)<10) return null;
  g.status='growing';
  let delta=Math.atan2(target.y-tip.y,target.x-tip.x)-g.heading;
  delta=Math.atan2(Math.sin(delta),Math.cos(delta));
  const heading=g.heading+Math.max(-4.5*dt,Math.min(4.5*dt,delta));
  // Cap each step at 2px: prevents tunneling through thin obstacles after slow frames.
  const length=Math.min(2,74*dt,g.water);
  const next={x:tip.x+Math.cos(heading)*length,y:tip.y+Math.sin(heading)*length};
  if(next.x<42||next.x>558||next.y<45||next.y>655||g.level.rocks.some(r=>hitsRock(next,r))){g.status='blocked';return 'blocked';}
  g.history.push({water:g.water,collected:[...g.collected],heading:g.heading});
  g.heading=heading;g.path.push(next);g.water-=length;g.steps++;
  let event=null;
  g.level.dew.forEach((d,i)=>{if(!g.collected[i]&&distance(next,d)<24){g.collected[i]=true;g.water=Math.min(MAX_WATER,g.water+260);event='dew';}});
  if(distance(next,g.level.goal)<31){g.status='won';return 'won';}
  if(g.water<=0){g.status='dry';return 'dry';}
  return event;
}
export function rewind(g, count=85){
  let snapshot;
  for(let i=0;i<count&&g.path.length>1;i++){g.path.pop();snapshot=g.history.pop();g.steps--;}
  if(snapshot){g.water=snapshot.water;g.collected=snapshot.collected;g.heading=snapshot.heading;}
  g.status='ready';
}
