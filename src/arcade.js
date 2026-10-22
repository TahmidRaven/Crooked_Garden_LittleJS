import { advance, createGarden, distance, GROW_SPEED } from './game.js';

export const BURST_COST=30, BURST_DURATION=.45, BURST_COOLDOWN=2, BURST_SPEED=280;
export const BUGS=[
  {cx:340,cy:410,range:100,rate:1.6,phase:0,radius:15},
  {cx:300,cy:235,range:110,rate:1.3,phase:1.1,radius:15}
];
const terminal=g=>['won','blocked','dry'].includes(g.status);
export function createArcade(){
  return Object.assign(createGarden(),{clock:0,bugClocks:BUGS.map(()=>0),started:false,burst:0,cooldown:0,queued:false,stunned:BUGS.map(()=>0),swatted:0,grace:0});
}
export function bugsAt(g){
  return BUGS.map((bug,i)=>({
    x:bug.cx+Math.sin(g.bugClocks[i]*bug.rate+bug.phase)*bug.range,
    y:bug.cy+Math.sin(g.bugClocks[i]*2.2+bug.phase)*10,
    radius:bug.radius,stunned:g.stunned[i]>0
  }));
}
export function queueBurst(g){
  if(terminal(g)||g.cooldown>0||g.burst>0||g.water<=BURST_COST)return false;
  g.queued=!g.queued;return true;
}
function bugContact(g){
  let event=null;
  for(const [i,bug] of bugsAt(g).entries()){
    if(bug.stunned||distance(g.path.at(-1),bug)>bug.radius+6)continue;
    if(g.burst>0){g.stunned[i]=1.5;g.swatted++;event='swat';}
    else if(g.grace<=0){g.status='blocked';g.endedBy='bug';return 'blocked';}
  }
  return event;
}
// The bugs keep moving after release; only an explicit pause freezes the world.
export function tickArcade(g,target,{growing=false}={},dt=1/60){
  if(terminal(g)||!Number.isFinite(dt)||dt<=0)return null;
  if(!g.started&&!growing)return null;
  g.started=true;
  if(g.queued&&growing){
    g.queued=false;
    if(g.cooldown<=0&&g.water>BURST_COST){g.water-=BURST_COST;g.burst=BURST_DURATION;g.cooldown=BURST_COOLDOWN;}
  }
  const elapsed=Math.min(dt,.05),steps=Math.ceil(BURST_SPEED*elapsed/2),step=elapsed/steps;
  let event=null;
  for(let i=0;i<steps;i++){
    g.clock+=step;g.burst=Math.max(0,g.burst-step);g.cooldown=Math.max(0,g.cooldown-step);g.grace=Math.max(0,g.grace-step);
    g.bugClocks=g.bugClocks.map((time,i)=>time+(g.stunned[i]>0?0:step));
    g.stunned=g.stunned.map(time=>Math.max(0,time-step));
    let contact=bugContact(g);
    if(contact==='blocked')return contact;
    event=contact||event;
    if(growing){
      const result=advance(g,target,step,g.burst>0?BURST_SPEED:GROW_SPEED);
      if(result==='flower'){
        // Each bloom creates a short safe window to reposition for the next objective.
        g.stunned=g.stunned.map(time=>Math.max(time,.8));g.cooldown=0;
      }
      event=result||event;
      if(terminal(g))return event;
    }
    contact=bugContact(g);
    if(contact==='blocked')return contact;
    event=contact||event;
  }
  return event;
}
