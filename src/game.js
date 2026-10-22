// Pure simulation; independent from rendering so gameplay can be tested deterministically.
export const WIDTH = 600, HEIGHT = 720;
export const MAX_WATER = 1100;
export const DEW_WATER = 260;
export const GROW_SPEED = 150;
export const TURN_SPEED = 16;
const TARGET_RADIUS = 5;

// One restoration experiment. The original three-level prototype is preserved in Git.
export const LEVELS = [{
  name: 'The forgotten courtyard',
  hint: 'Save one flower to clear. Save all three to restore the whole garden.',
  start: {x:300,y:635},
  water: 580,
  rocks: [{x:85,y:475,w:280,h:26},{x:280,y:310,w:235,h:26}],
  flowers: [
    {x:430,y:550,name:'Marigold',color:'#e2a347'},
    {x:205,y:390,name:'Poppy',color:'#dc826e'},
    {x:345,y:170,name:'Aster',color:'#b09bc8'}
  ],
  dew: [{x:500,y:435},{x:130,y:280}]
}];

export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export const bloomCount = g => g.bloomed.filter(Boolean).length;
export function hitsRock(p, rock, radius=5) {
  return p.x+radius>rock.x && p.x-radius<rock.x+rock.w && p.y+radius>rock.y && p.y-radius<rock.y+rock.h;
}
export function createGarden(index=0) {
  const level=LEVELS[index];
  return {
    index,level,path:[{...level.start}],heading:-Math.PI/2,water:level.water,
    collected:level.dew.map(()=>false),bloomed:level.flowers.map(()=>false),
    status:'ready',steps:0,history:[],endedBy:null
  };
}
export function finishGarden(g) {
  if(!bloomCount(g)||g.status==='won')return false;
  g.status='won';g.endedBy='finish';
  return true;
}
export function advance(g, target, dt=1/60) {
  if(!Number.isFinite(dt)||dt<=0) return null;
  if(['won','blocked','dry'].includes(g.status)) return null;
  // Faster growth still sweeps in <=2px increments so shelves/pickups cannot be skipped.
  const elapsed=Math.min(dt,.05),steps=Math.ceil(GROW_SPEED*elapsed/2);
  let event=null;
  for(let i=0;i<steps;i++){
    event=advanceStep(g,target,elapsed/steps)||event;
    if(['won','blocked','dry'].includes(g.status))return event;
  }
  return event;
}
function advanceStep(g,target,dt){
  const tip=g.path.at(-1);
  const remaining=distance(tip,target);
  if(remaining<TARGET_RADIUS) return null;
  g.status='growing';
  let delta=Math.atan2(target.y-tip.y,target.x-tip.x)-g.heading;
  delta=Math.atan2(Math.sin(delta),Math.cos(delta));
  const heading=g.heading+Math.max(-TURN_SPEED*dt,Math.min(TURN_SPEED*dt,delta));
  const length=Math.min(GROW_SPEED*dt,g.water,remaining);
  const next={x:tip.x+Math.cos(heading)*length,y:tip.y+Math.sin(heading)*length};
  if(next.x<42||next.x>558||next.y<45||next.y>655||g.level.rocks.some(r=>hitsRock(next,r))){
    g.status='blocked';return 'blocked';
  }
  g.history.push({water:g.water,collected:[...g.collected],bloomed:[...g.bloomed],heading:g.heading});
  g.heading=heading;g.path.push(next);g.water-=length;g.steps++;
  let event=null;
  g.level.dew.forEach((d,i)=>{
    if(!g.collected[i]&&distance(next,d)<24){
      g.collected[i]=true;g.water=Math.min(MAX_WATER,g.water+DEW_WATER);event='dew';
    }
  });
  g.level.flowers.forEach((flower,i)=>{
    if(!g.bloomed[i]&&distance(next,flower)<25){g.bloomed[i]=true;event='flower';}
  });
  if(bloomCount(g)===g.bloomed.length){g.status='won';g.endedBy='complete';return 'won';}
  if(g.water<=0){
    g.status=bloomCount(g)?'won':'dry';g.endedBy='water';
    return g.status;
  }
  return event;
}
export function rewind(g, count=85){
  let snapshot;
  for(let i=0;i<count&&g.path.length>1;i++){g.path.pop();snapshot=g.history.pop();g.steps--;}
  if(snapshot){g.water=snapshot.water;g.collected=snapshot.collected;g.bloomed=snapshot.bloomed;g.heading=snapshot.heading;}
  g.status='ready';g.endedBy=null;
}
