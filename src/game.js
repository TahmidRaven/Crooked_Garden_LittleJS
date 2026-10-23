// Pure simulation; independent from rendering so gameplay can be tested deterministically.
export const WIDTH = 600, HEIGHT = 720;
export const MAX_WATER = 1100;
export const DEW_WATER = 260;
export const GROW_SPEED = 150;
export const TURN_SPEED = 16;
const TARGET_RADIUS = 5;

// Three gardens, each with a distinct route and enemy roaming regions.
export const LEVELS = [{
  name: 'Moonlit clearing',
  hint: 'Wake all three flowers. Outgrow the swarm.',
  start: {x:300,y:635},
  water: 720,
  rocks: [{x:85,y:475,w:280,h:26},{x:280,y:310,w:235,h:26}],
  flowers: [
    {x:430,y:550,name:'Marigold',color:'#e2a347'},
    {x:205,y:390,name:'Poppy',color:'#dc826e'},
    {x:345,y:170,name:'Aster',color:'#b09bc8'}
  ],
  dew: [{x:500,y:435},{x:130,y:280}],
  // Shared capture arena: the first garden allows a two-bug lasso without spanning terrain.
  enemyZones:[{left:100,right:520,top:365,bottom:445},{left:140,right:500,top:365,bottom:445}]
},{
  name:'The overgrown terraces',hint:'Three ledges. Keep your burst ready.',
  start:{x:250,y:635},water:760,
  rocks:[{x:65,y:510,w:295,h:26},{x:285,y:355,w:250,h:26},{x:65,y:205,w:270,h:26}],
  flowers:[{x:425,y:570,name:'Marigold',color:'#e2a347'},{x:205,y:420,name:'Poppy',color:'#dc826e'},{x:405,y:160,name:'Aster',color:'#b09bc8'}],
  dew:[{x:425,y:455},{x:205,y:300},{x:405,y:170}],
  enemyZones:[{left:100,right:510,top:400,bottom:475},{left:85,right:520,top:255,bottom:315}]
},{
  name:'Heart of the wild',hint:'The whole garden is awake. So is everything in it.',
  start:{x:350,y:635},water:800,
  rocks:[{x:280,y:530,w:255,h:26},{x:65,y:390,w:270,h:26},{x:285,y:245,w:250,h:26}],
  flowers:[{x:205,y:590,name:'Marigold',color:'#e2a347'},{x:410,y:450,name:'Poppy',color:'#dc826e'},{x:205,y:190,name:'Aster',color:'#b09bc8'}],
  dew:[{x:205,y:485},{x:410,y:345},{x:205,y:200}],
  enemyZones:[{left:85,right:520,top:440,bottom:500},{left:80,right:520,top:290,bottom:350},{left:90,right:520,top:110,bottom:200}]
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
export function advance(g, target, dt=1/60, speed=GROW_SPEED) {
  if(!Number.isFinite(dt)||dt<=0||!Number.isFinite(speed)||speed<=0) return null;
  if(['won','blocked','dry'].includes(g.status)) return null;
  // Faster growth still sweeps in <=2px increments so shelves/pickups cannot be skipped.
  const elapsed=Math.min(dt,.05),steps=Math.ceil(speed*elapsed/2);
  let event=null;
  for(let i=0;i<steps;i++){
    event=advanceStep(g,target,elapsed/steps,speed)||event;
    if(['won','blocked','dry'].includes(g.status))return event;
  }
  return event;
}
function advanceStep(g,target,dt,speed){
  const tip=g.path.at(-1);
  const remaining=distance(tip,target);
  if(remaining<TARGET_RADIUS) return null;
  g.status='growing';
  let delta=Math.atan2(target.y-tip.y,target.x-tip.x)-g.heading;
  delta=Math.atan2(Math.sin(delta),Math.cos(delta));
  const heading=g.heading+Math.max(-TURN_SPEED*dt,Math.min(TURN_SPEED*dt,delta));
  const length=Math.min(speed*dt,g.water,remaining);
  const next={x:tip.x+Math.cos(heading)*length,y:tip.y+Math.sin(heading)*length};
  if(next.x<42||next.x>558||next.y<45||next.y>655||g.level.rocks.some(r=>hitsRock(next,r))){
    g.status='blocked';return 'blocked';
  }
  g.history.push({water:g.water,collected:[...g.collected],bloomed:[...g.bloomed],heading:g.heading,captureWater:g.captureWaterTotal||0});
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
    g.status='dry';g.endedBy='water';return 'dry';
  }
  return event;
}
export function rewind(g, count=85){
  let snapshot;
  for(let i=0;i<count&&g.path.length>1;i++){g.path.pop();snapshot=g.history.pop();g.steps--;}
  if(snapshot){
    // Captures are permanent for this attempt. Preserve only the water actually credited,
    // not nominal rewards clipped by the water cap, when restoring older growth history.
    const captureCredit=Math.max(0,(g.captureWaterTotal||0)-(snapshot.captureWater||0));
    g.water=Math.min(MAX_WATER,snapshot.water+captureCredit);g.collected=snapshot.collected;g.bloomed=snapshot.bloomed;g.heading=snapshot.heading;
  }
  if(Number.isInteger(g.loopStart)){g.loopStart=Math.min(g.loopStart,g.path.length-1);g.loopHint=null;}
  g.status='ready';g.endedBy=null;
}
